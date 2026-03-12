'use client';

import { formatUsx } from '@/lib/format';

interface NettingFlowProps {
  gross: number;
  net: number;
  entryCount: number;
}

export function NettingFlow({ gross, net, entryCount }: NettingFlowProps) {
  const savings = gross - net;
  const efficiency = gross > 0 ? ((1 - net / gross) * 100) : 0;
  const netRatio = gross > 0 ? net / gross : 0;

  // Generate mock flow entries for visualization
  const flows = Array.from({ length: Math.max(entryCount, 3) }, (_, i) => {
    const portion = gross / Math.max(entryCount, 3);
    const variance = 0.6 + Math.random() * 0.8;
    return {
      id: i,
      grossAmount: Math.round(portion * variance),
      direction: i % 2 === 0 ? 'outbound' : 'inbound',
    };
  });

  return (
    <div className="space-y-6">
      {/* Flow Diagram */}
      <div className="flex items-center gap-4">
        {/* Source: Gross Payments */}
        <div className="flex-1">
          <div className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 p-4 text-center">
            <p className="text-xs text-conduit-navy-400">Gross Payments</p>
            <p className="mt-1 text-xl font-bold text-conduit-navy-50">{formatUsx(gross)}</p>
            <p className="text-xs text-conduit-navy-500">{entryCount} entries</p>
          </div>
        </div>

        {/* Arrow with netting */}
        <div className="flex flex-col items-center gap-1">
          <svg className="h-8 w-24" viewBox="0 0 96 32">
            <defs>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path
              d="M0 16 H72 L64 8 M72 16 L64 24"
              fill="none"
              stroke="url(#arrowGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          </svg>
          <span className="rounded-full bg-conduit-emerald-400/20 px-2 py-0.5 text-xs font-medium text-conduit-emerald-400">
            -{efficiency.toFixed(1)}%
          </span>
        </div>

        {/* Destination: Net Settlement */}
        <div className="flex-1">
          <div className="rounded-lg border border-conduit-emerald-400/30 bg-conduit-emerald-400/5 p-4 text-center">
            <p className="text-xs text-conduit-navy-400">Net Settlement</p>
            <p className="mt-1 text-xl font-bold text-conduit-emerald-400">{formatUsx(net)}</p>
            <p className="text-xs text-conduit-emerald-400/60">{formatUsx(savings)} saved</p>
          </div>
        </div>
      </div>

      {/* Waterfall Bars */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-conduit-navy-200">Settlement Waterfall</span>
          <span className="text-xs text-conduit-navy-400">Gross to Net</span>
        </div>
        <div className="space-y-2">
          {/* Gross bar */}
          <div className="flex items-center gap-3">
            <span className="w-20 text-right text-xs text-conduit-navy-400">Gross</span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-conduit-navy-700">
              <div
                className="flex h-full items-center rounded bg-conduit-navy-500 px-2 transition-all duration-1000"
                style={{ width: '100%' }}
              >
                <span className="text-xs font-medium text-conduit-navy-200">{formatUsx(gross)}</span>
              </div>
            </div>
          </div>

          {/* Netting reduction */}
          <div className="flex items-center gap-3">
            <span className="w-20 text-right text-xs text-red-400">Netted</span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-conduit-navy-700">
              <div
                className="flex h-full items-center rounded bg-red-500/30 px-2 transition-all duration-1000"
                style={{ width: gross > 0 ? `${((savings) / gross) * 100}%` : '0%' }}
              >
                <span className="text-xs font-medium text-red-400">-{formatUsx(savings)}</span>
              </div>
            </div>
          </div>

          {/* Net bar */}
          <div className="flex items-center gap-3">
            <span className="w-20 text-right text-xs text-conduit-emerald-400">Net</span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-conduit-navy-700">
              <div
                className="flex h-full items-center rounded bg-conduit-emerald-400/30 px-2 transition-all duration-1000"
                style={{ width: gross > 0 ? `${netRatio * 100}%` : '0%' }}
              >
                <span className="text-xs font-medium text-conduit-emerald-400">{formatUsx(net)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Flows */}
      {flows.length > 0 && (
        <div>
          <span className="mb-3 block text-sm font-medium text-conduit-navy-200">Payment Flows</span>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between rounded-lg bg-conduit-navy-800 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${flow.direction === 'outbound' ? 'bg-conduit-blue-400' : 'bg-conduit-amber-400'}`} />
                  <span className="text-xs text-conduit-navy-300">
                    Entry #{flow.id + 1}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${flow.direction === 'outbound' ? 'bg-conduit-blue-600/20 text-conduit-blue-400' : 'bg-conduit-amber-500/20 text-conduit-amber-400'}`}>
                    {flow.direction}
                  </span>
                </div>
                <span className="text-xs font-medium text-conduit-navy-200">
                  {formatUsx(flow.grossAmount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
