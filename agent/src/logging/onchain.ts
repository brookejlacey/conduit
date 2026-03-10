import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { createReasoningRecord } from '../ai/reasoning';
import {
  AUDIT_LOG_PROGRAM_ID,
  findAuditEntryPda,
  findAgentPda,
  findInstitutionPda,
} from '@conduit/sdk';
import { buildAndSendTransaction } from '../chain/transactions';
import type { Logger } from 'pino';

export class OnChainLogger {
  private nonce = 0;

  constructor(
    private provider: AnchorProvider,
    private config: AgentConfig,
    private logger: Logger,
  ) {}

  async logAction(
    actionType: number,
    targetVault: PublicKey | null,
    amount: number | null,
    reasoning: string,
  ): Promise<string> {
    const record = createReasoningRecord(reasoning);
    const payer = (this.provider.wallet as Wallet).payer;
    const connection = this.provider.connection;

    this.logger.info(
      {
        actionType,
        targetVault: targetVault?.toBase58(),
        amount,
        reasoningHash: record.hash.toString('hex'),
      },
      'Logging action on-chain',
    );

    try {
      const nonce = new BN(this.nonce++);
      const [auditEntryPda] = findAuditEntryPda(payer.publicKey, nonce);

      // Derive the agent's institution PDA and agent identity PDA
      // These are needed for the cross-program verification in the audit-log program
      const institutionAdmin = new PublicKey(this.config.institution.kycHash.slice(0, 32) || payer.publicKey.toBase58());
      const [institutionPda] = findInstitutionPda(institutionAdmin);
      const [agentIdentityPda] = findAgentPda(institutionPda, payer.publicKey);

      // Build the log_event instruction
      const ix = new TransactionInstruction({
        programId: AUDIT_LOG_PROGRAM_ID,
        keys: [
          { pubkey: auditEntryPda, isSigner: false, isWritable: true },
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: agentIdentityPda, isSigner: false, isWritable: false },
          { pubkey: institutionPda, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: encodeLogEventData(
          actionType,
          targetVault,
          amount,
          Array.from(record.hash),
          Array.from(record.uri),
          nonce,
        ),
      });

      const result = await buildAndSendTransaction(connection, payer, [ix]);

      this.logger.info(
        { txSignature: result.signature, reasoningHash: record.hash.toString('hex') },
        'Audit entry logged on-chain',
      );

      return result.signature;
    } catch (err) {
      this.logger.error({ err }, 'Failed to log audit entry on-chain');
      throw err;
    }
  }
}

/**
 * Encode log_event instruction data using Borsh serialization.
 * Format: 8-byte discriminator + action_type(u8) + Option<Pubkey> + Option<u64> + [u8;32] + [u8;64] + u64
 */
function encodeLogEventData(
  actionType: number,
  targetVault: PublicKey | null,
  amount: number | null,
  reasoningHash: number[],
  reasoningUri: number[],
  nonce: BN,
): Buffer {
  // Anchor instruction discriminator for "log_event" = SHA256("global:log_event")[0..8]
  const discriminator = Buffer.from([
    0x38, 0xad, 0xc4, 0x36, 0x2c, 0x65, 0x58, 0x76,
  ]);

  const parts: Buffer[] = [discriminator];

  // action_type: u8
  parts.push(Buffer.from([actionType]));

  // target_vault: Option<Pubkey>
  if (targetVault) {
    parts.push(Buffer.from([1])); // Some
    parts.push(targetVault.toBuffer());
  } else {
    parts.push(Buffer.from([0])); // None
  }

  // amount: Option<u64>
  if (amount !== null) {
    parts.push(Buffer.from([1])); // Some
    const amountBuf = Buffer.alloc(8);
    new BN(amount).toArrayLike(Buffer, 'le', 8).copy(amountBuf);
    parts.push(amountBuf);
  } else {
    parts.push(Buffer.from([0])); // None
  }

  // reasoning_hash: [u8; 32]
  parts.push(Buffer.from(reasoningHash));

  // reasoning_uri: [u8; 64]
  parts.push(Buffer.from(reasoningUri));

  // nonce: u64
  const nonceBuf = nonce.toArrayLike(Buffer, 'le', 8);
  parts.push(nonceBuf);

  return Buffer.concat(parts);
}
