import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export interface AgentConfig {
  solana: {
    rpcUrl: string;
    network: string;
  };
  programs: {
    vault: PublicKey;
    agentRegistry: PublicKey;
    settlement: PublicKey;
    auditLog: PublicKey;
  };
  agent: {
    keypairPath: string;
    cronRebalance: string;
    cronSettlement: string;
    cronCompliance: string;
    logLevel: string;
  };
  anthropic: {
    apiKey: string;
  };
  institution: {
    name: string;
    kycHash: string;
    adminPubkey: string;
  };
}

export function loadConfig(): AgentConfig {
  return {
    solana: {
      rpcUrl: optionalEnv('NEXT_PUBLIC_SOLANA_RPC_URL', 'http://127.0.0.1:8899'),
      network: optionalEnv('NEXT_PUBLIC_SOLANA_NETWORK', 'localnet'),
    },
    programs: {
      vault: new PublicKey(
        optionalEnv('VAULT_PROGRAM_ID', 'Ctd8BHaHPD7QUjk18SeRkaadpkR5dDF2opq4Cn6vGPii'),
      ),
      agentRegistry: new PublicKey(
        optionalEnv('AGENT_REGISTRY_PROGRAM_ID', 'D6ixuieTocq25Rf2Ru4qAAuxSPx5mbR6UABjY7PoNDnh'),
      ),
      settlement: new PublicKey(
        optionalEnv('SETTLEMENT_PROGRAM_ID', 'DQj9jfTNEaMCrUD8DfAiRkcmMiragBYv33Qh27ZiZuYU'),
      ),
      auditLog: new PublicKey(
        optionalEnv('AUDIT_LOG_PROGRAM_ID', '9kDA9TbKmTMdSEpM4ZpYTYAmniuETRVL3uWWrS6CQ7ZG'),
      ),
    },
    agent: {
      keypairPath: optionalEnv('AGENT_KEYPAIR_PATH', '~/.config/solana/agent.json'),
      cronRebalance: optionalEnv('AGENT_CRON_REBALANCE', '*/15 * * * *'),
      cronSettlement: optionalEnv('AGENT_CRON_SETTLEMENT', '0 */4 * * *'),
      cronCompliance: optionalEnv('AGENT_CRON_COMPLIANCE', '*/5 * * * *'),
      logLevel: optionalEnv('AGENT_LOG_LEVEL', 'info'),
    },
    anthropic: {
      apiKey: requireEnv('ANTHROPIC_API_KEY'),
    },
    institution: {
      name: optionalEnv('INSTITUTION_NAME', 'DefaultInstitution'),
      kycHash: optionalEnv(
        'INSTITUTION_KYC_HASH',
        '0000000000000000000000000000000000000000000000000000000000000000',
      ),
      adminPubkey: optionalEnv('INSTITUTION_ADMIN_PUBKEY', ''),
    },
  };
}
