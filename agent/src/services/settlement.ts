import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { ClaudeClient } from '../ai/claude';
import { MarketService } from './market';
import { SETTLEMENT_SYSTEM_PROMPT } from '../ai/prompts/settlement';
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
  netOffset: number;
}

export class SettlementService {
  constructor(
    _provider: AnchorProvider,
    private config: AgentConfig,
    private claude: ClaudeClient,
    private market: MarketService,
    private logger: Logger,
  ) {}

  async getPendingPayments(): Promise<SettlementEntryPlan[]> {
    this.logger.debug('Fetching pending payments...');

    // In production, query pending payment requests
    // For hackathon, return mock cross-border payment data
    const mockPayments: SettlementEntryPlan[] = [
      {
        fromVault: this.config.programs.vault,
        toVault: PublicKey.default,
        amountUsx: 50_000 * 1e6,
        destinationCurrency: 'EUR',
        fxRate: 92_000_000, // 0.92 scaled by 1e8
        netOffset: 0,
      },
      {
        fromVault: this.config.programs.vault,
        toVault: PublicKey.default,
        amountUsx: 25_000 * 1e6,
        destinationCurrency: 'GBP',
        fxRate: 79_000_000, // 0.79 scaled by 1e8
        netOffset: 0,
      },
    ];

    return mockPayments;
  }

  async buildBatch(): Promise<SettlementBatchPlan> {
    const pendingPayments = await this.getPendingPayments();
    const marketData = await this.market.getMarketSnapshot();

    const prompt = `Pending cross-border payments:\n${JSON.stringify(pendingPayments, null, 2)}\n\nMarket conditions:\n${JSON.stringify(marketData, null, 2)}\n\nAnalyze these payments and determine optimal batching strategy. Consider FX rates, netting opportunities, and timing.`;

    const response = await this.claude.analyze(SETTLEMENT_SYSTEM_PROMPT, prompt);

    // Calculate netting
    let totalGross = 0;
    let totalNet = 0;
    const entries = pendingPayments.map((p) => {
      totalGross += p.amountUsx;
      const netAmount = Math.round(p.amountUsx * (p.fxRate / 1e8));
      totalNet += netAmount;
      return { ...p, netOffset: netAmount };
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
      'Executing settlement batch',
    );

    // In production, create on-chain settlement batch and entries
    // For hackathon, log the intent
    const txSignature = 'simulated-settlement-tx';

    this.logger.info({ txSignature }, 'Settlement batch executed');
    return txSignature;
  }
}
