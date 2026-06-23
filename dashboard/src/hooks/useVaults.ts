'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { VaultAccount } from '@conduit/sdk';
import { VAULT_PROGRAM_ID, decodeVaultAccount, hasDiscriminator, ACCOUNT_DISCRIMINATOR } from '@conduit/sdk';

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

  const fetchVaults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const accounts = await Promise.race([
        connection.getProgramAccounts(VAULT_PROGRAM_ID, { commitment: 'confirmed' }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('RPC request timed out')), 10000)),
      ]);

      const decoded: VaultAccount[] = [];
      for (const { account } of accounts) {
        const data = Buffer.from(account.data);
        if (!hasDiscriminator(data, ACCOUNT_DISCRIMINATOR.Vault)) continue;
        try {
          const vault = decodeVaultAccount(data);
          decoded.push(vault);
        } catch {
          continue;
        }
      }

      setVaults(decoded);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vaults'));
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults, refreshKey]);

  return {
    vaults,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
