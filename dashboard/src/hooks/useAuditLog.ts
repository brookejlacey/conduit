'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { AuditEntry } from '@conduit/sdk';
import { AUDIT_LOG_PROGRAM_ID, decodeAuditEntry, hasDiscriminator, ACCOUNT_DISCRIMINATOR } from '@conduit/sdk';

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

  const fetchAuditLog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const accounts = await Promise.race([
        connection.getProgramAccounts(AUDIT_LOG_PROGRAM_ID, { commitment: 'confirmed' }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('RPC request timed out')), 10000)),
      ]);

      const decoded: AuditEntry[] = [];
      for (const { account } of accounts) {
        const data = Buffer.from(account.data);
        if (!hasDiscriminator(data, ACCOUNT_DISCRIMINATOR.AuditEntry)) continue;
        try {
          const entry = decodeAuditEntry(data);
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
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog, refreshKey]);

  return {
    entries,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
