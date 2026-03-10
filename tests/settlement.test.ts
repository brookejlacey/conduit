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
  const creator = Keypair.generate();
  const oracle = Keypair.generate();
  const batchId = new anchor.BN(1);
  let batchPda: PublicKey;
  let usxMint: PublicKey;
  let fromTokenAccount: PublicKey;
  let toTokenAccount: PublicKey;

  before(async () => {
    await provider.connection.requestAirdrop(creator.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(oracle.publicKey, 5 * LAMPORTS_PER_SOL);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    [batchPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('batch'), creator.publicKey.toBuffer(), batchId.toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    // Create USX mint and accounts for settlement
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
    const entryIndex = 0;
    const indexBuffer = Buffer.alloc(4);
    indexBuffer.writeUInt32LE(entryIndex, 0);

    const [entryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('entry'), batchPda.toBuffer(), indexBuffer],
      program.programId,
    );

    const fromVault = Keypair.generate().publicKey;
    const toVault = Keypair.generate().publicKey;
    const amount = new anchor.BN(500_000_000); // 500 USX
    const destCurrency = [0x45, 0x55, 0x52]; // "EUR"
    const fxRate = new anchor.BN(92_000_000); // 0.92
    const netOffset = new anchor.BN(460_000_000); // 460 USX equivalent

    await program.methods
      .addEntry(amount, destCurrency, fxRate, netOffset)
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

    const entry = await program.account.settlementEntry.fetch(entryPda);
    expect(entry.amountUsx.toNumber()).to.equal(500_000_000);
    expect(entry.fxRate.toNumber()).to.equal(92_000_000);
  });

  it('executes the settlement', async () => {
    await program.methods
      .executeSettlement()
      .accounts({
        batch: batchPda,
        fromTokenAccount: fromTokenAccount,
        toTokenAccount: toTokenAccount,
        vaultAuthority: creator.publicKey,
        creator: creator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    const batch = await program.account.settlementBatch.fetch(batchPda);
    expect(JSON.stringify(batch.status)).to.include('settled');
    expect(batch.settledAt.toNumber()).to.be.greaterThan(0);
  });

  it('updates FX rate', async () => {
    const pair = [0x55, 0x53, 0x44, 0x45, 0x55, 0x52]; // "USDEUR"

    const [fxRatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('fx_rate'), Buffer.from(pair)],
      program.programId,
    );

    const rate = new anchor.BN(92_500_000); // 0.925

    await program.methods
      .updateFxRate(pair, rate)
      .accounts({
        fxRate: fxRatePda,
        oracle: oracle.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([oracle])
      .rpc();

    const fxRate = await program.account.fxRate.fetch(fxRatePda);
    expect(fxRate.rate.toNumber()).to.equal(92_500_000);
    expect(fxRate.oracle.toBase58()).to.equal(oracle.publicKey.toBase58());
  });
});
