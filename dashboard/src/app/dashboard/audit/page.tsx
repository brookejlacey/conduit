'use client';

import { useState } from 'react';
import { DecisionTimeline } from '@/components/agent/DecisionTimeline';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuditLog } from '@/hooks/useAuditLog';
import { shortenAddress, formatUsx } from '@/lib/format';
import { ActionType } from '@conduit/sdk';

const ACTION_LABELS: Record<number, string> = {
  [ActionType.Deposit]: 'Deposit',
  [ActionType.Withdraw]: 'Withdraw',
  [ActionType.Rebalance]: 'Rebalance',
  [ActionType.Settlement]: 'Settlement',
  [ActionType.PolicyUpdate]: 'Policy Update',
  [ActionType.YieldAccrual]: 'Yield Accrual',
};

export default function AuditPage() {
  const { entries, loading, error, refresh } = useAuditLog();
  const [filter, setFilter] = useState<string>('all');

  const filteredEntries = entries.filter((e) => {
    if (filter === 'all') return true;
    return ACTION_LABELS[e.actionType] === filter;
  });

  // Map on-chain AuditEntry to the DecisionTimeline format
  const timelineEntries = filteredEntries.map((entry, i) => ({
    id: String(i),
    agent: shortenAddress(entry.agent.toBase58()),
    actionType: ACTION_LABELS[entry.actionType] ?? `Action ${entry.actionType}`,
    targetVault: entry.targetVault ? shortenAddress(entry.targetVault.toBase58()) : null,
    amount: entry.amount ? Number(entry.amount.toString()) : null,
    reasoning: `Reasoning hash: ${Buffer.from(entry.reasoningHash).toString('hex').slice(0, 16)}...`,
    timestamp: entry.timestamp.toNumber() * 1000,
    slot: entry.slot.toNumber(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Audit Log</h1>
        <div className="flex gap-2">
          <select
            className="btn-secondary"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="Settlement">Settlements</option>
            <option value="Rebalance">Rebalances</option>
            <option value="Deposit">Deposits</option>
            <option value="Withdraw">Withdrawals</option>
            <option value="Yield Accrual">Yield Accrual</option>
            <option value="Policy Update">Policy Updates</option>
          </select>
          <button
            onClick={refresh}
            className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-4 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">Failed to load audit log: {error.message}</p>
          <button onClick={refresh} className="mt-2 text-xs text-red-300 underline hover:text-red-200">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && timelineEntries.length === 0 && (
        <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
          <p className="text-conduit-navy-400">No audit entries found.</p>
          <p className="mt-1 text-xs text-conduit-navy-500">
            Audit entries are created when agents perform on-chain actions.
          </p>
        </div>
      )}

      {!loading && timelineEntries.length > 0 && (
        <DecisionTimeline entries={timelineEntries} />
      )}
    </div>
  );
}
