import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { AgentConfig, AuthorityTier } from '../config';
import { TreasuryService } from '../services/treasury';
import { SettlementService } from '../services/settlement';
import { ComplianceService } from '../services/compliance';
import { MarketService } from '../services/market';
import { ClaudeClient } from '../ai/claude';
import { OnChainLogger } from '../logging/onchain';
import type { Logger } from 'pino';

/**
 * Tier permissions:
 *   0 (Observer)  — compliance scans only (read-only)
 *   1 (Executor)  — + rebalance execution
 *   2 (Manager)   — + settlement batching
 *   3 (Admin)     — full access (all actions)
 */
const TIER_NAMES: Record<AuthorityTier, string> = {
  0: 'Observer',
  1: 'Executor',
  2: 'Manager',
  3: 'Admin',
};

export class ConduitAgent {
  private provider: AnchorProvider;
  public treasury: TreasuryService;
  public settlement: SettlementService;
  public compliance: ComplianceService;
  public market: MarketService;
  public claude: ClaudeClient;
  public auditLogger: OnChainLogger;
  public readonly name: string;
  public readonly tier: AuthorityTier;

  constructor(
    private connection: Connection,
    private wallet: Keypair,
    config: AgentConfig,
    private logger: Logger,
    name: string = 'primary',
    tier: AuthorityTier = 3,
  ) {
    this.name = name;
    this.tier = tier;

    const anchorWallet = new Wallet(wallet);
    this.provider = new AnchorProvider(connection, anchorWallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });

    this.claude = new ClaudeClient(config.anthropic.apiKey, logger);
    this.market = new MarketService(logger);
    this.compliance = new ComplianceService(this.provider, config, logger);
    this.treasury = new TreasuryService(this.provider, config, this.claude, this.market, logger);
    this.settlement = new SettlementService(
      this.provider,
      config,
      this.claude,
      this.market,
      logger,
    );
    this.auditLogger = new OnChainLogger(this.provider, config, logger);
  }

  async initialize(): Promise<void> {
    this.logger.info(
      { name: this.name, tier: TIER_NAMES[this.tier], pubkey: this.wallet.publicKey.toBase58() },
      'Initializing Conduit Agent...',
    );

    const balance = await this.connection.getBalance(this.wallet.publicKey);
    this.logger.info(
      { balance: balance / 1e9, pubkey: this.wallet.publicKey.toBase58() },
      'Agent SOL balance',
    );

    if (balance < 0.01 * 1e9) {
      this.logger.warn('Agent SOL balance is low. Some transactions may fail.');
    }

    this.logger.info({ name: this.name, tier: TIER_NAMES[this.tier] }, 'Agent initialized');
  }

  async runRebalanceCheck(): Promise<void> {
    // Tier 0 (Observer) cannot execute rebalances
    if (this.tier < 1) {
      this.logger.debug({ name: this.name, tier: TIER_NAMES[this.tier] }, 'Skipping rebalance (insufficient tier)');
      return;
    }

    this.logger.info({ agent: this.name }, 'Running rebalance check...');
    try {
      const decision = await this.treasury.analyzeAndRebalance();
      if (decision.shouldRebalance) {
        const isCompliant = await this.compliance.validateAction('rebalance', decision as unknown as Record<string, unknown>);
        if (!isCompliant) {
          this.logger.warn('Rebalance blocked by compliance check');
          return;
        }
        await this.treasury.executeRebalance(decision);
        await this.auditLogger.logAction(
          2, // Rebalance
          decision.targetVault ?? null,
          decision.amount ?? null,
          decision.reasoning,
        );
      }
      this.logger.info({ decision: decision.shouldRebalance }, 'Rebalance check complete');
    } catch (err) {
      this.logger.error({ err }, 'Rebalance check failed');
    }
  }

  async runSettlementBatch(): Promise<void> {
    // Tier 0-1 cannot run settlements
    if (this.tier < 2) {
      this.logger.debug({ name: this.name, tier: TIER_NAMES[this.tier] }, 'Skipping settlement (insufficient tier)');
      return;
    }

    this.logger.info({ agent: this.name }, 'Running settlement batch...');
    try {
      const batch = await this.settlement.buildBatch();
      if (batch.entries.length > 0) {
        const isCompliant = await this.compliance.validateAction('settlement', batch as unknown as Record<string, unknown>);
        if (!isCompliant) {
          this.logger.warn('Settlement batch blocked by compliance check');
          return;
        }
        await this.settlement.executeBatch(batch);
        await this.auditLogger.logAction(3, null, batch.totalNet, batch.reasoning);
      }
      this.logger.info({ entryCount: batch.entries.length }, 'Settlement batch complete');
    } catch (err) {
      this.logger.error({ err }, 'Settlement batch failed');
    }
  }

  async runComplianceScan(): Promise<void> {
    // All tiers can run compliance scans (read-only)
    this.logger.info({ agent: this.name }, 'Running compliance scan...');
    try {
      const report = await this.compliance.runFullScan();
      this.logger.info({ violations: report.violations.length }, 'Compliance scan complete');
      if (report.violations.length > 0) {
        this.logger.warn({ violations: report.violations }, 'Compliance violations detected');
      }
    } catch (err) {
      this.logger.error({ err }, 'Compliance scan failed');
    }
  }
}
