import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  VAULT_PROGRAM_ID,
  AGENT_REGISTRY_PROGRAM_ID,
  SETTLEMENT_PROGRAM_ID,
  AUDIT_LOG_PROGRAM_ID,
  VAULT_SEED,
  DEPOSIT_SEED,
  INSTITUTION_SEED,
  AGENT_SEED,
  BATCH_SEED,
  ENTRY_SEED,
  FX_RATE_SEED,
  AUDIT_SEED,
} from './constants';

export function findVaultPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), authority.toBuffer()],
    VAULT_PROGRAM_ID,
  );
}

export function findDepositReceiptPda(
  vault: PublicKey,
  depositor: PublicKey,
  depositIndex: BN,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(DEPOSIT_SEED),
      vault.toBuffer(),
      depositor.toBuffer(),
      depositIndex.toArrayLike(Buffer, 'le', 8),
    ],
    VAULT_PROGRAM_ID,
  );
}

export function findInstitutionPda(admin: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(INSTITUTION_SEED), admin.toBuffer()],
    AGENT_REGISTRY_PROGRAM_ID,
  );
}

export function findAgentPda(institution: PublicKey, agentPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(AGENT_SEED), institution.toBuffer(), agentPubkey.toBuffer()],
    AGENT_REGISTRY_PROGRAM_ID,
  );
}

export function findSettlementBatchPda(creator: PublicKey, batchId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BATCH_SEED), creator.toBuffer(), batchId.toArrayLike(Buffer, 'le', 8)],
    SETTLEMENT_PROGRAM_ID,
  );
}

export function findSettlementEntryPda(batch: PublicKey, entryIndex: number): [PublicKey, number] {
  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32LE(entryIndex, 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ENTRY_SEED), batch.toBuffer(), indexBuffer],
    SETTLEMENT_PROGRAM_ID,
  );
}

export function findFxRatePda(pair: Buffer): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(FX_RATE_SEED), pair],
    SETTLEMENT_PROGRAM_ID,
  );
}

export function findAuditEntryPda(agent: PublicKey, slot: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(AUDIT_SEED), agent.toBuffer(), slot.toArrayLike(Buffer, 'le', 8)],
    AUDIT_LOG_PROGRAM_ID,
  );
}
