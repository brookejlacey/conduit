'use client';

import type { VaultAccount } from '@conduit/sdk';
import { formatUsx, shortenAddress } from '@/lib/format';

interface VaultCardProps {
  vault: VaultAccount;
  index: number;
}

export function VaultCard({ vault, index }: VaultCardProps) {
  // Use safe string-based conversion to avoid BN.toNumber() overflow for values > 2^53
  const totalDeposits = Number(vault.totalDeposits.toString());
  const yieldAccrued = Number(vault.yieldAccrued.toString());
  const dailySpent = Number(vault.policy.dailySpent.toString());
  const dailyLimit = Number(vault.policy.dailySpendLimit.toString());
  const utilization = dailyLimit > 0 ? (dailySpent / dailyLimit) * 100 : 0;

  const utilizationColor =
    utilization < 50
      ? 'bg-conduit-emerald-400'
      : utilization < 80
        ? 'bg-conduit-amber-400'
        : 'bg-red-400';

  const txTypes = [];
  if (vault.policy.allowedTxTypes & 0b0001) txTypes.push('Transfer');
  if (vault.policy.allowedTxTypes & 0b0010) txTypes.push('Settlement');
  if (vault.policy.allowedTxTypes & 0b0100) txTypes.push('Yield');
  if (vault.policy.allowedTxTypes & 0b1000) txTypes.push('Rebalance');

  return (
    <div className="card-hover">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-conduit-navy-100">Vault #{index + 1}</h3>
        <span className="rounded-full bg-conduit-blue-600/20 px-3 py-1 text-xs font-medium text-conduit-blue-400">
          {vault.multisigThreshold}/{vault.multisigSigners.length} Multisig
        </span>
      </div>

      <div className="space-y-4">
        {/* Balances */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-conduit-navy-400">Total Deposits</span>
            <p className="text-lg font-bold text-conduit-navy-50">{formatUsx(totalDeposits)}</p>
          </div>
          <div>
            <span className="text-xs text-conduit-navy-400">Yield Accrued</span>
            <p className="text-lg font-bold text-conduit-emerald-400">{formatUsx(yieldAccrued)}</p>
          </div>
        </div>

        {/* Daily Utilization */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-conduit-navy-400">Daily Utilization</span>
            <span className="text-xs text-conduit-navy-300">{utilization.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-conduit-navy-700">
            <div
              className={`h-full rounded-full ${utilizationColor} transition-all`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-conduit-navy-500">
            <span>{formatUsx(dailySpent)} spent</span>
            <span>{formatUsx(dailyLimit)} limit</span>
          </div>
        </div>

        {/* Policy */}
        <div>
          <span className="text-xs text-conduit-navy-400">Policy</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {txTypes.map((t) => (
              <span
                key={t}
                className="rounded bg-conduit-navy-700 px-2 py-0.5 text-xs text-conduit-navy-300"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-conduit-navy-500">
            Max tx: {formatUsx(Number(vault.policy.maxSingleTxSize.toString()))} |{' '}
            {vault.policy.approvedCounterparties.length} counterparties
          </p>
        </div>
      </div>
    </div>
  );
}
