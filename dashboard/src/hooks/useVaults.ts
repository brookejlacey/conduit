'use client';

import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { VaultAccount } from '@conduit/sdk';
import { VAULT_PROGRAM_ID } from '@conduit/sdk';

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

  useEffect(() => {
    async function fetchVaults() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all program accounts for the vault program
        const accounts = await connection.getProgramAccounts(VAULT_PROGRAM_ID, {
          commitment: 'confirmed',
        });

        // In production, deserialize accounts using Anchor's IDL
        // For now, we return the raw account list length for debugging
        console.log(`Found ${accounts.length} vault accounts`);

        // Deserialization would happen here with the IDL
        setVaults([]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch vaults'));
      } finally {
        setLoading(false);
      }
    }

    fetchVaults();
  }, [connection, refreshKey]);

  return {
    vaults,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
