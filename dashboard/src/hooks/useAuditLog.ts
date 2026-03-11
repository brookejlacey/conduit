'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { AuditEntry } from '@conduit/sdk';
import { AUDIT_LOG_PROGRAM_ID, decodeAuditEntry } from '@conduit/sdk';

interface UseAuditLogResult {
  entries: AuditEntry[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useAuditLog(): UseAuditLogResult {
  const { connection } = useConnection();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const subscriptionRef = useRef<number | null>(null);

  const fetchAuditLog = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);

      const accounts = await connection.getProgramAccounts(AUDIT_LOG_PROGRAM_ID, {
        commitment: 'confirmed',
      });

      const decoded: AuditEntry[] = [];
      for (const { account } of accounts) {
        try {
          const entry = decodeAuditEntry(Buffer.from(account.data));
          decoded.push(entry);
        } catch {
          continue;
        }
      }

      decoded.sort((a, b) => b.timestamp.toNumber() - a.timestamp.toNumber());
      setEntries(decoded);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch audit log'));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchAuditLog(true);

    try {
      subscriptionRef.current = connection.onProgramAccountChange(
        AUDIT_LOG_PROGRAM_ID,
        () => { fetchAuditLog(false); },
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
  }, [connection, refreshKey, fetchAuditLog]);

  return {
    entries,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
