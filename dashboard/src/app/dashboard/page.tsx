'use client';

import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatUsx, formatDate, shortenAddress } from '@/lib/format';

const mockMetrics = {
  totalAum: 12_500_000_000_000, // 12.5M USX in lamports
  activeAgents: 3,
  pendingSettlements: 7,
  complianceRate: 99.2,
};

const mockActivity = [
  {
    id: '1',
    type: 'settlement',
    description: 'Settlement batch #142 executed',
    agent: '7xKn...3fPq',
    timestamp: Date.now() - 300_000,
    status: 'success' as const,
  },
  {
    id: '2',
    type: 'rebalance',
    description: 'Vault rebalance: 250K USX moved',
    agent: '7xKn...3fPq',
    timestamp: Date.now() - 900_000,
    status: 'success' as const,
  },
  {
    id: '3',
    type: 'compliance',
    description: 'Daily limit warning on Vault #3',
    agent: 'System',
    timestamp: Date.now() - 1_800_000,
    status: 'warning' as const,
  },
  {
    id: '4',
    type: 'deposit',
    description: 'New deposit: 1.2M USX',
    agent: 'External',
    timestamp: Date.now() - 3_600_000,
    status: 'success' as const,
  },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-conduit-navy-50">Overview</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total AUM"
          value={formatUsx(mockMetrics.totalAum)}
          change="+2.4%"
          changeType="positive"
          icon="vault"
        />
        <MetricCard
          title="Active Agents"
          value={String(mockMetrics.activeAgents)}
          change="0"
          changeType="neutral"
          icon="agent"
        />
        <MetricCard
          title="Pending Settlements"
          value={String(mockMetrics.pendingSettlements)}
          change="-3"
          changeType="positive"
          icon="settlement"
        />
        <MetricCard
          title="Compliance Rate"
          value={`${mockMetrics.complianceRate}%`}
          change="+0.1%"
          changeType="positive"
          icon="compliance"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Recent Activity</h2>
        <div className="space-y-3">
          {mockActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border border-conduit-navy-700 bg-conduit-navy-900 p-4"
            >
              <div className="flex items-center gap-4">
                <StatusBadge status={activity.status} />
                <div>
                  <p className="text-sm font-medium text-conduit-navy-100">
                    {activity.description}
                  </p>
                  <p className="text-xs text-conduit-navy-400">
                    Agent: {activity.agent}
                  </p>
                </div>
              </div>
              <span className="text-xs text-conduit-navy-400">
                {formatDate(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
