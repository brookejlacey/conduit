import { PublicKey } from '@solana/web3.js';

// Program IDs - update these after `anchor build`
export const VAULT_PROGRAM_ID = new PublicKey(
  process.env.VAULT_PROGRAM_ID || 'Ctd8BHaHPD7QUjk18SeRkaadpkR5dDF2opq4Cn6vGPii',
);

export const AGENT_REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.AGENT_REGISTRY_PROGRAM_ID || 'D6ixuieTocq25Rf2Ru4qAAuxSPx5mbR6UABjY7PoNDnh',
);

export const SETTLEMENT_PROGRAM_ID = new PublicKey(
  process.env.SETTLEMENT_PROGRAM_ID || 'DQj9jfTNEaMCrUD8DfAiRkcmMiragBYv33Qh27ZiZuYU',
);

export const AUDIT_LOG_PROGRAM_ID = new PublicKey(
  process.env.AUDIT_LOG_PROGRAM_ID || '9kDA9TbKmTMdSEpM4ZpYTYAmniuETRVL3uWWrS6CQ7ZG',
);

// PDA Seeds
export const VAULT_SEED = 'vault';
export const DEPOSIT_SEED = 'deposit';
export const INSTITUTION_SEED = 'institution';
export const AGENT_SEED = 'agent';
export const BATCH_SEED = 'batch';
export const ENTRY_SEED = 'entry';
export const FX_RATE_SEED = 'fx_rate';
export const AUDIT_SEED = 'audit';

// FX rate precision (1e8)
export const FX_RATE_DECIMALS = 8;
export const FX_RATE_SCALE = 10 ** FX_RATE_DECIMALS;

// USX token decimals
export const USX_DECIMALS = 6;
