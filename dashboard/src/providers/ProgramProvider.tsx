'use client';

import { ReactNode, useMemo } from 'react';
import { ProgramContext, useAnchorProvider } from '@/hooks/useProgram';

interface ProgramProviderProps {
  children: ReactNode;
}

export function ProgramProvider({ children }: ProgramProviderProps) {
  const provider = useAnchorProvider();

  const value = useMemo(() => ({ provider }), [provider]);

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>;
}
