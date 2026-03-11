import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { ClaudeClient } from '../ai/claude';
import { MarketService } from './market';
import { SETTLEMENT_SYSTEM_PROMPT } from '../ai/prompts/settlement';
import {
  findSettlementBatchPda,
  findSettlementEntryPda,
} from '@conduit/sdk';
import { createBatchIx, createAddEntryIx } from '../chain/instructions';
import { buildAndSendTransaction } from '../chain/transactions';
import type { Logger } from 'pino';

export interface SettlementBatchPlan {
  entries: SettlementEntryPlan[];
  totalGross: number;
  totalNet: number;
  reasoning: string;
}

export interface SettlementEntryPlan {
  fromVault: PublicKey;
  toVault: PublicKey;
  amountUsx: number;
  destinationCurrency: string;
  fxRate: number;
}

export class SettlementService {
  constructor(
    private provider: AnchorProvider,
    private config: AgentConfig,
    private claude: ClaudeClient,
    private market: MarketService,
    private logger: Logger,
  ) {}

  async getPendingPayments(): Promise<SettlementEntryPlan[]> {
    this.logger.debug('Fetching pending payments...');

    // In a full implementation, this would query pending payment requests
    // from an off-chain database or on-chain escrow accounts.
    // For now, return mock data to demonstrate the flow.
    const mockPayments: SettlementEntryPlan[] = [
      {
        fromVault: this.config.programs.vault,
        toVault: PublicKey.default,
        amountUsx: 50_000 * 1e6,
        destinationCurrency: 'EUR',
        fxRate: 92_000_000, // 0.92 scaled by 1e8
      },
      {
        fromVault: this.config.programs.vault,
        toVault: PublicKey.default,
        amountUsx: 25_000 * 1e6,
        destinationCurrency: 'GBP',
        fxRate: 79_000_000, // 0.79 scaled by 1e8
      },
    ];

    return mockPayments;
  }

  async buildBatch(): Promise<SettlementBatchPlan> {
    const pendingPayments = await this.getPendingPayments();
    const marketData = await this.market.getMarketSnapshot();

    const prompt = `Pending cross-border payments:\n${JSON.stringify(pendingPayments, null, 2)}\n\nMarket conditions:\n${JSON.stringify(marketData, null, 2)}\n\nAnalyze these payments and determine optimal batching strategy. Consider FX rates, netting opportunities, and timing.`;

    const response = await this.claude.analyze(SETTLEMENT_SYSTEM_PROMPT, prompt);

    // Calculate netting — net_offset is computed on-chain from amount * fx_rate
    let totalGross = 0;
    let totalNet = 0;
    const entries = pendingPayments.map((p) => {
      totalGross += p.amountUsx;
      // Mirror the on-chain computation: amount * fx_rate / 1e8
      const netAmount = Math.round(p.amountUsx * (p.fxRate / 1e8));
      totalNet += netAmount;
      return { ...p };
    });

    return {
      entries,
      totalGross,
      totalNet,
      reasoning: response.reasoning,
    };
  }

  async executeBatch(batch: SettlementBatchPlan): Promise<string> {
    this.logger.info(
      {
        entryCount: batch.entries.length,
        totalGross: batch.totalGross,
        totalNet: batch.totalNet,
      },
      'Executing settlement batch on-chain',
    );

    const payer = (this.provider.wallet as Wallet).payer;
    const connection = this.provider.connection;
    const batchId = new BN(Date.now());
    const [batchPda] = findSettlementBatchPda(payer.publicKey, batchId);

    try {
      // 1. Create the batch on-chain with proper Borsh-encoded instruction
      const ix = createBatchIx(batchPda, payer.publicKey, batchId);

      const result = await buildAndSendTransaction(connection, payer, [ix]);
      this.logger.info(
        { txSignature: result.signature, batchId: batchId.toString() },
        'Settlement batch created on-chain',
      );

      // 2. Add entries to the batch
      for (let i = 0; i < batch.entries.length; i++) {
        const entry = batch.entries[i];
        const [entryPda] = findSettlementEntryPda(batchPda, i);

        const addEntryIx = createAddEntryIx(
          batchPda,
          entryPda,
          entry.fromVault,
          entry.toVault,
          payer.publicKey,
          new BN(entry.amountUsx),
          currencyToBytes(entry.destinationCurrency),
          new BN(entry.fxRate),
        );

        const entryResult = await buildAndSendTransaction(connection, payer, [addEntryIx]);
        this.logger.info(
          { txSignature: entryResult.signature, entryIndex: i },
          'Settlement entry added on-chain',
        );
      }

      this.logger.info({ batchPda: batchPda.toBase58() }, 'Settlement batch fully created');
      return result.signature;
    } catch (err) {
      this.logger.error({ err }, 'Failed to create settlement batch on-chain');
      throw err;
    }
  }
}

function currencyToBytes(currency: string): number[] {
  const bytes = Buffer.alloc(3, 0);
  Buffer.from(currency.slice(0, 3), 'ascii').copy(bytes);
  return Array.from(bytes);
}
