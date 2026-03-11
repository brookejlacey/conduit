'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { AgentIdentity } from '@conduit/sdk';
import { AGENT_REGISTRY_PROGRAM_ID, decodeAgentIdentity } from '@conduit/sdk';

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
  const subscriptionRef = useRef<number | null>(null);

  const fetchAgents = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);

      const accounts = await connection.getProgramAccounts(AGENT_REGISTRY_PROGRAM_ID, {
        commitment: 'confirmed',
      });

      const decoded: AgentIdentity[] = [];
      for (const { account } of accounts) {
        try {
          const agent = decodeAgentIdentity(Buffer.from(account.data));
          decoded.push(agent);
        } catch {
          continue;
        }
      }

      setAgents(decoded);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchAgents(true);

    try {
      subscriptionRef.current = connection.onProgramAccountChange(
        AGENT_REGISTRY_PROGRAM_ID,
        () => { fetchAgents(false); },
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
  }, [connection, refreshKey, fetchAgents]);

  return {
    agents,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
