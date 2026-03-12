'use client';

import { useState, useCallback } from 'react';
import { formatDate, formatUsx } from '@/lib/format';

interface ReplayEntry {
  id: string;
  actionType: string;
  targetVault: string | null;
  amount: number | null;
  reasoning: string;
  timestamp: number;
  slot: number;
  reasoningHash: string;
}

interface ReasoningReplayProps {
  entries: ReplayEntry[];
}

const actionIcons: Record<string, string> = {
  Deposit: 'D',
  Withdraw: 'W',
  Rebalance: 'R',
  Settlement: 'S',
  'Policy Update': 'P',
  'Yield Accrual': 'Y',
};

const actionColors: Record<string, string> = {
  Deposit: 'text-green-400 bg-green-400/10 border-green-400/30',
  Withdraw: 'text-red-400 bg-red-400/10 border-red-400/30',
  Rebalance: 'text-conduit-amber-400 bg-conduit-amber-400/10 border-conduit-amber-400/30',
  Settlement: 'text-conduit-blue-400 bg-conduit-blue-400/10 border-conduit-blue-400/30',
  'Policy Update': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  'Yield Accrual': 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

export function ReasoningReplay({ entries }: ReasoningReplayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const current = sorted[currentStep];
  const total = sorted.length;

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goFirst = useCallback(() => setCurrentStep(0), []);
  const goLast = useCallback(() => setCurrentStep(total - 1), [total]);

  // Auto-play
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    let step = currentStep;
    const interval = setInterval(() => {
      step += 1;
      if (step >= total) {
        clearInterval(interval);
        setIsPlaying(false);
        return;
      }
      setCurrentStep(step);
    }, 2000);
    // Store interval ID for cleanup
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, total]);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
        <p className="text-conduit-navy-400">No decisions to replay.</p>
      </div>
    );
  }

  const color = actionColors[current.actionType] || 'text-conduit-navy-300 bg-conduit-navy-800 border-conduit-navy-700';
  const icon = actionIcons[current.actionType] || '?';
  const progress = ((currentStep + 1) / total) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-conduit-navy-400">Step {currentStep + 1} / {total}</span>
        <div className="flex-1 overflow-hidden rounded-full bg-conduit-navy-800 h-1.5">
          <div
            className="h-full rounded-full bg-conduit-blue-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-conduit-navy-400">{formatDate(current.timestamp)}</span>
      </div>

      {/* Step indicator dots */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {sorted.map((entry, i) => {
          const dotColor = i === currentStep
            ? 'bg-conduit-blue-400 scale-125'
            : i < currentStep
              ? 'bg-conduit-navy-500'
              : 'bg-conduit-navy-700';
          return (
            <button
              key={entry.id}
              onClick={() => setCurrentStep(i)}
              className={`h-2 w-2 rounded-full transition-all ${dotColor} hover:bg-conduit-blue-300 flex-shrink-0`}
              title={`Step ${i + 1}: ${entry.actionType}`}
            />
          );
        })}
      </div>

      {/* Current decision card */}
      <div className={`rounded-lg border p-6 ${color}`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg border text-lg font-bold ${color}`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-conduit-navy-50">
                {current.actionType}
              </h3>
              <span className="text-xs text-conduit-navy-400">
                Slot {current.slot.toLocaleString()}
              </span>
            </div>

            {current.amount && (
              <p className="mt-1 text-2xl font-bold text-conduit-navy-100">
                {formatUsx(current.amount)}
              </p>
            )}

            {current.targetVault && (
              <p className="mt-1 text-xs text-conduit-navy-400">
                Target vault: <span className="font-mono">{current.targetVault}</span>
              </p>
            )}

            {/* Reasoning section */}
            <div className="mt-4 rounded-lg bg-conduit-navy-900/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-conduit-navy-400">
                  AI Reasoning
                </span>
                <span className="rounded bg-conduit-navy-700 px-1.5 py-0.5 text-[10px] font-mono text-conduit-navy-500">
                  SHA-256
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-conduit-navy-200">
                {current.reasoning}
              </p>
              {current.reasoningHash && (
                <p className="mt-2 truncate font-mono text-[10px] text-conduit-navy-600">
                  Hash: {current.reasoningHash}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={goFirst}
          disabled={currentStep === 0}
          className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700 disabled:opacity-30"
          title="First"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700 disabled:opacity-30"
          title="Previous"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={togglePlay}
          className="rounded-lg border border-conduit-blue-500/30 bg-conduit-blue-500/10 px-6 py-2 text-sm font-medium text-conduit-blue-400 transition hover:bg-conduit-blue-500/20"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={goNext}
          disabled={currentStep === total - 1}
          className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700 disabled:opacity-30"
          title="Next"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={goLast}
          disabled={currentStep === total - 1}
          className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700 disabled:opacity-30"
          title="Last"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
