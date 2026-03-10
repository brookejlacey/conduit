import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum AuthorityTier {
  Observer = 0,
  Executor = 1,
  Manager = 2,
  Admin = 3,
}

export interface Institution {
  name: number[];
  admin: PublicKey;
  kycHash: number[];
  agentCount: number;
  active: boolean;
  bump: number;
}

export interface AgentIdentity {
  institution: PublicKey;
  agentPubkey: PublicKey;
  authorityTier: number;
  scopedPrograms: PublicKey[];
  active: boolean;
  registeredAt: BN;
  lastActionAt: BN;
  bump: number;
}
