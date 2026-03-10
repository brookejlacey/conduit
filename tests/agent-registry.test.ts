import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';

describe('agent-registry', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AgentRegistry as Program;
  const admin = Keypair.generate();
  const agentKeypair = Keypair.generate();
  let institutionPda: PublicKey;
  let agentPda: PublicKey;

  before(async () => {
    await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    [institutionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('institution'), admin.publicKey.toBuffer()],
      program.programId,
    );
  });

  it('registers an institution', async () => {
    const name = Buffer.alloc(32, 0);
    Buffer.from('AcmeBank').copy(name);

    const kycHash = Buffer.alloc(32, 0xab);

    await program.methods
      .registerInstitution(Array.from(name), Array.from(kycHash))
      .accounts({
        institution: institutionPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const institution = await program.account.institution.fetch(institutionPda);
    expect(institution.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(institution.active).to.be.true;
    expect(institution.agentCount).to.equal(0);
  });

  it('registers an agent under the institution', async () => {
    [agentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('agent'),
        institutionPda.toBuffer(),
        agentKeypair.publicKey.toBuffer(),
      ],
      program.programId,
    );

    const scopedPrograms = [Keypair.generate().publicKey, Keypair.generate().publicKey];

    await program.methods
      .registerAgent(1, scopedPrograms) // tier 1 = executor
      .accounts({
        institution: institutionPda,
        agent: agentPda,
        agentPubkey: agentKeypair.publicKey,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const agent = await program.account.agentIdentity.fetch(agentPda);
    expect(agent.authorityTier).to.equal(1);
    expect(agent.active).to.be.true;
    expect(agent.scopedPrograms).to.have.length(2);

    const institution = await program.account.institution.fetch(institutionPda);
    expect(institution.agentCount).to.equal(1);
  });

  it('updates agent tier', async () => {
    await program.methods
      .updateAgentTier(2) // promote to manager
      .accounts({
        institution: institutionPda,
        agent: agentPda,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const agent = await program.account.agentIdentity.fetch(agentPda);
    expect(agent.authorityTier).to.equal(2);
  });

  it('rejects invalid tier', async () => {
    try {
      await program.methods
        .updateAgentTier(5) // invalid tier
        .accounts({
          institution: institutionPda,
          agent: agentPda,
          admin: admin.publicKey,
        })
        .signers([admin])
        .rpc();
      expect.fail('Should have thrown InvalidTier error');
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal('InvalidTier');
    }
  });

  it('deactivates an agent', async () => {
    await program.methods
      .deactivateAgent()
      .accounts({
        institution: institutionPda,
        agent: agentPda,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const agent = await program.account.agentIdentity.fetch(agentPda);
    expect(agent.active).to.be.false;
  });

  it('rejects operations on deactivated agent', async () => {
    try {
      await program.methods
        .updateAgentTier(3)
        .accounts({
          institution: institutionPda,
          agent: agentPda,
          admin: admin.publicKey,
        })
        .signers([admin])
        .rpc();
      expect.fail('Should have thrown AgentInactive error');
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal('AgentInactive');
    }
  });
});
