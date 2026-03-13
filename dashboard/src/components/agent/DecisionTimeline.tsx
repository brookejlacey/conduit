'use client';

import { useState } from 'react';
import { formatDate, formatUsx } from '@/lib/format';

interface TimelineEntry {
  id: string;
  agent: string;
  actionType: string;
  targetVault: string | null;
  amount: number | null;
  reasoning: string;
  reasoningUri?: string;
  ipfsLink?: string | null;
  timestamp: number;
  slot: number;
}

interface DecisionTimelineProps {
  entries: TimelineEntry[];
}

const actionColors: Record<string, string> = {
  Settlement: 'border-conduit-blue-500 bg-conduit-blue-500',
  Rebalance: 'border-conduit-amber-400 bg-conduit-amber-400',
  Compliance: 'border-conduit-emerald-400 bg-conduit-emerald-400',
  Deposit: 'border-green-400 bg-green-400',
  Withdraw: 'border-red-400 bg-red-400',
  'Yield Accrual': 'border-purple-400 bg-purple-400',
  'Policy Update': 'border-indigo-400 bg-indigo-400',
};

export function DecisionTimeline({ entries }: DecisionTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 h-full w-0.5 bg-conduit-navy-700" />

      <div className="space-y-4">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const dotColor = actionColors[entry.actionType] || 'border-conduit-navy-400 bg-conduit-navy-400';
          const [borderColor, bgColor] = dotColor.split(' ');

          return (
            <div key={entry.id} className="relative pl-10">
              {/* Timeline dot */}
              <div
                className={`absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 ${borderColor} ${bgColor}`}
              />

              <div
                className="card cursor-pointer transition-colors hover:border-conduit-navy-600"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-conduit-navy-100">
                        {entry.actionType}
                      </span>
                      {entry.amount && (
                        <span className="text-sm text-conduit-navy-300">
                          {formatUsx(entry.amount)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-conduit-navy-400">
                      <span>Agent: {entry.agent}</span>
                      {entry.targetVault && <span>Vault: {entry.targetVault}</span>}
                      <span>Slot: {entry.slot.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-conduit-navy-400">
                      {formatDate(entry.timestamp)}
                    </span>
                    <svg
                      className={`h-4 w-4 text-conduit-navy-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-conduit-navy-700 pt-4">
                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-conduit-navy-400">
                      AI Reasoning
                    </h4>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-conduit-navy-200">
                      {entry.reasoning}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded bg-conduit-navy-700 px-2 py-0.5 text-xs font-mono text-conduit-navy-400">
                        SHA-256 verified on-chain
                      </span>
                      {entry.ipfsLink && (
                        <a
                          href={entry.ipfsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-conduit-blue-500/20 px-2 py-0.5 text-xs font-mono text-conduit-blue-400 hover:bg-conduit-blue-500/30 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on IPFS
                        </a>
                      )}
                      {entry.reasoningUri && !entry.ipfsLink && (
                        <span className="rounded bg-conduit-navy-700 px-2 py-0.5 text-xs font-mono text-conduit-navy-500">
                          {entry.reasoningUri.slice(0, 40)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
