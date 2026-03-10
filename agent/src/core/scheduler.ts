import cron from 'node-cron';
import { ConduitAgent } from './agent';
import { AgentConfig } from '../config';
import type { Logger } from 'pino';

export class Scheduler {
  private tasks: cron.ScheduledTask[] = [];

  constructor(
    private agent: ConduitAgent,
    private config: AgentConfig,
    private logger: Logger,
  ) {}

  start(): void {
    this.logger.info('Starting scheduler...');

    // Rebalance check
    const rebalanceTask = cron.schedule(this.config.agent.cronRebalance, async () => {
      this.logger.info('Cron trigger: rebalance check');
      await this.agent.runRebalanceCheck();
    });
    this.tasks.push(rebalanceTask);

    // Settlement batch
    const settlementTask = cron.schedule(this.config.agent.cronSettlement, async () => {
      this.logger.info('Cron trigger: settlement batch');
      await this.agent.runSettlementBatch();
    });
    this.tasks.push(settlementTask);

    // Compliance scan
    const complianceTask = cron.schedule(this.config.agent.cronCompliance, async () => {
      this.logger.info('Cron trigger: compliance scan');
      await this.agent.runComplianceScan();
    });
    this.tasks.push(complianceTask);

    this.logger.info(
      {
        rebalance: this.config.agent.cronRebalance,
        settlement: this.config.agent.cronSettlement,
        compliance: this.config.agent.cronCompliance,
      },
      'Scheduler started with cron schedules',
    );
  }

  stop(): void {
    this.logger.info('Stopping scheduler...');
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
    this.logger.info('Scheduler stopped');
  }
}
