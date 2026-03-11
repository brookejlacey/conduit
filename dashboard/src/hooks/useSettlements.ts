'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const subscriptionRef = useRef<number | null>(null);

  const fetchBatches = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
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
          continue;
        }
      }

      decoded.sort((a, b) => b.createdAt.toNumber() - a.createdAt.toNumber());
      setBatches(decoded);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch settlements'));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchBatches(true);

    try {
      subscriptionRef.current = connection.onProgramAccountChange(
        SETTLEMENT_PROGRAM_ID,
        () => { fetchBatches(false); },
        'confirmed',
      );
    } catch {
      // WebSocket subscription may not be supported
    }

    return () => {
      if (subscriptionRef.current !== null) {
        connection.removeProgramAccountChangeListener(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [connection, refreshKey, fetchBatches]);

  return {
    batches,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
