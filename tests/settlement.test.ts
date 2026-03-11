import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
} from '@solana/spl-token';
import { expect } from 'chai';

describe('settlement', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Settlement as Program;
  const vaultProgram = anchor.workspace.Vault as Program;
  const creator = Keypair.generate();
  const admin = Keypair.generate();
  const toVaultAuthority = Keypair.generate();
  const batchId = new anchor.BN(1);
  let batchPda: PublicKey;
  let configPda: PublicKey;
  let usxMint: PublicKey;
  let fromTokenAccount: PublicKey;
  let toTokenAccount: PublicKey;
  let fromVaultPda: PublicKey;
  let toVaultPda: PublicKey;

  before(async () => {
    await provider.connection.requestAirdrop(creator.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(toVaultAuthority.publicKey, 10 * LAMPORTS_PER_SOL);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    [batchPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('batch'), creator.publicKey.toBuffer(), batchId.toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId,
    );

    // Create USX mint and token accounts for settlement execution
    usxMint = await createMint(provider.connection, creator, creator.publicKey, null, 6);

    fromTokenAccount = await createAccount(
      provider.connection,
      creator,
      usxMint,
      creator.publicKey,
    );

    toTokenAccount = await createAccount(
      provider.connection,
      creator,
      usxMint,
      Keypair.generate().publicKey,
    );

    await mintTo(provider.connection, creator, usxMint, fromTokenAccount, creator, 10_000_000_000);

    // Initialize real vault accounts via vault program so they're owned by it
    [fromVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), creator.publicKey.toBuffer()],
      vaultProgram.programId,
    );
    [toVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), toVaultAuthority.publicKey.toBuffer()],
      vaultProgram.programId,
    );

    const fromVaultTokenKeypair = Keypair.generate();
    const fromVaultTokenAccount = await createAccount(
      provider.connection,
      creator,
      usxMint,
      fromVaultPda,
      fromVaultTokenKeypair,
    );

    const toVaultTokenKeypair = Keypair.generate();
    const toVaultTokenAccount = await createAccount(
      provider.connection,
      toVaultAuthority,
      usxMint,
      toVaultPda,
      toVaultTokenKeypair,
    );

    const counterparty = Keypair.generate().publicKey;
    const policy = {
      dailySpendLimit: new anchor.BN(5_000_000_000),
      maxSingleTxSize: new anchor.BN(1_000_000_000),
      approvedCounterparties: [counterparty],
      allowedTxTypes: 0b1111,
      dailySpent: new anchor.BN(0),
      lastResetTs: new anchor.BN(0),
    };

    await vaultProgram.methods
      .initializeVault(policy, [creator.publicKey], 1, creator.publicKey)
      .accounts({
        vault: fromVaultPda,
        usxTokenAccount: fromVaultTokenAccount,
        authority: creator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    await vaultProgram.methods
      .initializeVault(policy, [toVaultAuthority.publicKey], 1, toVaultAuthority.publicKey)
      .accounts({
        vault: toVaultPda,
        usxTokenAccount: toVaultTokenAccount,
        authority: toVaultAuthority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([toVaultAuthority])
      .rpc();
  });

  it('initializes settlement config', async () => {
    const maxFxRateAge = new anchor.BN(3600);

    await program.methods
      .initializeConfig(maxFxRateAge)
      .accounts({
        config: configPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const config = await program.account.settlementConfig.fetch(configPda);
    expect(config.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(config.maxFxRateAge.toNumber()).to.equal(3600);
  });

  it('creates a settlement batch', async () => {
    await program.methods
      .createBatch(batchId)
      .accounts({
        batch: batchPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const batch = await program.account.settlementBatch.fetch(batchPda);
    expect(batch.id.toNumber()).to.equal(1);
    expect(batch.entryCount).to.equal(0);
    expect(batch.totalGross.toNumber()).to.equal(0);
    expect(JSON.stringify(batch.status)).to.include('open');
  });

  it('adds an entry to the batch', async () => {
    // First, create a vault so we have a valid vault account owned by the vault program
    // For testing, we use the vault program's accounts if available,
    // or use the creator's pubkey as a stand-in (the vault program ownership check
    // requires accounts actually owned by the vault program)

    const entryIndex = 0;
    const indexBuffer = Buffer.alloc(4);
    indexBuffer.writeUInt32LE(entryIndex, 0);

    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('entry'), batchPda.toBuffer(), indexBuffer],
      program.programId,
    );

    // Use the vault accounts initialized in before() hook
    const fromVault = fromVaultPda;
    const toVault = toVaultPda;

    const amount = new anchor.BN(500_000_000); // 500 USX
    const destCurrency = [0x45, 0x55, 0x52]; // "EUR"
    const fxRate = new anchor.BN(92_000_000); // 0.92

    // Note: net_offset is now computed on-chain from amount * fx_rate / 1e8
    // Expected: 500_000_000 * 92_000_000 / 100_000_000 = 460_000_000
    await program.methods
      .addEntry(amount, destCurrency, fxRate)
      .accounts({
        batch: batchPda,
        entry: entryPda,
        fromVault: fromVault,
        toVault: toVault,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const batch = await program.account.settlementBatch.fetch(batchPda);
    expect(batch.entryCount).to.equal(1);
    expect(batch.totalGross.toNumber()).to.equal(500_000_000);
    // Net should be computed on-chain: 500M * 92M / 100M = 460M
    expect(batch.totalNet.toNumber()).to.equal(460_000_000);

    const entry = await program.account.settlementEntry.fetch(entryPda);
    expect(entry.amountUsx.toNumber()).to.equal(500_000_000);
    expect(entry.fxRate.toNumber()).to.equal(92_000_000);
    expect(entry.netOffset.toNumber()).to.equal(460_000_000);
  });

  it('executes the settlement', async () => {
    await program.methods
      .executeSettlement()
      .accounts({
        batch: batchPda,
        fromTokenAccount: fromTokenAccount,
        toTokenAccount: toTokenAccount,
        creator: creator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    const batch = await program.account.settlementBatch.fetch(batchPda);
    expect(JSON.stringify(batch.status)).to.include('settled');
    expect(batch.settledAt.toNumber()).to.be.greaterThan(0);
  });

  it('updates FX rate with admin as oracle', async () => {
    const pair = [0x55, 0x53, 0x44, 0x45, 0x55, 0x52]; // "USDEUR"

    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('fx_rate'), Buffer.from(pair)],
      program.programId,
    );

    const rate = new anchor.BN(92_500_000); // 0.925

    // Admin must create new FX rate pairs
    await program.methods
      .updateFxRate(pair, rate)
      .accounts({
        fxRate: fxRatePda,
        config: configPda,
        oracle: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const fxRate = await program.account.fxRate.fetch(fxRatePda);
    expect(fxRate.rate.toNumber()).to.equal(92_500_000);
    expect(fxRate.oracle.toBase58()).to.equal(admin.publicKey.toBase58());
  });

  it('rejects FX rate update from non-admin for new pairs', async () => {
    const pair = [0x55, 0x53, 0x44, 0x47, 0x42, 0x50]; // "USDGBP"
    const nonAdmin = Keypair.generate();

    await provider.connection.requestAirdrop(nonAdmin.publicKey, 2 * LAMPORTS_PER_SOL);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('fx_rate'), Buffer.from(pair)],
      program.programId,
    );

    const rate = new anchor.BN(79_000_000);

    try {
      await program.methods
        .updateFxRate(pair, rate)
        .accounts({
          fxRate: fxRatePda,
          config: configPda,
          oracle: nonAdmin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([nonAdmin])
        .rpc();
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as Error).toString()).to.include('AdminRequired');
    }
  });
});
