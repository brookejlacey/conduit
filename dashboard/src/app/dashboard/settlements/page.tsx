'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableRowSkeleton } from '@/components/shared/Skeleton';
import { formatUsx, formatDate, shortenAddress } from '@/lib/format';
import { useSettlements } from '@/hooks/useSettlements';
import { SettlementStatus } from '@conduit/sdk';
import type { SettlementBatch } from '@conduit/sdk';

const STATUS_MAP: Record<number, 'success' | 'warning' | 'error' | 'inactive'> = {
  [SettlementStatus.Open]: 'warning',
  [SettlementStatus.Processing]: 'warning',
  [SettlementStatus.Settled]: 'success',
  [SettlementStatus.Failed]: 'error',
};

const STATUS_LABELS: Record<number, string> = {
  [SettlementStatus.Open]: 'Open',
  [SettlementStatus.Processing]: 'Processing',
  [SettlementStatus.Settled]: 'Settled',
  [SettlementStatus.Failed]: 'Failed',
};

const columns = [
  {
    header: 'Batch ID',
    accessor: (row: SettlementBatch) => `#${row.id.toString()}`,
  },
  {
    header: 'Status',
    accessor: (row: SettlementBatch) => (
      <StatusBadge status={STATUS_MAP[row.status] ?? 'inactive'} />
    ),
  },
  {
    header: 'Entries',
    accessor: (row: SettlementBatch) => row.entryCount,
  },
  {
    header: 'Gross Amount',
    accessor: (row: SettlementBatch) => formatUsx(Number(row.totalGross.toString())),
  },
  {
    header: 'Net Amount',
    accessor: (row: SettlementBatch) => formatUsx(Number(row.totalNet.toString())),
  },
  {
    header: 'Netting',
    accessor: (row: SettlementBatch) => {
      const gross = Number(row.totalGross.toString());
      const net = Number(row.totalNet.toString());
      if (gross === 0) return '0%';
      return `${((1 - net / gross) * 100).toFixed(1)}%`;
    },
  },
  {
    header: 'Creator',
    accessor: (row: SettlementBatch) => shortenAddress(row.creator.toBase58()),
  },
  {
    header: 'Created',
    accessor: (row: SettlementBatch) => formatDate(row.createdAt.toNumber() * 1000),
  },
];

export default function SettlementsPage() {
  const { batches, loading, error, refresh } = useSettlements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Settlements</h1>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-4 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700"
          >
            Refresh
          </button>
          <button className="btn-primary">New Batch</button>
        </div>
      </div>

      {loading && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-conduit-navy-700 bg-conduit-navy-900">
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-conduit-navy-400">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableRowSkeleton cols={columns.length} />
              <TableRowSkeleton cols={columns.length} />
              <TableRowSkeleton cols={columns.length} />
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">Failed to load settlements: {error.message}</p>
          <button onClick={refresh} className="mt-2 text-xs text-red-300 underline hover:text-red-200">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
          <p className="text-conduit-navy-400">No settlement batches found.</p>
          <p className="mt-1 text-xs text-conduit-navy-500">
            Settlement batches are created when the agent processes cross-border payments.
          </p>
        </div>
      )}

      {!loading && batches.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-conduit-navy-700 bg-conduit-navy-900">
                  {columns.map((col, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-conduit-navy-400">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-conduit-navy-700">
                {batches.map((row, rowIndex) => (
                  <tr key={rowIndex} className="cursor-pointer transition-colors hover:bg-conduit-navy-800/50">
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="whitespace-nowrap px-6 py-4 text-sm text-conduit-navy-200">
                        {colIndex === 0 ? (
                          <Link href={`/dashboard/settlements/${rowIndex}`} className="text-conduit-blue-400 hover:underline">
                            {col.accessor(row)}
                          </Link>
                        ) : (
                          col.accessor(row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
