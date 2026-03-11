'use client';

import { AgentCard } from '@/components/agent/AgentCard';
import { CardSkeleton } from '@/components/shared/Skeleton';
import { useAgents } from '@/hooks/useAgents';

export default function AgentsPage() {
  const { agents, loading, error, refresh } = useAgents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Agents</h1>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-4 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700"
          >
            Refresh
          </button>
          <button className="btn-primary">Register Agent</button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">Failed to load agents: {error.message}</p>
          <button onClick={refresh} className="mt-2 text-xs text-red-300 underline hover:text-red-200">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && agents.length === 0 && (
        <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
          <p className="text-conduit-navy-400">No agents found on the current network.</p>
          <p className="mt-1 text-xs text-conduit-navy-500">
            Register an agent through the agent-registry program.
          </p>
        </div>
      )}

      {!loading && agents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent, i) => (
            <AgentCard key={i} agent={agent} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
