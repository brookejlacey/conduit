'use client';

import Link from 'next/link';
import type { AgentIdentity } from '@conduit/sdk';
import { TierBadge } from './TierBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, shortenAddress } from '@/lib/format';

interface AgentCardProps {
  agent: AgentIdentity;
  index: number;
}

export function AgentCard({ agent, index }: AgentCardProps) {
  const lastAction = agent.lastActionAt.toNumber() * 1000;
  const registeredAt = agent.registeredAt.toNumber() * 1000;

  return (
    <Link href={`/dashboard/agents/${index}`} className="card-hover block">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-conduit-navy-700">
            <svg
              className="h-5 w-5 text-conduit-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-conduit-navy-100">
              {shortenAddress(agent.agentPubkey.toBase58())}
            </p>
            <TierBadge tier={agent.authorityTier} />
          </div>
        </div>
        <StatusBadge status={agent.active ? 'success' : 'inactive'} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-xs text-conduit-navy-400">Scoped Programs</span>
          <span className="text-xs text-conduit-navy-200">{agent.scopedPrograms.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-conduit-navy-400">Last Action</span>
          <span className="text-xs text-conduit-navy-200">{formatDate(lastAction)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-conduit-navy-400">Registered</span>
          <span className="text-xs text-conduit-navy-200">{formatDate(registeredAt)}</span>
        </div>
      </div>

      {agent.active && (
        <button className="mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20">
          Deactivate (Kill Switch)
        </button>
      )}
    </Link>
  );
}
