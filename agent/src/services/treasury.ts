import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { ClaudeClient } from '../ai/claude';
import { MarketService } from './market';
import { REBALANCE_SYSTEM_PROMPT } from '../ai/prompts/rebalance';
import type { Logger } from 'pino';

export interface RebalanceDecision {
  shouldRebalance: boolean;
  reasoning: string;
  targetVault?: PublicKey;
  amount?: number;
  direction?: 'deposit' | 'withdraw';
}

interface VaultPosition {
  address: PublicKey;
  totalDeposits: number;
  yieldAccrued: number;
  dailySpent: number;
  dailyLimit: number;
  utilization: number;
}

export class TreasuryService {
  constructor(
    _provider: AnchorProvider,
    private config: AgentConfig,
    private claude: ClaudeClient,
    private market: MarketService,
    private logger: Logger,
  ) {}

  async getVaultPositions(): Promise<VaultPosition[]> {
    this.logger.debug('Fetching vault positions...');

    // In production, fetch from on-chain vault accounts
    // For hackathon, return mock data that demonstrates the flow
    const mockPositions: VaultPosition[] = [
      {
        address: this.config.programs.vault,
        totalDeposits: 1_000_000 * 1e6,
        yieldAccrued: 12_500 * 1e6,
        dailySpent: 150_000 * 1e6,
        dailyLimit: 500_000 * 1e6,
        utilization: 0.3,
      },
    ];

    return mockPositions;
  }

  async analyzeAndRebalance(): Promise<RebalanceDecision> {
    const positions = await this.getVaultPositions();
    const marketData = await this.market.getMarketSnapshot();

    const prompt = `Current vault positions:\n${JSON.stringify(positions, null, 2)}\n\nMarket data:\n${JSON.stringify(marketData, null, 2)}\n\nAnalyze the treasury positions and determine if rebalancing is needed. Consider utilization rates, yield optimization, and risk exposure.`;

    const response = await this.claude.analyze(REBALANCE_SYSTEM_PROMPT, prompt);

    const decision: RebalanceDecision = {
      shouldRebalance: response.shouldAct,
      reasoning: response.reasoning,
    };

    if (response.shouldAct && response.action) {
      decision.targetVault = new PublicKey(response.action.target);
      decision.amount = response.action.amount;
      decision.direction = response.action.direction as 'deposit' | 'withdraw';
    }

    this.logger.info({ shouldRebalance: decision.shouldRebalance }, 'Rebalance analysis complete');
    return decision;
  }

  async executeRebalance(decision: RebalanceDecision): Promise<string> {
    if (!decision.shouldRebalance || !decision.targetVault || !decision.amount) {
      throw new Error('Invalid rebalance decision');
    }

    this.logger.info(
      {
        target: decision.targetVault.toBase58(),
        amount: decision.amount,
        direction: decision.direction,
      },
      'Executing rebalance',
    );

    // In production, build and send the actual Solana transaction
    // For hackathon, log the intent
    const txSignature = 'simulated-rebalance-tx';

    this.logger.info({ txSignature }, 'Rebalance executed');
    return txSignature;
  }
}
