'use client';

import { usePathname } from 'next/navigation';
import { getNetwork } from '@/lib/solana';

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/vaults': 'Vaults',
  '/dashboard/agents': 'Agents',
  '/dashboard/settlements': 'Settlements',
  '/dashboard/audit': 'Audit Log',
  '/dashboard/risk': 'Risk',
};

export function Header() {
  const pathname = usePathname();
  const breadcrumbs = pathname.split('/').filter(Boolean);
  const network = getNetwork();
  const networkLabel = network.charAt(0).toUpperCase() + network.slice(1);
  const networkColor = network === 'mainnet-beta' ? 'bg-conduit-emerald-400' : 'bg-conduit-amber-400';

  return (
    <header className="flex h-16 items-center justify-between border-b border-conduit-navy-700 bg-conduit-navy-950 px-6 pl-16 md:pl-6">
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((segment, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-conduit-navy-600">/</span>}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? 'text-conduit-navy-100'
                  : 'text-conduit-navy-400'
              }
            >
              {segment.charAt(0).toUpperCase() + segment.slice(1)}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${networkColor}`} />
          <span className="text-xs text-conduit-navy-300">{networkLabel}</span>
        </div>
      </div>
    </header>
  );
}
