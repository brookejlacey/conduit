import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface PolicyConfig {
  dailySpendLimit: BN;
  maxSingleTxSize: BN;
  approvedCounterparties: PublicKey[];
  allowedTxTypes: number;
  dailySpent: BN;
  lastResetTs: BN;
}

export interface VaultAccount {
  authority: PublicKey;
  usxTokenAccount: PublicKey;
  totalDeposits: BN;
  yieldAccrued: BN;
  policy: PolicyConfig;
  multisigSigners: PublicKey[];
  multisigThreshold: number;
  institution: PublicKey;
  bump: number;
}

export interface DepositReceipt {
  vault: PublicKey;
  depositor: PublicKey;
  amount: BN;
  timestamp: BN;
  kycHash: number[];
  bump: number;
}

export enum TxType {
  StandardTransfer = 0,
  Settlement = 1,
  YieldClaim = 2,
  Rebalance = 3,
}
