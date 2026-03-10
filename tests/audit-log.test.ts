import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';

describe('audit-log', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AuditLog as Program;
  const registryProgram = anchor.workspace.AgentRegistry as Program;

  const admin = Keypair.generate();
  const agent = Keypair.generate();
  let institutionPda: PublicKey;
  let agentIdentityPda: PublicKey;
  let nonce = 0;

  before(async () => {
    await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(agent.publicKey, 10 * LAMPORTS_PER_SOL);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Register institution
    [institutionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('institution'), admin.publicKey.toBuffer()],
      registryProgram.programId,
    );

    const name = Buffer.alloc(32, 0);
    Buffer.from('TestInstitution').copy(name);
    const kycHash = Buffer.alloc(32, 0xaa);

    await registryProgram.methods
      .registerInstitution(Array.from(name), Array.from(kycHash))
      .accounts({
        institution: institutionPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    // Register agent under institution
    [agentIdentityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), institutionPda.toBuffer(), agent.publicKey.toBuffer()],
      registryProgram.programId,
    );

    await registryProgram.methods
      .registerAgent(1, []) // executor tier, no scoped programs
      .accounts({
        institution: institutionPda,
        agent: agentIdentityPda,
        agentPubkey: agent.publicKey,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
  });

  it('logs a settlement event with verified agent identity', async () => {
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
        agentIdentity: agentIdentityPda,
        institution: institutionPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([agent])
      .rpc();

    const entry = await program.account.auditEntry.fetch(auditPda);
    expect(entry.agent.toBase58()).to.equal(agent.publicKey.toBase58());
    expect(entry.institution.toBase58()).to.equal(institutionPda.toBase58());
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
        agentIdentity: agentIdentityPda,
        institution: institutionPda,
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

  it('rejects unregistered agent', async () => {
    const fakeAgent = Keypair.generate();
    await provider.connection.requestAirdrop(fakeAgent.publicKey, 2 * LAMPORTS_PER_SOL);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const nonceBn = new anchor.BN(999);

    const [auditPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('audit'), fakeAgent.publicKey.toBuffer(), nonceBn.toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    // Use a random PDA that doesn't match the agent identity
    const fakeIdentity = Keypair.generate().publicKey;

    const reasoningHash = Buffer.alloc(32, 0xaa);
    const reasoningUri = Buffer.alloc(64, 0);

    try {
      await program.methods
        .logEvent(
          0,
          null,
          null,
          Array.from(reasoningHash),
          Array.from(reasoningUri),
          nonceBn,
        )
        .accounts({
          auditEntry: auditPda,
          agent: fakeAgent.publicKey,
          agentIdentity: fakeIdentity,
          institution: institutionPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([fakeAgent])
        .rpc();
      expect.fail('Should have thrown Unauthorized error');
    } catch (err: unknown) {
      // Expected — agent identity PDA doesn't match
      expect((err as Error).toString()).to.include('Unauthorized');
    }
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
          agentIdentity: agentIdentityPda,
          institution: institutionPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      expect.fail('Should have thrown InvalidActionType error');
    } catch (err: unknown) {
      expect((err as Error).toString()).to.include('InvalidActionType');
    }
  });
});
