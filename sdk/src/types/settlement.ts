import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum SettlementStatus {
  Open = 0,
  Processing = 1,
  Settled = 2,
  Failed = 3,
}

export interface SettlementBatch {
  id: BN;
  creator: PublicKey;
  status: SettlementStatus;
  entryCount: number;
  totalGross: BN;
  totalNet: BN;
  createdAt: BN;
  settledAt: BN;
  bump: number;
}

export interface SettlementEntry {
  batch: PublicKey;
  fromVault: PublicKey;
  toVault: PublicKey;
  amountUsx: BN;
  destinationCurrency: number[];
  fxRate: BN;
  netOffset: BN;
  bump: number;
}

export interface FxRate {
  pair: number[];
  rate: BN;
  updatedAt: BN;
  oracle: PublicKey;
  bump: number;
}
