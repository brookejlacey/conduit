'use client';

import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { SettlementBatch } from '@conduit/sdk';
import { SETTLEMENT_PROGRAM_ID, decodeSettlementBatch } from '@conduit/sdk';

interface UseSettlementsResult {
  batches: SettlementBatch[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useSettlements(): UseSettlementsResult {
  const { connection } = useConnection();
  const [batches, setBatches] = useState<SettlementBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchBatches() {
      try {
        setLoading(true);
        setError(null);

        const accounts = await connection.getProgramAccounts(SETTLEMENT_PROGRAM_ID, {
          commitment: 'confirmed',
        });

        const decoded: SettlementBatch[] = [];
        for (const { account } of accounts) {
          try {
            const batch = decodeSettlementBatch(Buffer.from(account.data));
            decoded.push(batch);
          } catch {
            // Skip non-batch accounts (entries, FX rates, config)
            continue;
          }
        }

        // Sort by createdAt descending
        decoded.sort((a, b) => b.createdAt.toNumber() - a.createdAt.toNumber());

        setBatches(decoded);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch settlements'));
      } finally {
        setLoading(false);
      }
    }

    fetchBatches();
  }, [connection, refreshKey]);

  return {
    batches,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
