'use client';

import { DecisionTimeline } from '@/components/agent/DecisionTimeline';
import { formatDate, shortenAddress } from '@/lib/format';

const mockAuditEntries = [
  {
    id: '1',
    agent: '7xKnR4pQ9...3fPq',
    actionType: 'Settlement',
    targetVault: '4vMk...8nWp',
    amount: 780_000_000_000,
    reasoning:
      'Analyzed 8 pending cross-border payments. Identified 37.6% netting opportunity between EUR and GBP corridors. FX volatility is low (0.06 for USD/EUR), making this an optimal settlement window. Executed net settlement of 780K USX.',
    timestamp: Date.now() - 300_000,
    slot: 285_432_100,
  },
  {
    id: '2',
    agent: '7xKnR4pQ9...3fPq',
    actionType: 'Rebalance',
    targetVault: '9qLm...2dRt',
    amount: 250_000_000_000,
    reasoning:
      'Vault #2 daily utilization at 81.7%, approaching the 80% warning threshold. Vault #1 has 30% utilization with sufficient reserves. Recommending 250K USX transfer from Vault #1 to Vault #2 to normalize utilization across the portfolio.',
    timestamp: Date.now() - 900_000,
    slot: 285_431_800,
  },
  {
    id: '3',
    agent: 'System',
    actionType: 'Compliance',
    targetVault: '9qLm...2dRt',
    amount: null,
    reasoning:
      'Automated compliance scan detected daily spend utilization at 85% for Vault #3. No policy violations found. Recommend monitoring and potential limit increase review.',
    timestamp: Date.now() - 1_800_000,
    slot: 285_431_500,
  },
  {
    id: '4',
    agent: '7xKnR4pQ9...3fPq',
    actionType: 'Yield Accrual',
    targetVault: '4vMk...8nWp',
    amount: 12_500_000_000,
    reasoning:
      'Periodic yield accrual for lending position. Current APY: 4.5%. Accrued 12.5K USX yield from USX lending pool over the past 24 hours. Total yield to date: 125K USX.',
    timestamp: Date.now() - 3_600_000,
    slot: 285_430_900,
  },
];

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Audit Log</h1>
        <div className="flex gap-2">
          <select className="btn-secondary">
            <option>All Actions</option>
            <option>Settlements</option>
            <option>Rebalances</option>
            <option>Compliance</option>
            <option>Deposits</option>
            <option>Withdrawals</option>
          </select>
        </div>
      </div>
      <DecisionTimeline entries={mockAuditEntries} />
    </div>
  );
}
