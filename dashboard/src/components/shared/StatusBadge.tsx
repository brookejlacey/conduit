'use client';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'inactive';
}

const statusConfig = {
  success: {
    label: 'Success',
    dotColor: 'bg-conduit-emerald-400',
    bgColor: 'bg-conduit-emerald-400/10',
    textColor: 'text-conduit-emerald-400',
    borderColor: 'border-conduit-emerald-400/30',
  },
  warning: {
    label: 'Warning',
    dotColor: 'bg-conduit-amber-400',
    bgColor: 'bg-conduit-amber-400/10',
    textColor: 'text-conduit-amber-400',
    borderColor: 'border-conduit-amber-400/30',
  },
  error: {
    label: 'Error',
    dotColor: 'bg-red-400',
    bgColor: 'bg-red-400/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-400/30',
  },
  pending: {
    label: 'Pending',
    dotColor: 'bg-conduit-blue-400',
    bgColor: 'bg-conduit-blue-400/10',
    textColor: 'text-conduit-blue-400',
    borderColor: 'border-conduit-blue-400/30',
  },
  inactive: {
    label: 'Inactive',
    dotColor: 'bg-conduit-navy-400',
    bgColor: 'bg-conduit-navy-400/10',
    textColor: 'text-conduit-navy-400',
    borderColor: 'border-conduit-navy-400/30',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
