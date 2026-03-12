'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useAgents } from '@/hooks/useAgents';
import { useAuditLog } from '@/hooks/useAuditLog';
import { TierBadge } from '@/components/agent/TierBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DecisionTimeline } from '@/components/agent/DecisionTimeline';
import { ReasoningReplay } from '@/components/agent/ReasoningReplay';
import { formatDate, formatUsx, shortenAddress } from '@/lib/format';
import { ActionType } from '@conduit/sdk';

const ACTION_LABELS: Record<number, string> = {
  [ActionType.Deposit]: 'Deposit',
  [ActionType.Withdraw]: 'Withdraw',
  [ActionType.Rebalance]: 'Rebalance',
  [ActionType.Settlement]: 'Settlement',
  [ActionType.PolicyUpdate]: 'Policy Update',
  [ActionType.YieldAccrual]: 'Yield Accrual',
};

type ViewMode = 'timeline' | 'replay';

export default function AgentDetailPage({ params }: { params: Promise<{ index: string }> }) {
  const { index } = use(params);
  const agentIndex = parseInt(index, 10);
  const { agents, loading, error } = useAgents();
  const { entries: auditEntries, loading: auditLoading } = useAuditLog();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
        <span className="ml-3 text-conduit-navy-300">Loading agent...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/agents" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back to Agents</Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">Failed to load agent: {error.message}</p>
        </div>
      </div>
    );
  }

  if (isNaN(agentIndex) || agentIndex < 0 || agentIndex >= agents.length) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/agents" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back to Agents</Link>
        <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
          <p className="text-conduit-navy-400">Agent not found.</p>
        </div>
      </div>
    );
  }

  const agent = agents[agentIndex];
  const registeredAt = agent.registeredAt.toNumber() * 1000;
  const lastAction = agent.lastActionAt.toNumber() * 1000;

  // Filter audit entries for this agent
  const agentAuditEntries = auditEntries.filter(
    (e) => e.agent.toBase58() === agent.agentPubkey.toBase58()
  );

  // Convert to DecisionTimeline format
  const timelineEntries = agentAuditEntries.map((entry, i) => ({
    id: `${i}`,
    agent: shortenAddress(entry.agent.toBase58()),
    actionType: ACTION_LABELS[entry.actionType] || `Action ${entry.actionType}`,
    targetVault: entry.targetVault ? shortenAddress(entry.targetVault.toBase58()) : null,
    amount: entry.amount ? Number(entry.amount.toString()) : null,
    reasoning: entry.reasoningUri.length > 0
      ? String.fromCharCode(...entry.reasoningUri.filter((b) => b !== 0))
      : 'No reasoning URI recorded',
    timestamp: entry.timestamp.toNumber() * 1000,
    slot: Number(entry.slot.toString()),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back</Link>
          <h1 className="text-2xl font-bold text-conduit-navy-50">Agent Detail</h1>
          <StatusBadge status={agent.active ? 'success' : 'inactive'} />
        </div>
        {agent.active && (
          <button className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">
            Deactivate (Kill Switch)
          </button>
        )}
      </div>

      {/* Agent Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Identity</h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-conduit-navy-400">Agent Public Key</span>
              <p className="font-mono text-sm text-conduit-navy-200">{agent.agentPubkey.toBase58()}</p>
            </div>
            <div>
              <span className="text-xs text-conduit-navy-400">Institution</span>
              <p className="font-mono text-sm text-conduit-navy-200">{agent.institution.toBase58()}</p>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-conduit-navy-400">Authority Tier</span>
              <TierBadge tier={agent.authorityTier} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Registered</span>
              <span className="text-sm text-conduit-navy-200">{formatDate(registeredAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Last Action</span>
              <span className="text-sm text-conduit-navy-200">{formatDate(lastAction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Total Actions</span>
              <span className="text-sm font-medium text-conduit-navy-200">{agentAuditEntries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Status</span>
              <span className={`text-sm font-medium ${agent.active ? 'text-conduit-emerald-400' : 'text-conduit-navy-400'}`}>
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scoped Programs */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">
          Scoped Programs ({agent.scopedPrograms.length})
        </h2>
        {agent.scopedPrograms.length === 0 ? (
          <p className="text-sm text-conduit-navy-400">No scoped programs configured.</p>
        ) : (
          <div className="space-y-2">
            {agent.scopedPrograms.map((program, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-conduit-navy-800 p-3">
                <div className="h-2 w-2 rounded-full bg-conduit-blue-400" />
                <span className="font-mono text-sm text-conduit-navy-200">{program.toBase58()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Timeline / Reasoning Replay */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-conduit-navy-100">
            {viewMode === 'timeline' ? 'Decision Timeline' : 'Reasoning Replay'}
          </h2>
          <div className="flex rounded-lg border border-conduit-navy-600 bg-conduit-navy-800">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-medium transition ${viewMode === 'timeline' ? 'bg-conduit-blue-500/20 text-conduit-blue-400' : 'text-conduit-navy-400 hover:text-conduit-navy-200'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('replay')}
              className={`px-3 py-1.5 text-xs font-medium transition ${viewMode === 'replay' ? 'bg-conduit-blue-500/20 text-conduit-blue-400' : 'text-conduit-navy-400 hover:text-conduit-navy-200'}`}
            >
              Replay
            </button>
          </div>
        </div>

        {auditLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
            <span className="ml-2 text-sm text-conduit-navy-300">Loading decisions...</span>
          </div>
        )}
        {!auditLoading && timelineEntries.length === 0 && (
          <p className="py-4 text-center text-sm text-conduit-navy-400">No decisions recorded for this agent.</p>
        )}
        {!auditLoading && timelineEntries.length > 0 && viewMode === 'timeline' && (
          <DecisionTimeline entries={timelineEntries} />
        )}
        {!auditLoading && timelineEntries.length > 0 && viewMode === 'replay' && (
          <ReasoningReplay
            entries={timelineEntries.map((e) => ({
              ...e,
              reasoningHash: e.reasoning.includes('hash:')
                ? e.reasoning.split('hash: ')[1]?.slice(0, 16) || ''
                : '',
            }))}
          />
        )}
      </div>
    </div>
  );
}
