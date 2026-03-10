'use client';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: 'vault' | 'agent' | 'settlement' | 'compliance';
}

const iconPaths: Record<string, string> = {
  vault: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  agent: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  settlement: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  compliance: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

export function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'text-conduit-emerald-400'
      : changeType === 'negative'
        ? 'text-red-400'
        : 'text-conduit-navy-400';

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-conduit-navy-300">{title}</span>
        <svg
          className="h-5 w-5 text-conduit-navy-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[icon]} />
        </svg>
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-conduit-navy-50">{value}</span>
      </div>
      <div className="mt-1">
        <span className={`text-xs font-medium ${changeColor}`}>{change}</span>
      </div>
    </div>
  );
}
