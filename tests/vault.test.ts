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
  getAccount,
} from '@solana/spl-token';
import { expect } from 'chai';

describe('vault', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program;
  const authority = Keypair.generate();
  const depositor = Keypair.generate();
  let usxMint: PublicKey;
  let vaultTokenAccount: PublicKey;
  let depositorTokenAccount: PublicKey;
  let vaultPda: PublicKey;
  let vaultBump: number;

  const counterparty = Keypair.generate().publicKey;

  before(async () => {
    // Airdrop SOL to authority and depositor
    await provider.connection.requestAirdrop(authority.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(depositor.publicKey, 10 * LAMPORTS_PER_SOL);

    // Wait for confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create USX mint
    usxMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
    );

    // Derive vault PDA
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), authority.publicKey.toBuffer()],
      program.programId,
    );

    // Create token accounts
    vaultTokenAccount = await createAccount(
      provider.connection,
      authority,
      usxMint,
      vaultPda,
    );

    depositorTokenAccount = await createAccount(
      provider.connection,
      depositor,
      usxMint,
      depositor.publicKey,
    );

    // Mint tokens to depositor
    await mintTo(
      provider.connection,
      authority,
      usxMint,
      depositorTokenAccount,
      authority,
      10_000_000_000, // 10,000 USX
    );
  });

  it('initializes a vault', async () => {
    const policy = {
      dailySpendLimit: new anchor.BN(5_000_000_000), // 5000 USX
      maxSingleTxSize: new anchor.BN(1_000_000_000), // 1000 USX
      approvedCounterparties: [counterparty],
      allowedTxTypes: 0b1111,
      dailySpent: new anchor.BN(0),
      lastResetTs: new anchor.BN(0),
    };

    await program.methods
      .initializeVault(policy, [authority.publicKey], 1, authority.publicKey)
      .accounts({
        vault: vaultPda,
        usxTokenAccount: vaultTokenAccount,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    expect(vaultAccount.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(vaultAccount.totalDeposits.toNumber()).to.equal(0);
    expect(vaultAccount.multisigThreshold).to.equal(1);
    expect(vaultAccount.policy.dailySpendLimit.toNumber()).to.equal(5_000_000_000);
  });

  it('deposits USX into vault', async () => {
    const amount = new anchor.BN(1_000_000_000); // 1000 USX
    const kycHash = Buffer.alloc(32, 1); // Non-zero KYC hash

    const [depositPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('deposit'),
        vaultPda.toBuffer(),
        depositor.publicKey.toBuffer(),
        new anchor.BN(0).toArrayLike(Buffer, 'le', 8),
      ],
      program.programId,
    );

    await program.methods
      .deposit(amount, Array.from(kycHash))
      .accounts({
        vault: vaultPda,
        depositReceipt: depositPda,
        depositorTokenAccount: depositorTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
        depositor: depositor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([depositor])
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    expect(vaultAccount.totalDeposits.toNumber()).to.equal(1_000_000_000);

    const receipt = await program.account.depositReceipt.fetch(depositPda);
    expect(receipt.amount.toNumber()).to.equal(1_000_000_000);
    expect(receipt.depositor.toBase58()).to.equal(depositor.publicKey.toBase58());
  });

  it('rejects deposit without KYC', async () => {
    const amount = new anchor.BN(500_000_000);
    const zeroKycHash = Buffer.alloc(32, 0);

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    const [depositPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('deposit'),
        vaultPda.toBuffer(),
        depositor.publicKey.toBuffer(),
        vaultAccount.totalDeposits.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId,
    );

    try {
      await program.methods
        .deposit(amount, Array.from(zeroKycHash))
        .accounts({
          vault: vaultPda,
          depositReceipt: depositPda,
          depositorTokenAccount: depositorTokenAccount,
          vaultTokenAccount: vaultTokenAccount,
          depositor: depositor.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([depositor])
        .rpc();
      expect.fail('Should have thrown KycRequired error');
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal('KycRequired');
    }
  });

  it('withdraws with policy checks', async () => {
    const amount = new anchor.BN(100_000_000); // 100 USX

    const destinationTokenAccount = await createAccount(
      provider.connection,
      authority,
      usxMint,
      authority.publicKey,
    );

    await program.methods
      .withdraw(amount, 0, counterparty) // tx_type 0 = standard transfer
      .accounts({
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        destinationTokenAccount: destinationTokenAccount,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    expect(vaultAccount.totalDeposits.toNumber()).to.equal(900_000_000);
  });

  it('rejects withdrawal to unapproved counterparty', async () => {
    const amount = new anchor.BN(100_000_000);
    const unapprovedCounterparty = Keypair.generate().publicKey;

    const destinationTokenAccount = await createAccount(
      provider.connection,
      authority,
      usxMint,
      authority.publicKey,
    );

    try {
      await program.methods
        .withdraw(amount, 0, unapprovedCounterparty)
        .accounts({
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          destinationTokenAccount: destinationTokenAccount,
          authority: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();
      expect.fail('Should have thrown CounterpartyNotApproved error');
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal('CounterpartyNotApproved');
    }
  });

  it('withdraws from yield before deposits', async () => {
    // First accrue some yield so we can withdraw from it
    const yieldSource = await createAccount(
      provider.connection,
      authority,
      usxMint,
      authority.publicKey,
    );
    await mintTo(provider.connection, authority, usxMint, yieldSource, authority, 500_000_000);

    await program.methods
      .accrueYield(new anchor.BN(500_000_000)) // 500 USX yield
      .accounts({
        vault: vaultPda,
        yieldSourceTokenAccount: yieldSource,
        vaultTokenAccount: vaultTokenAccount,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    const vaultBefore = await program.account.vault.fetch(vaultPda);
    const depositsBefore = vaultBefore.totalDeposits.toNumber();
    const yieldBefore = vaultBefore.yieldAccrued.toNumber();
    expect(yieldBefore).to.equal(500_000_000);

    // Withdraw 200 USX — should come from yield first
    const dest = await createAccount(provider.connection, authority, usxMint, authority.publicKey);
    await program.methods
      .withdraw(new anchor.BN(200_000_000), 0, counterparty)
      .accounts({
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        destinationTokenAccount: dest,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    const vaultAfter = await program.account.vault.fetch(vaultPda);
    expect(vaultAfter.yieldAccrued.toNumber()).to.equal(300_000_000); // 500 - 200
    expect(vaultAfter.totalDeposits.toNumber()).to.equal(depositsBefore); // deposits unchanged
  });

  it('withdraws from yield then deposits for amounts exceeding yield', async () => {
    const vaultBefore = await program.account.vault.fetch(vaultPda);
    const yieldBefore = vaultBefore.yieldAccrued.toNumber(); // 300M from previous test
    const depositsBefore = vaultBefore.totalDeposits.toNumber();

    // Withdraw 500 USX — 300 from yield, 200 from deposits
    const dest = await createAccount(provider.connection, authority, usxMint, authority.publicKey);
    await program.methods
      .withdraw(new anchor.BN(500_000_000), 0, counterparty)
      .accounts({
        vault: vaultPda,
        vaultTokenAccount: vaultTokenAccount,
        destinationTokenAccount: dest,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    const vaultAfter = await program.account.vault.fetch(vaultPda);
    expect(vaultAfter.yieldAccrued.toNumber()).to.equal(0);
    expect(vaultAfter.totalDeposits.toNumber()).to.equal(depositsBefore - 200_000_000);
  });

  it('rejects forbidden transaction type', async () => {
    const amount = new anchor.BN(100_000_000);

    const destinationTokenAccount = await createAccount(
      provider.connection,
      authority,
      usxMint,
      authority.publicKey,
    );

    try {
      await program.methods
        .withdraw(amount, 7, counterparty) // tx_type 7 = not in bitmask
        .accounts({
          vault: vaultPda,
          vaultTokenAccount: vaultTokenAccount,
          destinationTokenAccount: destinationTokenAccount,
          authority: authority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();
      expect.fail('Should have thrown TxTypeForbidden error');
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal('TxTypeForbidden');
    }
  });
});
