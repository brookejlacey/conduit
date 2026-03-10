import { loadConfig } from './config';
import { createConnection } from './chain/connection';
import { loadWallet } from './core/wallet';
import { ConduitAgent } from './core/agent';
import { Scheduler } from './core/scheduler';
import { createLogger } from './logging/local';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.agent.logLevel);

  logger.info('Starting Conduit Agent...');

  const connection = createConnection(config.solana.rpcUrl);
  const wallet = loadWallet(config.agent.keypairPath);

  logger.info({ pubkey: wallet.publicKey.toBase58() }, 'Agent wallet loaded');

  const agent = new ConduitAgent(connection, wallet, config, logger);
  await agent.initialize();

  const scheduler = new Scheduler(agent, config, logger);
  scheduler.start();

  logger.info('Conduit Agent is running');

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down...');
    scheduler.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
