import { PublicKey } from '@solana/web3.js';

// Program IDs - update these after `anchor build`
export const VAULT_PROGRAM_ID = new PublicKey(
  process.env.VAULT_PROGRAM_ID || 'GdmDuzHbXd2hytSpPyfwnaARSCTnntbTnniAPLr3JRHb',
);

export const AGENT_REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.AGENT_REGISTRY_PROGRAM_ID || '2bm9F6XrH3NoTKUQgSM5uP5edKtGpcau9pHK6QiPUz5v',
);

export const SETTLEMENT_PROGRAM_ID = new PublicKey(
  process.env.SETTLEMENT_PROGRAM_ID || '7Mm3yQsmkpEeWT5LSpjZn4vucT4n1vcLswG6LCHSZeAe',
);

export const AUDIT_LOG_PROGRAM_ID = new PublicKey(
  process.env.AUDIT_LOG_PROGRAM_ID || 'ATyFG3Bc481rrNCWa7pBHvSVgY1tc6nW8mTC2pcm6kqT',
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
