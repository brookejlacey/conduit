'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { AgentIdentity } from '@conduit/sdk';
import { AGENT_REGISTRY_PROGRAM_ID, decodeAgentIdentity, hasDiscriminator, ACCOUNT_DISCRIMINATOR } from '@conduit/sdk';

interface UseAgentsResult {
  agents: AgentIdentity[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useAgents(): UseAgentsResult {
  const { connection } = useConnection();
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const accounts = await Promise.race([
        connection.getProgramAccounts(AGENT_REGISTRY_PROGRAM_ID, { commitment: 'confirmed' }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('RPC request timed out')), 10000)),
      ]);

      const decoded: AgentIdentity[] = [];
      for (const { account } of accounts) {
        const data = Buffer.from(account.data);
        if (!hasDiscriminator(data, ACCOUNT_DISCRIMINATOR.AgentIdentity)) continue;
        try {
          const agent = decodeAgentIdentity(data);
          decoded.push(agent);
        } catch {
          continue;
        }
      }

      setAgents(decoded);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents, refreshKey]);

  return {
    agents,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
