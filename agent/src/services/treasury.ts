import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { AgentConfig } from '../config';
import { ClaudeClient } from '../ai/claude';
import { MarketService } from './market';
import { REBALANCE_SYSTEM_PROMPT } from '../ai/prompts/rebalance';
import { VAULT_PROGRAM_ID, decodeVaultAccount } from '@conduit/sdk';
import { createWithdrawIx } from '../chain/instructions';
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
  authority: PublicKey;
  usxTokenAccount: PublicKey;
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
            authority: vault.authority,
            usxTokenAccount: vault.usxTokenAccount,
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

    const payer = (this.provider.wallet as Wallet).payer;
    const connection = this.provider.connection;

    try {
      // Find the target vault's on-chain data
      const positions = await this.getVaultPositions();
      const targetPosition = positions.find(
        (p) => p.address.toBase58() === decision.targetVault!.toBase58(),
      );
      if (!targetPosition) {
        throw new Error(`Vault ${decision.targetVault.toBase58()} not found on chain`);
      }

      const amount = new BN(decision.amount);

      if (decision.direction === 'withdraw') {
        // Withdraw from vault — agent must be the vault authority
        const ix = createWithdrawIx(
          targetPosition.address,
          targetPosition.usxTokenAccount,
          await getAssociatedTokenAddress(
            // USX mint — in production this would come from vault data
            targetPosition.usxTokenAccount, // placeholder; needs USX mint address
            payer.publicKey,
          ),
          payer.publicKey,
          amount,
          3, // tx_type: rebalance (bit 3)
          payer.publicKey, // self as counterparty for rebalance
        );

        const result = await buildAndSendTransaction(connection, payer, [ix]);
        this.logger.info({ txSignature: result.signature }, 'Rebalance withdraw executed');
        return result.signature;
      } else {
        // Deposit into vault — requires deposit receipt PDA
        this.logger.info(
          {
            vault: targetPosition.address.toBase58(),
            amount: decision.amount,
          },
          'Rebalance deposit prepared (requires deposit receipt PDA derivation)',
        );

        // For deposits, we need: vault PDA, deposit receipt PDA, depositor token account,
        // vault token account, and a KYC hash. The agent would need these set up.
        // This is the most complex path — log the intent for now.
        return 'deposit-pending-setup';
      }
    } catch (err) {
      this.logger.error({ err }, 'Failed to execute rebalance transaction');
      throw err;
    }
  }
}
