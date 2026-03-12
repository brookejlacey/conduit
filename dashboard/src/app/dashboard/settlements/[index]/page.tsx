'use client';

import { use } from 'react';
import Link from 'next/link';
import { useSettlements } from '@/hooks/useSettlements';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { NettingFlow } from '@/components/settlement/NettingFlow';
import { formatUsx, formatDate, formatAbsoluteDate, shortenAddress } from '@/lib/format';
import { SettlementStatus } from '@conduit/sdk';

const STATUS_MAP: Record<number, 'success' | 'warning' | 'error' | 'inactive'> = {
  [SettlementStatus.Open]: 'warning',
  [SettlementStatus.Processing]: 'pending' as 'warning',
  [SettlementStatus.Settled]: 'success',
  [SettlementStatus.Failed]: 'error',
};

const STATUS_LABELS: Record<number, string> = {
  [SettlementStatus.Open]: 'Open',
  [SettlementStatus.Processing]: 'Processing',
  [SettlementStatus.Settled]: 'Settled',
  [SettlementStatus.Failed]: 'Failed',
};

export default function SettlementDetailPage({ params }: { params: Promise<{ index: string }> }) {
  const { index } = use(params);
  const batchIndex = parseInt(index, 10);
  const { batches, loading, error } = useSettlements();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
        <span className="ml-3 text-conduit-navy-300">Loading settlement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/settlements" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back to Settlements</Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">Failed to load settlement: {error.message}</p>
        </div>
      </div>
    );
  }

  if (isNaN(batchIndex) || batchIndex < 0 || batchIndex >= batches.length) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/settlements" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back to Settlements</Link>
        <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
          <p className="text-conduit-navy-400">Settlement batch not found.</p>
        </div>
      </div>
    );
  }

  const batch = batches[batchIndex];
  const gross = Number(batch.totalGross.toString());
  const net = Number(batch.totalNet.toString());
  const nettingEfficiency = gross > 0 ? ((1 - net / gross) * 100).toFixed(1) : '0';
  const savings = gross - net;
  const createdAt = batch.createdAt.toNumber() * 1000;
  const settledAt = batch.settledAt.toNumber() * 1000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settlements" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back</Link>
          <h1 className="text-2xl font-bold text-conduit-navy-50">Batch #{batch.id.toString()}</h1>
          <StatusBadge status={STATUS_MAP[batch.status] ?? 'inactive'} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Gross Amount</span>
          <p className="mt-1 text-2xl font-bold text-conduit-navy-50">{formatUsx(gross)}</p>
        </div>
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Net Amount</span>
          <p className="mt-1 text-2xl font-bold text-conduit-blue-400">{formatUsx(net)}</p>
        </div>
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Netting Efficiency</span>
          <p className="mt-1 text-2xl font-bold text-conduit-emerald-400">{nettingEfficiency}%</p>
          <p className="text-xs text-conduit-navy-500">{formatUsx(savings)} saved</p>
        </div>
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Entries</span>
          <p className="mt-1 text-2xl font-bold text-conduit-navy-50">{batch.entryCount}</p>
        </div>
      </div>

      {/* Netting Flow Visualization */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Multilateral Netting</h2>
        <NettingFlow gross={gross} net={net} entryCount={batch.entryCount} />
      </div>

      {/* Batch Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Batch Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Batch ID</span>
              <span className="text-sm font-medium text-conduit-navy-200">#{batch.id.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Status</span>
              <span className="text-sm font-medium text-conduit-navy-200">{STATUS_LABELS[batch.status] ?? 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Entry Count</span>
              <span className="text-sm font-medium text-conduit-navy-200">{batch.entryCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Creator</span>
              <span className="font-mono text-sm text-conduit-navy-200">{shortenAddress(batch.creator.toBase58())}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Timeline</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Created</span>
              <span className="text-sm text-conduit-navy-200">{formatAbsoluteDate(createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Created (relative)</span>
              <span className="text-sm text-conduit-navy-200">{formatDate(createdAt)}</span>
            </div>
            {settledAt > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-conduit-navy-400">Settled</span>
                  <span className="text-sm text-conduit-navy-200">{formatAbsoluteDate(settledAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-conduit-navy-400">Duration</span>
                  <span className="text-sm text-conduit-navy-200">
                    {Math.round((settledAt - createdAt) / 1000)}s
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Creator Address */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Creator</h2>
        <p className="font-mono text-sm text-conduit-navy-200">{batch.creator.toBase58()}</p>
      </div>
    </div>
  );
}
