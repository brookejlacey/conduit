import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { AgentConfig } from '../config';
import { ClaudeClient } from '../ai/claude';
import { MarketService } from './market';
import { REBALANCE_SYSTEM_PROMPT } from '../ai/prompts/rebalance';
import { VAULT_PROGRAM_ID, decodeVaultAccount, findDepositReceiptPda } from '@conduit/sdk';
import { createWithdrawIx, createDepositIx } from '../chain/instructions';
import { buildAndSendTransaction } from '../chain/transactions';
import { createHash } from 'crypto';
import { getAssociatedTokenAddress } from '@solana/spl-token';
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
      const positions = await this.getVaultPositions();
      const targetPosition = positions.find(
        (p) => p.address.toBase58() === decision.targetVault!.toBase58(),
      );
      if (!targetPosition) {
        throw new Error(`Vault ${decision.targetVault.toBase58()} not found on chain`);
      }

      const amount = new BN(decision.amount);

      if (decision.direction === 'withdraw') {
        // Withdraw from vault
        const usxMint = await this.getTokenMint(targetPosition.usxTokenAccount);
        const destinationAta = await getAssociatedTokenAddress(usxMint, payer.publicKey);

        const ix = createWithdrawIx(
          targetPosition.address,
          targetPosition.usxTokenAccount,
          destinationAta,
          payer.publicKey,
          amount,
          3, // tx_type: rebalance
          payer.publicKey,
        );

        const result = await buildAndSendTransaction(connection, payer, [ix]);
        this.logger.info({ txSignature: result.signature }, 'Rebalance withdraw executed');
        return result.signature;
      } else {
        // Deposit into vault — read total_deposits for PDA derivation
        const vaultAccountInfo = await connection.getAccountInfo(targetPosition.address);
        if (!vaultAccountInfo) throw new Error('Vault account not found');

        const totalDeposits = new BN(vaultAccountInfo.data.subarray(72, 80), 'le');
        const [depositReceiptPda] = findDepositReceiptPda(
          targetPosition.address,
          payer.publicKey,
          totalDeposits,
        );

        const usxMint = await this.getTokenMint(targetPosition.usxTokenAccount);
        const sourceAta = await getAssociatedTokenAddress(usxMint, payer.publicKey);
        const kycHash = createHash('sha256').update(`agent-rebalance-${Date.now()}`).digest();

        const ix = createDepositIx(
          targetPosition.address,
          depositReceiptPda,
          sourceAta,
          targetPosition.usxTokenAccount,
          payer.publicKey,
          amount,
          kycHash,
        );

        const result = await buildAndSendTransaction(connection, payer, [ix]);
        this.logger.info({ txSignature: result.signature }, 'Rebalance deposit executed');
        return result.signature;
      }
    } catch (err) {
      this.logger.error({ err }, 'Failed to execute rebalance transaction');
      throw err;
    }
  }

  private async getTokenMint(tokenAccount: PublicKey): Promise<PublicKey> {
    const info = await this.provider.connection.getAccountInfo(tokenAccount);
    if (!info) throw new Error('Token account not found');
    // SPL token account: mint is first 32 bytes
    return new PublicKey(info.data.subarray(0, 32));
  }
}
