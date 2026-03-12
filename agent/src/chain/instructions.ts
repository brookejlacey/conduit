/**
 * Borsh-encoded Anchor instruction builders for all Conduit programs.
 *
 * Anchor instructions start with an 8-byte discriminator derived from
 * SHA-256("global:<method_name>")[0..8], followed by the Borsh-serialized arguments.
 *
 * Borsh encodes:
 *   u8        → 1 byte
 *   u64       → 8 bytes little-endian
 *   i64       → 8 bytes little-endian (signed)
 *   Pubkey    → 32 bytes
 *   [u8; N]   → N bytes (fixed array, no length prefix)
 *   Option<T> → 1 byte (0=None, 1=Some) + T if Some
 *   Vec<T>    → 4 bytes LE length + T * length
 */

import { createHash } from 'crypto';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import {
  VAULT_PROGRAM_ID,
  AGENT_REGISTRY_PROGRAM_ID,
  SETTLEMENT_PROGRAM_ID,
  AUDIT_LOG_PROGRAM_ID,
} from '@conduit/sdk';

// ---------------------------------------------------------------------------
// Discriminator helper
// ---------------------------------------------------------------------------

function anchorDiscriminator(methodName: string): Buffer {
  const hash = createHash('sha256')
    .update(`global:${methodName}`)
    .digest();
  return hash.subarray(0, 8);
}

// ---------------------------------------------------------------------------
// Borsh encoding helpers
// ---------------------------------------------------------------------------

function encodeU8(val: number): Buffer {
  return Buffer.from([val]);
}

function encodeU64(val: BN | number): Buffer {
  const bn = typeof val === 'number' ? new BN(val) : val;
  return bn.toArrayLike(Buffer, 'le', 8);
}

function encodePubkey(key: PublicKey): Buffer {
  return key.toBuffer();
}

function encodeOptionPubkey(key: PublicKey | null): Buffer {
  if (key === null) return Buffer.from([0]);
  return Buffer.concat([Buffer.from([1]), key.toBuffer()]);
}

function encodeOptionU64(val: BN | number | null): Buffer {
  if (val === null) return Buffer.from([0]);
  return Buffer.concat([Buffer.from([1]), encodeU64(val)]);
}

function encodeI64(val: BN | number): Buffer {
  const bn = typeof val === 'number' ? new BN(val) : val;
  return bn.toArrayLike(Buffer, 'le', 8);
}

function encodeFixedBytes(data: number[] | Buffer, len: number): Buffer {
  const buf = Buffer.alloc(len, 0);
  const src = Buffer.isBuffer(data) ? data : Buffer.from(data);
  src.copy(buf, 0, 0, Math.min(src.length, len));
  return buf;
}

function encodeVecPubkey(keys: PublicKey[]): Buffer {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(keys.length, 0);
  return Buffer.concat([lenBuf, ...keys.map((k) => k.toBuffer())]);
}


// ---------------------------------------------------------------------------
// AGENT REGISTRY PROGRAM INSTRUCTIONS
// ---------------------------------------------------------------------------

export function createRegisterInstitutionIx(
  institution: PublicKey,
  admin: PublicKey,
  name: Buffer | number[],
  kycHash: Buffer | number[],
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('register_institution'),
    encodeFixedBytes(name, 32),
    encodeFixedBytes(kycHash, 32),
  ]);

  return new TransactionInstruction({
    programId: AGENT_REGISTRY_PROGRAM_ID,
    keys: [
      { pubkey: institution, isSigner: false, isWritable: true },
      { pubkey: admin, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createRegisterAgentIx(
  institution: PublicKey,
  agent: PublicKey,
  agentPubkey: PublicKey,
  admin: PublicKey,
  authorityTier: number,
  scopedPrograms: PublicKey[],
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('register_agent'),
    encodeU8(authorityTier),
    encodeVecPubkey(scopedPrograms),
  ]);

  return new TransactionInstruction({
    programId: AGENT_REGISTRY_PROGRAM_ID,
    keys: [
      { pubkey: institution, isSigner: false, isWritable: true },
      { pubkey: agent, isSigner: false, isWritable: true },
      { pubkey: agentPubkey, isSigner: false, isWritable: false },
      { pubkey: admin, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ---------------------------------------------------------------------------
// VAULT PROGRAM INSTRUCTIONS
// ---------------------------------------------------------------------------

/**
 * Borsh encoding for PolicyConfig struct:
 *   daily_spend_limit: u64
 *   max_single_tx_size: u64
 *   approved_counterparties: Vec<Pubkey>
 *   allowed_tx_types: u8
 *   daily_spent: u64
 *   last_reset_ts: i64
 */
export interface PolicyConfigArgs {
  dailySpendLimit: BN;
  maxSingleTxSize: BN;
  approvedCounterparties: PublicKey[];
  allowedTxTypes: number;
  dailySpent: BN;
  lastResetTs: BN;
}

function encodePolicyConfig(policy: PolicyConfigArgs): Buffer {
  return Buffer.concat([
    encodeU64(policy.dailySpendLimit),
    encodeU64(policy.maxSingleTxSize),
    encodeVecPubkey(policy.approvedCounterparties),
    encodeU8(policy.allowedTxTypes),
    encodeU64(policy.dailySpent),
    encodeI64(policy.lastResetTs),
  ]);
}

export function createInitializeVaultIx(
  vault: PublicKey,
  usxTokenAccount: PublicKey,
  authority: PublicKey,
  policy: PolicyConfigArgs,
  multisigSigners: PublicKey[],
  multisigThreshold: number,
  institution: PublicKey,
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('initialize_vault'),
    encodePolicyConfig(policy),
    encodeVecPubkey(multisigSigners),
    encodeU8(multisigThreshold),
    encodePubkey(institution),
  ]);

  return new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: usxTokenAccount, isSigner: false, isWritable: false },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createInitializeSettlementConfigIx(
  config: PublicKey,
  admin: PublicKey,
  maxFxRateAge: BN,
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('initialize_config'),
    encodeI64(maxFxRateAge),
  ]);

  return new TransactionInstruction({
    programId: SETTLEMENT_PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: admin, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createDepositIx(
  vault: PublicKey,
  depositReceipt: PublicKey,
  depositorTokenAccount: PublicKey,
  vaultTokenAccount: PublicKey,
  depositor: PublicKey,
  amount: BN,
  kycHash: Buffer | number[],
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('deposit'),
    encodeU64(amount),
    encodeFixedBytes(kycHash, 32),
  ]);

  return new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: depositReceipt, isSigner: false, isWritable: true },
      { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
      { pubkey: depositor, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createWithdrawIx(
  vault: PublicKey,
  vaultTokenAccount: PublicKey,
  destinationTokenAccount: PublicKey,
  authority: PublicKey,
  amount: BN,
  txType: number,
  counterparty: PublicKey,
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('withdraw'),
    encodeU64(amount),
    encodeU8(txType),
    encodePubkey(counterparty),
  ]);

  return new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
      { pubkey: destinationTokenAccount, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createAccrueYieldIx(
  vault: PublicKey,
  yieldSourceTokenAccount: PublicKey,
  vaultTokenAccount: PublicKey,
  authority: PublicKey,
  yieldAmount: BN,
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('accrue_yield'),
    encodeU64(yieldAmount),
  ]);

  return new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    keys: [
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: yieldSourceTokenAccount, isSigner: false, isWritable: true },
      { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ---------------------------------------------------------------------------
// SETTLEMENT PROGRAM INSTRUCTIONS
// ---------------------------------------------------------------------------

export function createBatchIx(
  batch: PublicKey,
  creator: PublicKey,
  batchId: BN,
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('create_batch'),
    encodeU64(batchId),
  ]);

  return new TransactionInstruction({
    programId: SETTLEMENT_PROGRAM_ID,
    keys: [
      { pubkey: batch, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createAddEntryIx(
  batch: PublicKey,
  entry: PublicKey,
  fromVault: PublicKey,
  toVault: PublicKey,
  creator: PublicKey,
  amountUsx: BN,
  destinationCurrency: number[],
  fxRate: BN,
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('add_entry'),
    encodeU64(amountUsx),
    encodeFixedBytes(destinationCurrency, 3),
    encodeU64(fxRate),
  ]);

  return new TransactionInstruction({
    programId: SETTLEMENT_PROGRAM_ID,
    keys: [
      { pubkey: batch, isSigner: false, isWritable: true },
      { pubkey: entry, isSigner: false, isWritable: true },
      { pubkey: fromVault, isSigner: false, isWritable: false },
      { pubkey: toVault, isSigner: false, isWritable: false },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createExecuteSettlementIx(
  batch: PublicKey,
  fromTokenAccount: PublicKey,
  toTokenAccount: PublicKey,
  creator: PublicKey,
): TransactionInstruction {
  const data = anchorDiscriminator('execute_settlement');

  return new TransactionInstruction({
    programId: SETTLEMENT_PROGRAM_ID,
    keys: [
      { pubkey: batch, isSigner: false, isWritable: true },
      { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
      { pubkey: toTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ---------------------------------------------------------------------------
// AUDIT LOG PROGRAM INSTRUCTIONS
// ---------------------------------------------------------------------------

export function createLogEventIx(
  auditEntry: PublicKey,
  agent: PublicKey,
  agentIdentity: PublicKey,
  institution: PublicKey,
  actionType: number,
  targetVault: PublicKey | null,
  amount: BN | null,
  reasoningHash: Buffer | number[],
  reasoningUri: Buffer | number[],
  nonce: BN,
): TransactionInstruction {
  const data = Buffer.concat([
    anchorDiscriminator('log_event'),
    encodeU8(actionType),
    encodeOptionPubkey(targetVault),
    encodeOptionU64(amount),
    encodeFixedBytes(reasoningHash, 32),
    encodeFixedBytes(reasoningUri, 64),
    encodeU64(nonce),
  ]);

  return new TransactionInstruction({
    programId: AUDIT_LOG_PROGRAM_ID,
    keys: [
      { pubkey: auditEntry, isSigner: false, isWritable: true },
      { pubkey: agent, isSigner: true, isWritable: true },
      { pubkey: agentIdentity, isSigner: false, isWritable: false },
      { pubkey: institution, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}
