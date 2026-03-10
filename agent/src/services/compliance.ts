import { AnchorProvider } from '@coral-xyz/anchor';
import { AgentConfig } from '../config';
import { VAULT_PROGRAM_ID, decodeVaultAccount } from '@conduit/sdk';
import type { Logger } from 'pino';

export interface ComplianceViolation {
  type: 'daily_limit' | 'counterparty' | 'tx_type' | 'threshold' | 'inactive_agent';
  severity: 'warning' | 'critical';
  description: string;
  vault?: string;
  agent?: string;
}

export interface ComplianceReport {
  scannedAt: number;
  violations: ComplianceViolation[];
  isCompliant: boolean;
}

export class ComplianceService {
  constructor(
    private provider: AnchorProvider,
    _config: AgentConfig,
    private logger: Logger,
  ) {}

  async validateAction(
    actionType: string,
    actionData: Record<string, unknown>,
  ): Promise<boolean> {
    this.logger.debug({ actionType }, 'Validating action compliance');

    switch (actionType) {
      case 'rebalance':
        return this.validateRebalance(actionData);
      case 'settlement':
        return this.validateSettlement(actionData);
      case 'withdraw':
        return this.validateWithdraw(actionData);
      default:
        this.logger.warn({ actionType }, 'Unknown action type for compliance check');
        return true;
    }
  }

  private async validateRebalance(data: Record<string, unknown>): Promise<boolean> {
    const amount = data.amount as number | undefined;
    if (amount && amount > 1_000_000 * 1e6) {
      this.logger.warn({ amount }, 'Rebalance amount exceeds safety threshold');
      return false;
    }
    return true;
  }

  private async validateSettlement(data: Record<string, unknown>): Promise<boolean> {
    const totalNet = data.totalNet as number | undefined;
    if (totalNet && totalNet > 5_000_000 * 1e6) {
      this.logger.warn({ totalNet }, 'Settlement net amount exceeds safety threshold');
      return false;
    }
    return true;
  }

  private async validateWithdraw(data: Record<string, unknown>): Promise<boolean> {
    const amount = data.amount as number | undefined;
    if (amount && amount > 500_000 * 1e6) {
      this.logger.warn({ amount }, 'Withdraw amount exceeds safety threshold');
      return false;
    }
    return true;
  }

  async runFullScan(): Promise<ComplianceReport> {
    this.logger.info('Running full compliance scan...');
    const violations: ComplianceViolation[] = [];

    try {
      // Fetch all vault accounts from on-chain
      const accounts = await this.provider.connection.getProgramAccounts(VAULT_PROGRAM_ID, {
        commitment: 'confirmed',
      });

      for (const { pubkey, account } of accounts) {
        try {
          const vault = decodeVaultAccount(Buffer.from(account.data));
          const dailySpent = vault.policy.dailySpent.toNumber();
          const dailyLimit = vault.policy.dailySpendLimit.toNumber();
          const utilization = dailyLimit > 0 ? dailySpent / dailyLimit : 0;

          if (utilization > 0.8) {
            violations.push({
              type: 'daily_limit',
              severity: utilization > 0.95 ? 'critical' : 'warning',
              description: `Vault daily spend utilization at ${(utilization * 100).toFixed(1)}%`,
              vault: pubkey.toBase58(),
            });
          }

          // Check for near-zero remaining balance
          const totalDeposits = vault.totalDeposits.toNumber();
          if (totalDeposits > 0 && totalDeposits < 1000 * 1e6) {
            violations.push({
              type: 'threshold',
              severity: 'warning',
              description: `Vault balance critically low: ${totalDeposits / 1e6} USX`,
              vault: pubkey.toBase58(),
            });
          }
        } catch {
          // Skip accounts that fail to decode (e.g., deposit receipts)
          continue;
        }
      }

      this.logger.info({ vaultCount: accounts.length, violations: violations.length }, 'Compliance scan complete');
    } catch (err) {
      this.logger.error({ err }, 'Failed to fetch vault accounts for compliance scan');
    }

    const report: ComplianceReport = {
      scannedAt: Date.now(),
      violations,
      isCompliant: violations.filter((v) => v.severity === 'critical').length === 0,
    };

    return report;
  }
}
