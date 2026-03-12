'use client';

import { useState } from 'react';
import type { AuditEntry } from '@conduit/sdk';
import { ActionType } from '@conduit/sdk';

const ACTION_LABELS: Record<number, string> = {
  [ActionType.Deposit]: 'Deposit',
  [ActionType.Withdraw]: 'Withdraw',
  [ActionType.Rebalance]: 'Rebalance',
  [ActionType.Settlement]: 'Settlement',
  [ActionType.PolicyUpdate]: 'Policy Update',
  [ActionType.YieldAccrual]: 'Yield Accrual',
};

interface ComplianceExportProps {
  entries: AuditEntry[];
}

export function ComplianceExport({ entries }: ComplianceExportProps) {
  const [exporting, setExporting] = useState(false);

  const exportCSV = () => {
    setExporting(true);
    try {
      const headers = ['Timestamp', 'Action Type', 'Agent', 'Institution', 'Target Vault', 'Amount (USX)', 'Reasoning Hash', 'Slot'];
      const rows = entries.map((e) => [
        new Date(e.timestamp.toNumber() * 1000).toISOString(),
        ACTION_LABELS[e.actionType] ?? `Action ${e.actionType}`,
        e.agent.toBase58(),
        e.institution.toBase58(),
        e.targetVault ? e.targetVault.toBase58() : 'N/A',
        e.amount ? (Number(e.amount.toString()) / 1e6).toFixed(2) : 'N/A',
        Buffer.from(e.reasoningHash).toString('hex'),
        e.slot.toString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conduit-audit-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportJSON = () => {
    setExporting(true);
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        protocol: 'Conduit Protocol',
        network: typeof window !== 'undefined' ? 'devnet' : 'unknown',
        totalEntries: entries.length,
        summary: {
          deposits: entries.filter((e) => e.actionType === ActionType.Deposit).length,
          withdrawals: entries.filter((e) => e.actionType === ActionType.Withdraw).length,
          rebalances: entries.filter((e) => e.actionType === ActionType.Rebalance).length,
          settlements: entries.filter((e) => e.actionType === ActionType.Settlement).length,
          policyUpdates: entries.filter((e) => e.actionType === ActionType.PolicyUpdate).length,
          yieldAccruals: entries.filter((e) => e.actionType === ActionType.YieldAccrual).length,
        },
        entries: entries.map((e) => ({
          timestamp: new Date(e.timestamp.toNumber() * 1000).toISOString(),
          actionType: ACTION_LABELS[e.actionType] ?? `Action ${e.actionType}`,
          agent: e.agent.toBase58(),
          institution: e.institution.toBase58(),
          targetVault: e.targetVault?.toBase58() ?? null,
          amountUsx: e.amount ? Number(e.amount.toString()) / 1e6 : null,
          reasoningHash: Buffer.from(e.reasoningHash).toString('hex'),
          reasoningUri: String.fromCharCode(...e.reasoningUri.filter((b) => b !== 0)) || null,
          slot: e.slot.toString(),
        })),
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conduit-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportCSV}
        disabled={exporting || entries.length === 0}
        className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700 disabled:opacity-50"
      >
        Export CSV
      </button>
      <button
        onClick={exportJSON}
        disabled={exporting || entries.length === 0}
        className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700 disabled:opacity-50"
      >
        Export Report
      </button>
    </div>
  );
}
