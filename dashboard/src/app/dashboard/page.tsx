'use client';

import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatUsx, formatDate, shortenAddress } from '@/lib/format';
import { useVaults } from '@/hooks/useVaults';
import { useAgents } from '@/hooks/useAgents';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ActionType } from '@conduit/sdk';

const ACTION_LABELS: Record<number, string> = {
  [ActionType.Deposit]: 'Deposit',
  [ActionType.Withdraw]: 'Withdraw',
  [ActionType.Rebalance]: 'Rebalance',
  [ActionType.Settlement]: 'Settlement',
  [ActionType.PolicyUpdate]: 'Policy Update',
  [ActionType.YieldAccrual]: 'Yield Accrual',
};

export default function DashboardOverview() {
  const { vaults, loading: vaultsLoading } = useVaults();
  const { agents, loading: agentsLoading } = useAgents();
  const { entries: auditEntries, loading: auditLoading } = useAuditLog();

  const loading = vaultsLoading || agentsLoading || auditLoading;

  // Compute real metrics from on-chain data
  const totalAum = vaults.reduce(
    (sum, v) => sum + Number(v.totalDeposits.toString()) + Number(v.yieldAccrued.toString()),
    0,
  );
  const activeAgents = agents.filter((a) => a.active).length;
  const recentActivity = auditEntries.slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-conduit-navy-50">Overview</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total AUM"
          value={loading ? '...' : formatUsx(totalAum)}
          change=""
          changeType="neutral"
          icon="vault"
        />
        <MetricCard
          title="Active Agents"
          value={loading ? '...' : String(activeAgents)}
          change={loading ? '' : `${agents.length} total`}
          changeType="neutral"
          icon="agent"
        />
        <MetricCard
          title="Vaults"
          value={loading ? '...' : String(vaults.length)}
          change=""
          changeType="neutral"
          icon="settlement"
        />
        <MetricCard
          title="Audit Entries"
          value={loading ? '...' : String(auditEntries.length)}
          change=""
          changeType="neutral"
          icon="compliance"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Recent Activity</h2>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
            <span className="ml-3 text-sm text-conduit-navy-400">Loading on-chain data...</span>
          </div>
        )}

        {!loading && recentActivity.length === 0 && (
          <p className="py-4 text-center text-sm text-conduit-navy-400">
            No on-chain activity found. Deploy programs and start the agent to see data here.
          </p>
        )}

        {!loading && recentActivity.length > 0 && (
          <div className="space-y-3">
            {recentActivity.map((entry, i) => {
              const actionLabel = ACTION_LABELS[entry.actionType] ?? `Action ${entry.actionType}`;
              const amount = entry.amount ? Number(entry.amount.toString()) : null;
              const description = amount
                ? `${actionLabel}: ${formatUsx(amount)}`
                : actionLabel;

              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-conduit-navy-700 bg-conduit-navy-900 p-4"
                >
                  <div className="flex items-center gap-4">
                    <StatusBadge status="success" />
                    <div>
                      <p className="text-sm font-medium text-conduit-navy-100">
                        {description}
                      </p>
                      <p className="text-xs text-conduit-navy-400">
                        Agent: {shortenAddress(entry.agent.toBase58())}
                        {entry.targetVault && (
                          <> | Vault: {shortenAddress(entry.targetVault.toBase58())}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-conduit-navy-400">
                    {formatDate(entry.timestamp.toNumber() * 1000)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
