import { AnchorProvider } from '@coral-xyz/anchor';
import { AgentConfig } from '../config';
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
    _provider: AnchorProvider,
    private config: AgentConfig,
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

    // In production, scan all vaults and agents on-chain
    // For hackathon, demonstrate the scan structure

    // Check vault policy utilization
    const vaultUtilization = 0.85; // Mock: 85% of daily limit used
    if (vaultUtilization > 0.8) {
      violations.push({
        type: 'daily_limit',
        severity: 'warning',
        description: `Vault daily spend utilization at ${(vaultUtilization * 100).toFixed(1)}%`,
        vault: this.config.programs.vault.toBase58(),
      });
    }

    const report: ComplianceReport = {
      scannedAt: Date.now(),
      violations,
      isCompliant: violations.filter((v) => v.severity === 'critical').length === 0,
    };

    return report;
  }
}
