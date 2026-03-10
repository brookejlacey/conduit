'use client';

import { useContext, createContext } from 'react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

export interface ProgramContextType {
  provider: AnchorProvider | null;
}

export const ProgramContext = createContext<ProgramContextType>({ provider: null });

export function useProgram(): ProgramContextType {
  return useContext(ProgramContext);
}

export function useAnchorProvider(): AnchorProvider | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;

  return new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
}
