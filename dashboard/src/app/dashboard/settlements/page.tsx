'use client';

import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatUsx, formatDate } from '@/lib/format';

const mockBatches = [
  {
    id: 142,
    status: 'success' as const,
    entryCount: 8,
    totalGross: 1_250_000_000_000,
    totalNet: 780_000_000_000,
    createdAt: Date.now() - 300_000,
    settledAt: Date.now() - 120_000,
  },
  {
    id: 141,
    status: 'success' as const,
    entryCount: 12,
    totalGross: 2_100_000_000_000,
    totalNet: 950_000_000_000,
    createdAt: Date.now() - 14_400_000,
    settledAt: Date.now() - 14_100_000,
  },
  {
    id: 140,
    status: 'warning' as const,
    entryCount: 3,
    totalGross: 450_000_000_000,
    totalNet: 450_000_000_000,
    createdAt: Date.now() - 28_800_000,
    settledAt: 0,
  },
  {
    id: 139,
    status: 'success' as const,
    entryCount: 15,
    totalGross: 3_800_000_000_000,
    totalNet: 1_200_000_000_000,
    createdAt: Date.now() - 43_200_000,
    settledAt: Date.now() - 42_900_000,
  },
];

const columns = [
  { header: 'Batch ID', accessor: (row: (typeof mockBatches)[0]) => `#${row.id}` },
  {
    header: 'Status',
    accessor: (row: (typeof mockBatches)[0]) => <StatusBadge status={row.status} />,
  },
  { header: 'Entries', accessor: (row: (typeof mockBatches)[0]) => row.entryCount },
  {
    header: 'Gross Amount',
    accessor: (row: (typeof mockBatches)[0]) => formatUsx(row.totalGross),
  },
  { header: 'Net Amount', accessor: (row: (typeof mockBatches)[0]) => formatUsx(row.totalNet) },
  {
    header: 'Netting Efficiency',
    accessor: (row: (typeof mockBatches)[0]) => {
      const efficiency = ((1 - row.totalNet / row.totalGross) * 100).toFixed(1);
      return `${efficiency}%`;
    },
  },
  {
    header: 'Created',
    accessor: (row: (typeof mockBatches)[0]) => formatDate(row.createdAt),
  },
];

export default function SettlementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Settlements</h1>
        <button className="btn-primary">New Batch</button>
      </div>
      <div className="card overflow-hidden p-0">
        <DataTable columns={columns} data={mockBatches} />
      </div>
    </div>
  );
}
