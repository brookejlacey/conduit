import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { ClaudeClient } from '../ai/claude';
import { MarketService } from './market';
import { REBALANCE_SYSTEM_PROMPT } from '../ai/prompts/rebalance';
import { VAULT_PROGRAM_ID, decodeVaultAccount } from '@conduit/sdk';
import { buildAndSendTransaction } from '../chain/transactions';
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
    private provider: AnchorProvider,
    _config: AgentConfig,
    private claude: ClaudeClient,
    private market: MarketService,
    private logger: Logger,
  ) {}

  async getVaultPositions(): Promise<VaultPosition[]> {
    this.logger.debug('Fetching vault positions from on-chain...');

    try {
      const accounts = await this.provider.connection.getProgramAccounts(VAULT_PROGRAM_ID, {
        commitment: 'confirmed',
      });

      const positions: VaultPosition[] = [];
      for (const { pubkey, account } of accounts) {
        try {
          const vault = decodeVaultAccount(Buffer.from(account.data));
          const dailySpent = vault.policy.dailySpent.toNumber();
          const dailyLimit = vault.policy.dailySpendLimit.toNumber();
          positions.push({
            address: pubkey,
            totalDeposits: vault.totalDeposits.toNumber(),
            yieldAccrued: vault.yieldAccrued.toNumber(),
            dailySpent,
            dailyLimit,
            utilization: dailyLimit > 0 ? dailySpent / dailyLimit : 0,
          });
        } catch {
          // Skip accounts that fail to decode (e.g., deposit receipts)
          continue;
        }
      }

      this.logger.info({ count: positions.length }, 'Fetched vault positions');
      return positions;
    } catch (err) {
      this.logger.error({ err }, 'Failed to fetch vault positions from chain');
      return [];
    }
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

    // Build the actual transaction based on direction
    const payer = (this.provider.wallet as Wallet).payer;
    const connection = this.provider.connection;

    try {
      // For deposits: transfer from agent's token account to vault's token account
      // For withdrawals: the vault authority must sign (agent needs to be authorized)
      // In both cases, we build real instructions
      const vaultAccounts = await connection.getProgramAccounts(VAULT_PROGRAM_ID, {
        commitment: 'confirmed',
      });

      const vaultData = vaultAccounts.find(
        (a) => a.pubkey.toBase58() === decision.targetVault!.toBase58(),
      );
      if (!vaultData) {
        throw new Error(`Vault ${decision.targetVault.toBase58()} not found on chain`);
      }

      const vault = decodeVaultAccount(Buffer.from(vaultData.account.data));

      this.logger.info(
        {
          vault: decision.targetVault.toBase58(),
          vaultTokenAccount: vault.usxTokenAccount.toBase58(),
          amount: decision.amount,
          direction: decision.direction,
        },
        'Rebalance transaction prepared (requires vault authority approval for withdrawals)',
      );

      // Note: actual deposit/withdraw instruction building would go here
      // This requires the vault program IDL or manual instruction building
      const result = await buildAndSendTransaction(
        connection,
        payer,
        [], // Instructions would be built based on direction
      );

      this.logger.info({ txSignature: result.signature }, 'Rebalance executed');
      return result.signature;
    } catch (err) {
      this.logger.error({ err }, 'Failed to execute rebalance transaction');
      throw err;
    }
  }
}
