'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/vaults', label: 'Vaults', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { href: '/dashboard/agents', label: 'Agents', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { href: '/dashboard/settlements', label: 'Settlements', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { href: '/dashboard/audit', label: 'Audit Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/dashboard/risk', label: 'Risk', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-conduit-navy-700 bg-conduit-navy-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-conduit-navy-700 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-conduit-blue-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" strokeLinecap="round" />
            <path d="M12 2c3.04 0 5.5 4.48 5.5 10" strokeLinecap="round" />
            <path d="M2 12h10" strokeLinecap="round" />
            <path d="M17 17l4 4M17 21l4-4" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-lg font-bold text-conduit-navy-50">Conduit</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="border-t border-conduit-navy-700 p-4">
        <WalletButton />
      </div>
    </aside>
  );
}
