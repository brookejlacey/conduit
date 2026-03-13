import { loadConfig, AuthorityTier } from './config';
import { createConnection } from './chain/connection';
import { loadWallet } from './core/wallet';
import { ConduitAgent } from './core/agent';
import { Scheduler } from './core/scheduler';
import { createLogger } from './logging/local';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.agent.logLevel);

  logger.info({ instanceCount: config.agents.length }, 'Starting Conduit Agent Service...');

  const connection = createConnection(config.solana.rpcUrl);

  const agents: ConduitAgent[] = [];
  const schedulers: Scheduler[] = [];

  for (const agentInstance of config.agents) {
    const instanceLogger = logger.child({ agent: agentInstance.name });

    let wallet;
    try {
      wallet = loadWallet(agentInstance.keypairPath);
    } catch (err) {
      instanceLogger.error({ err, keypairPath: agentInstance.keypairPath }, 'Failed to load agent wallet, skipping');
      continue;
    }

    instanceLogger.info(
      { pubkey: wallet.publicKey.toBase58(), tier: agentInstance.tier },
      'Agent wallet loaded',
    );

    // Override per-instance cron schedules in config
    const instanceConfig = {
      ...config,
      agent: {
        ...config.agent,
        keypairPath: agentInstance.keypairPath,
        cronRebalance: agentInstance.cronRebalance,
        cronSettlement: agentInstance.cronSettlement,
        cronCompliance: agentInstance.cronCompliance,
      },
    };

    const agent = new ConduitAgent(
      connection,
      wallet,
      instanceConfig,
      instanceLogger,
      agentInstance.name,
      agentInstance.tier as AuthorityTier,
    );
    await agent.initialize();

    const scheduler = new Scheduler(agent, instanceConfig, instanceLogger);
    scheduler.start();

    agents.push(agent);
    schedulers.push(scheduler);
  }

  if (agents.length === 0) {
    logger.error('No agents started. Check keypair paths and configuration.');
    process.exit(1);
  }

  logger.info(
    { agents: agents.map((a) => ({ name: a.name, tier: a.tier })) },
    'All agents running',
  );

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down all agents...');
    for (const s of schedulers) s.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
