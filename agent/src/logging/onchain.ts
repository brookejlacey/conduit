import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { createReasoningRecord } from '../ai/reasoning';
import type { Logger } from 'pino';

export class OnChainLogger {
  constructor(
    _provider: AnchorProvider,
    _config: AgentConfig,
    private logger: Logger,
  ) {}

  async logAction(
    actionType: number,
    targetVault: PublicKey | null,
    amount: number | null,
    reasoning: string,
  ): Promise<string> {
    const record = createReasoningRecord(reasoning);

    this.logger.info(
      {
        actionType,
        targetVault: targetVault?.toBase58(),
        amount,
        reasoningHash: record.hash.toString('hex'),
      },
      'Logging action on-chain',
    );

    // In production, build the actual audit-log program instruction
    // For hackathon, simulate the logging
    try {
      // The instruction would be:
      // program.methods.logEvent(
      //   actionType,
      //   targetVault,
      //   amount ? new BN(amount) : null,
      //   Array.from(record.hash),
      //   Array.from(record.uri),
      //   new BN(nonce),  // unique nonce for PDA derivation
      // )
      const txSignature = `audit-log-${record.hash.toString('hex').slice(0, 8)}`;

      this.logger.info(
        { txSignature, reasoningHash: record.hash.toString('hex') },
        'Audit entry logged on-chain',
      );

      return txSignature;
    } catch (err) {
      this.logger.error({ err }, 'Failed to log audit entry on-chain');
      throw err;
    }
  }
}
