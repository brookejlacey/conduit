'use client';

import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-conduit-navy-700 bg-conduit-navy-900">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-conduit-navy-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-conduit-navy-700">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id ?? rowIndex}
              className="transition-colors hover:bg-conduit-navy-800/50"
            >
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className="whitespace-nowrap px-6 py-4 text-sm text-conduit-navy-200"
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-12 text-center text-sm text-conduit-navy-400">No data available</div>
      )}
    </div>
  );
}
