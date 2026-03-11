import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { createReasoningRecord } from '../ai/reasoning';
import {
  findAuditEntryPda,
  findAgentPda,
  findInstitutionPda,
} from '@conduit/sdk';
import { createLogEventIx } from '../chain/instructions';
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
      const institutionAdmin = this.config.institution.adminPubkey
        ? new PublicKey(this.config.institution.adminPubkey)
        : payer.publicKey;
      const [institutionPda] = findInstitutionPda(institutionAdmin);
      const [agentIdentityPda] = findAgentPda(institutionPda, payer.publicKey);

      // Build the log_event instruction with proper Borsh encoding
      const ix = createLogEventIx(
        auditEntryPda,
        payer.publicKey,
        agentIdentityPda,
        institutionPda,
        actionType,
        targetVault,
        amount !== null ? new BN(amount) : null,
        record.hash,
        record.uri,
        nonce,
      );

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
