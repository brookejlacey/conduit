'use client';

interface TierBadgeProps {
  tier: number;
}

const tierConfig: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Observer', color: 'text-conduit-navy-300', bg: 'bg-conduit-navy-700' },
  1: { label: 'Executor', color: 'text-conduit-blue-400', bg: 'bg-conduit-blue-600/20' },
  2: { label: 'Manager', color: 'text-conduit-amber-400', bg: 'bg-conduit-amber-500/20' },
  3: { label: 'Admin', color: 'text-conduit-emerald-400', bg: 'bg-conduit-emerald-400/20' },
};

export function TierBadge({ tier }: TierBadgeProps) {
  const config = tierConfig[tier] || tierConfig[0];

  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${config.color} ${config.bg}`}>
      Tier {tier}: {config.label}
    </span>
  );
}
