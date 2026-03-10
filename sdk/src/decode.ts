import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import type { VaultAccount, PolicyConfig } from './types/vault';
import type { AgentIdentity, Institution } from './types/agent';
import type { AuditEntry } from './types/audit';
import type { SettlementBatch, SettlementEntry } from './types/settlement';

/**
 * Anchor account discriminators (first 8 bytes SHA-256 of "account:<Name>")
 * These are used to identify account types when deserializing from raw bytes.
 */

function readPublicKey(data: Buffer, offset: number): PublicKey {
  return new PublicKey(data.subarray(offset, offset + 32));
}

function readU64(data: Buffer, offset: number): BN {
  return new BN(data.subarray(offset, offset + 8), 'le');
}

function readI64(data: Buffer, offset: number): BN {
  return new BN(data.subarray(offset, offset + 8), 'le');
}

function readU32LE(data: Buffer, offset: number): number {
  return data.readUInt32LE(offset);
}

function readU8(data: Buffer, offset: number): number {
  return data[offset];
}

/**
 * Decode a Vault account from raw account data.
 * Layout: 8 disc + 32 authority + 32 usx_token_account + 8 total_deposits + 8 yield_accrued
 *         + PolicyConfig + Vec<Pubkey> multisig_signers + 1 multisig_threshold + 32 institution + 1 bump
 */
export function decodeVaultAccount(data: Buffer): VaultAccount {
  let offset = 8; // skip discriminator

  const authority = readPublicKey(data, offset); offset += 32;
  const usxTokenAccount = readPublicKey(data, offset); offset += 32;
  const totalDeposits = readU64(data, offset); offset += 8;
  const yieldAccrued = readU64(data, offset); offset += 8;

  // Decode PolicyConfig
  const dailySpendLimit = readU64(data, offset); offset += 8;
  const maxSingleTxSize = readU64(data, offset); offset += 8;

  // Vec<Pubkey> approved_counterparties
  const numCounterparties = readU32LE(data, offset); offset += 4;
  const approvedCounterparties: PublicKey[] = [];
  for (let i = 0; i < numCounterparties; i++) {
    approvedCounterparties.push(readPublicKey(data, offset)); offset += 32;
  }

  const allowedTxTypes = readU8(data, offset); offset += 1;
  const dailySpent = readU64(data, offset); offset += 8;
  const lastResetTs = readI64(data, offset); offset += 8;

  const policy: PolicyConfig = {
    dailySpendLimit,
    maxSingleTxSize,
    approvedCounterparties,
    allowedTxTypes,
    dailySpent,
    lastResetTs,
  };

  // Vec<Pubkey> multisig_signers
  const numSigners = readU32LE(data, offset); offset += 4;
  const multisigSigners: PublicKey[] = [];
  for (let i = 0; i < numSigners; i++) {
    multisigSigners.push(readPublicKey(data, offset)); offset += 32;
  }

  const multisigThreshold = readU8(data, offset); offset += 1;
  const institution = readPublicKey(data, offset); offset += 32;
  const bump = readU8(data, offset);

  return {
    authority,
    usxTokenAccount,
    totalDeposits,
    yieldAccrued,
    policy,
    multisigSigners,
    multisigThreshold,
    institution,
    bump,
  };
}

/**
 * Decode an AgentIdentity account from raw account data.
 */
export function decodeAgentIdentity(data: Buffer): AgentIdentity {
  let offset = 8; // skip discriminator

  const institution = readPublicKey(data, offset); offset += 32;
  const agentPubkey = readPublicKey(data, offset); offset += 32;
  const authorityTier = readU8(data, offset); offset += 1;

  // Vec<Pubkey> scoped_programs
  const numPrograms = readU32LE(data, offset); offset += 4;
  const scopedPrograms: PublicKey[] = [];
  for (let i = 0; i < numPrograms; i++) {
    scopedPrograms.push(readPublicKey(data, offset)); offset += 32;
  }

  const active = readU8(data, offset) === 1; offset += 1;
  const registeredAt = readI64(data, offset); offset += 8;
  const lastActionAt = readI64(data, offset); offset += 8;
  const bump = readU8(data, offset);

  return {
    institution,
    agentPubkey,
    authorityTier,
    scopedPrograms,
    active,
    registeredAt,
    lastActionAt,
    bump,
  };
}

/**
 * Decode an Institution account from raw account data.
 */
export function decodeInstitution(data: Buffer): Institution {
  let offset = 8; // skip discriminator

  const name = Array.from(data.subarray(offset, offset + 32)); offset += 32;
  const admin = readPublicKey(data, offset); offset += 32;
  const kycHash = Array.from(data.subarray(offset, offset + 32)); offset += 32;
  const agentCount = readU32LE(data, offset); offset += 4;
  const active = readU8(data, offset) === 1; offset += 1;
  const bump = readU8(data, offset);

  return { name, admin, kycHash, agentCount, active, bump };
}

/**
 * Decode an AuditEntry account from raw account data.
 */
export function decodeAuditEntry(data: Buffer): AuditEntry {
  let offset = 8; // skip discriminator

  const agent = readPublicKey(data, offset); offset += 32;
  const institution = readPublicKey(data, offset); offset += 32;
  const actionType = readU8(data, offset); offset += 1;

  // Option<Pubkey> target_vault
  const hasTargetVault = readU8(data, offset) === 1; offset += 1;
  const targetVault = hasTargetVault ? readPublicKey(data, offset) : null; offset += 32;

  // Option<u64> amount
  const hasAmount = readU8(data, offset) === 1; offset += 1;
  const amount = hasAmount ? readU64(data, offset) : null; offset += 8;

  const reasoningHash = Array.from(data.subarray(offset, offset + 32)); offset += 32;
  const reasoningUri = Array.from(data.subarray(offset, offset + 64)); offset += 64;
  const timestamp = readI64(data, offset); offset += 8;
  const slot = readU64(data, offset); offset += 8;
  const bump = readU8(data, offset);

  return {
    agent,
    institution,
    actionType,
    targetVault,
    amount,
    reasoningHash,
    reasoningUri,
    timestamp,
    slot,
    bump,
  };
}

/**
 * Decode a SettlementBatch account from raw account data.
 */
export function decodeSettlementBatch(data: Buffer): SettlementBatch {
  let offset = 8; // skip discriminator

  const id = readU64(data, offset); offset += 8;
  const creator = readPublicKey(data, offset); offset += 32;
  const statusByte = readU8(data, offset); offset += 1;
  const entryCount = readU32LE(data, offset); offset += 4;
  const totalGross = readU64(data, offset); offset += 8;
  const totalNet = readU64(data, offset); offset += 8;
  const createdAt = readI64(data, offset); offset += 8;
  const settledAt = readI64(data, offset); offset += 8;
  const bump = readU8(data, offset);

  return {
    id,
    creator,
    status: statusByte,
    entryCount,
    totalGross,
    totalNet,
    createdAt,
    settledAt,
    bump,
  };
}

/**
 * Decode a SettlementEntry account from raw account data.
 */
export function decodeSettlementEntry(data: Buffer): SettlementEntry {
  let offset = 8; // skip discriminator

  const batch = readPublicKey(data, offset); offset += 32;
  const fromVault = readPublicKey(data, offset); offset += 32;
  const toVault = readPublicKey(data, offset); offset += 32;
  const amountUsx = readU64(data, offset); offset += 8;
  const destinationCurrency = Array.from(data.subarray(offset, offset + 3)); offset += 3;
  const fxRate = readU64(data, offset); offset += 8;
  const netOffset = readI64(data, offset); offset += 8;
  const bump = readU8(data, offset);

  return {
    batch,
    fromVault,
    toVault,
    amountUsx,
    destinationCurrency,
    fxRate,
    netOffset,
    bump,
  };
}
