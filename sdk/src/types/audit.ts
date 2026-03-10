import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum ActionType {
  Deposit = 0,
  Withdraw = 1,
  Rebalance = 2,
  Settlement = 3,
  PolicyUpdate = 4,
  YieldAccrual = 5,
}

export interface AuditEntry {
  agent: PublicKey;
  institution: PublicKey;
  actionType: number;
  targetVault: PublicKey | null;
  amount: BN | null;
  reasoningHash: number[];
  reasoningUri: number[];
  timestamp: BN;
  slot: BN;
  bump: number;
}
