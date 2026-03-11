'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { VaultAccount } from '@conduit/sdk';
import { VAULT_PROGRAM_ID, decodeVaultAccount } from '@conduit/sdk';

interface UseVaultsResult {
  vaults: VaultAccount[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useVaults(): UseVaultsResult {
  const { connection } = useConnection();
  const [vaults, setVaults] = useState<VaultAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const subscriptionRef = useRef<number | null>(null);

  const fetchVaults = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);

      const accounts = await connection.getProgramAccounts(VAULT_PROGRAM_ID, {
        commitment: 'confirmed',
      });

      const decoded: VaultAccount[] = [];
      for (const { account } of accounts) {
        try {
          const vault = decodeVaultAccount(Buffer.from(account.data));
          decoded.push(vault);
        } catch {
          continue;
        }
      }

      setVaults(decoded);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vaults'));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchVaults(true);

    // Subscribe to program account changes for real-time updates
    try {
      subscriptionRef.current = connection.onProgramAccountChange(
        VAULT_PROGRAM_ID,
        () => { fetchVaults(false); },
        'confirmed',
      );
    } catch {
      // WebSocket subscription may not be supported on all endpoints
    }

    return () => {
      if (subscriptionRef.current !== null) {
        connection.removeProgramAccountChangeListener(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [connection, refreshKey, fetchVaults]);

  return {
    vaults,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
