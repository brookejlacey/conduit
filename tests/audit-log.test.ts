import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';

describe('audit-log', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AuditLog as Program;
  const agent = Keypair.generate();
  const institution = Keypair.generate();
  let nonce = 0;

  before(async () => {
    await provider.connection.requestAirdrop(agent.publicKey, 10 * LAMPORTS_PER_SOL);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('logs a settlement event', async () => {
    const nonceBn = new anchor.BN(nonce);

    const [auditPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('audit'), agent.publicKey.toBuffer(), nonceBn.toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    const targetVault = Keypair.generate().publicKey;
    const amount = new anchor.BN(780_000_000); // 780 USX
    const reasoningHash = Buffer.alloc(32, 0xde);
    const reasoningUri = Buffer.alloc(64, 0);
    Buffer.from('conduit://reasoning/abc123').copy(reasoningUri);

    await program.methods
      .logEvent(
        3, // Settlement
        targetVault,
        amount,
        Array.from(reasoningHash),
        Array.from(reasoningUri),
        nonceBn,
      )
      .accounts({
        auditEntry: auditPda,
        agent: agent.publicKey,
        institution: institution.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    const entry = await program.account.auditEntry.fetch(auditPda);
    expect(entry.agent.toBase58()).to.equal(agent.publicKey.toBase58());
    expect(entry.institution.toBase58()).to.equal(institution.publicKey.toBase58());
    expect(entry.actionType).to.equal(3);
    expect(entry.targetVault.toBase58()).to.equal(targetVault.toBase58());
    expect(entry.amount.toNumber()).to.equal(780_000_000);
    expect(entry.slot.toNumber()).to.be.greaterThan(0);

    nonce++;
  });

  it('logs an event without optional fields', async () => {
    const nonceBn = new anchor.BN(nonce);

    const [auditPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('audit'), agent.publicKey.toBuffer(), nonceBn.toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    const reasoningHash = Buffer.alloc(32, 0xfe);
    const reasoningUri = Buffer.alloc(64, 0);
    Buffer.from('conduit://reasoning/compliance-scan').copy(reasoningUri);

    await program.methods
      .logEvent(
        4, // Policy Update
        null, // no target vault
        null, // no amount
        Array.from(reasoningHash),
        Array.from(reasoningUri),
        nonceBn,
      )
      .accounts({
        auditEntry: auditPda,
        agent: agent.publicKey,
        institution: institution.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    const entry = await program.account.auditEntry.fetch(auditPda);
    expect(entry.actionType).to.equal(4);
    expect(entry.targetVault).to.be.null;
    expect(entry.amount).to.be.null;

    nonce++;
  });

  it('rejects invalid action type', async () => {
    const nonceBn = new anchor.BN(nonce);

    const [auditPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('audit'), agent.publicKey.toBuffer(), nonceBn.toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    const reasoningHash = Buffer.alloc(32, 0xaa);
    const reasoningUri = Buffer.alloc(64, 0);

    try {
      await program.methods
        .logEvent(
          99, // invalid
          null,
          null,
          Array.from(reasoningHash),
          Array.from(reasoningUri),
          nonceBn,
        )
        .accounts({
          auditEntry: auditPda,
          agent: agent.publicKey,
          institution: institution.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail('Should have thrown InvalidActionType error');
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal('InvalidActionType');
    }
  });
});
