'use client';

import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { AuditEntry } from '@conduit/sdk';
import { AUDIT_LOG_PROGRAM_ID } from '@conduit/sdk';

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

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        setLoading(true);
        setError(null);

        const accounts = await connection.getProgramAccounts(AUDIT_LOG_PROGRAM_ID, {
          commitment: 'confirmed',
        });

        console.log(`Found ${accounts.length} audit log entries`);
        setEntries([]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch audit log'));
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLog();
  }, [connection, refreshKey]);

  return {
    entries,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
