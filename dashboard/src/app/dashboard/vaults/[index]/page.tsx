'use client';

import { use } from 'react';
import Link from 'next/link';
import { useVaults } from '@/hooks/useVaults';
import { useAuditLog } from '@/hooks/useAuditLog';
import { formatUsx, formatDate, formatAbsoluteDate, shortenAddress } from '@/lib/format';
import { ActionType } from '@conduit/sdk';
import YieldChart from '@/components/vault/YieldChart';

const ACTION_LABELS: Record<number, string> = {
  [ActionType.Deposit]: 'Deposit',
  [ActionType.Withdraw]: 'Withdraw',
  [ActionType.Rebalance]: 'Rebalance',
  [ActionType.Settlement]: 'Settlement',
  [ActionType.PolicyUpdate]: 'Policy Update',
  [ActionType.YieldAccrual]: 'Yield Accrual',
};

export default function VaultDetailPage({ params }: { params: Promise<{ index: string }> }) {
  const { index } = use(params);
  const vaultIndex = parseInt(index, 10);
  const { vaults, loading, error } = useVaults();
  const { entries: auditEntries, loading: auditLoading } = useAuditLog();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
        <span className="ml-3 text-conduit-navy-300">Loading vault...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/vaults" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back to Vaults</Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">Failed to load vault: {error.message}</p>
        </div>
      </div>
    );
  }

  if (isNaN(vaultIndex) || vaultIndex < 0 || vaultIndex >= vaults.length) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/vaults" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back to Vaults</Link>
        <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
          <p className="text-conduit-navy-400">Vault not found.</p>
        </div>
      </div>
    );
  }

  const vault = vaults[vaultIndex];
  const totalDeposits = Number(vault.totalDeposits.toString());
  const yieldAccrued = Number(vault.yieldAccrued.toString());
  const dailySpent = Number(vault.policy.dailySpent.toString());
  const dailyLimit = Number(vault.policy.dailySpendLimit.toString());
  const maxTx = Number(vault.policy.maxSingleTxSize.toString());
  const utilization = dailyLimit > 0 ? (dailySpent / dailyLimit) * 100 : 0;
  const lastReset = Number(vault.policy.lastResetTs.toString()) * 1000;

  const utilizationColor =
    utilization < 50 ? 'bg-conduit-emerald-400' : utilization < 80 ? 'bg-conduit-amber-400' : 'bg-red-400';

  const txTypes = [];
  if (vault.policy.allowedTxTypes & 0b0001) txTypes.push('Transfer');
  if (vault.policy.allowedTxTypes & 0b0010) txTypes.push('Settlement');
  if (vault.policy.allowedTxTypes & 0b0100) txTypes.push('Yield');
  if (vault.policy.allowedTxTypes & 0b1000) txTypes.push('Rebalance');

  // Filter audit entries for this vault (by institution match)
  const vaultAuditEntries = auditEntries.filter(
    (e) => e.targetVault && e.targetVault.toBase58() === vault.usxTokenAccount.toBase58()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vaults" className="text-sm text-conduit-blue-400 hover:underline">&larr; Back</Link>
          <h1 className="text-2xl font-bold text-conduit-navy-50">Vault #{vaultIndex + 1}</h1>
          <span className="rounded-full bg-conduit-blue-600/20 px-3 py-1 text-xs font-medium text-conduit-blue-400">
            {vault.multisigThreshold}/{vault.multisigSigners.length} Multisig
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Total Deposits</span>
          <p className="mt-1 text-2xl font-bold text-conduit-navy-50">{formatUsx(totalDeposits)}</p>
        </div>
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Yield Accrued</span>
          <p className="mt-1 text-2xl font-bold text-conduit-emerald-400">{formatUsx(yieldAccrued)}</p>
        </div>
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Daily Spent</span>
          <p className="mt-1 text-2xl font-bold text-conduit-navy-50">{formatUsx(dailySpent)}</p>
          <p className="text-xs text-conduit-navy-500">of {formatUsx(dailyLimit)} limit</p>
        </div>
        <div className="card">
          <span className="text-xs text-conduit-navy-400">Max Single Tx</span>
          <p className="mt-1 text-2xl font-bold text-conduit-navy-50">{formatUsx(maxTx)}</p>
        </div>
      </div>

      {/* Daily Utilization */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-conduit-navy-200">Daily Utilization</span>
          <span className="text-sm text-conduit-navy-300">{utilization.toFixed(1)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-conduit-navy-700">
          <div
            className={`h-full rounded-full ${utilizationColor} transition-all`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-conduit-navy-500">
          <span>{formatUsx(dailySpent)} spent</span>
          <span>{formatUsx(dailyLimit)} limit</span>
        </div>
        {lastReset > 0 && (
          <p className="mt-2 text-xs text-conduit-navy-500">Last reset: {formatAbsoluteDate(lastReset)}</p>
        )}
      </div>

      {/* Yield Accrual Chart */}
      {yieldAccrued > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Yield Accrual (30d)</h2>
          <YieldChart yieldAccrued={yieldAccrued} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Policy Configuration */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Policy Configuration</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Daily Spend Limit</span>
              <span className="text-sm font-medium text-conduit-navy-200">{formatUsx(dailyLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Max Single Transaction</span>
              <span className="text-sm font-medium text-conduit-navy-200">{formatUsx(maxTx)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Allowed Tx Types</span>
              <div className="flex flex-wrap gap-1">
                {txTypes.map((t) => (
                  <span key={t} className="rounded bg-conduit-navy-700 px-2 py-0.5 text-xs text-conduit-navy-300">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-conduit-navy-400">Multisig Threshold</span>
              <span className="text-sm font-medium text-conduit-navy-200">{vault.multisigThreshold} of {vault.multisigSigners.length}</span>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Addresses</h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-conduit-navy-400">Authority</span>
              <p className="font-mono text-sm text-conduit-navy-200">{vault.authority.toBase58()}</p>
            </div>
            <div>
              <span className="text-xs text-conduit-navy-400">USX Token Account</span>
              <p className="font-mono text-sm text-conduit-navy-200">{vault.usxTokenAccount.toBase58()}</p>
            </div>
            <div>
              <span className="text-xs text-conduit-navy-400">Institution</span>
              <p className="font-mono text-sm text-conduit-navy-200">{vault.institution.toBase58()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Counterparties */}
      {vault.policy.approvedCounterparties.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">
            Approved Counterparties ({vault.policy.approvedCounterparties.length})
          </h2>
          <div className="space-y-2">
            {vault.policy.approvedCounterparties.map((cp, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-conduit-navy-800 p-3">
                <div className="h-2 w-2 rounded-full bg-conduit-emerald-400" />
                <span className="font-mono text-sm text-conduit-navy-200">{cp.toBase58()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multisig Signers */}
      {vault.multisigSigners.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">
            Multisig Signers ({vault.multisigSigners.length})
          </h2>
          <div className="space-y-2">
            {vault.multisigSigners.map((signer, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-conduit-navy-800 p-3">
                <span className="text-xs font-medium text-conduit-navy-400">#{i + 1}</span>
                <span className="font-mono text-sm text-conduit-navy-200">{signer.toBase58()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vault Activity (Audit Entries) */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-conduit-navy-100">Vault Activity</h2>
        {auditLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
            <span className="ml-2 text-sm text-conduit-navy-300">Loading activity...</span>
          </div>
        )}
        {!auditLoading && vaultAuditEntries.length === 0 && (
          <p className="py-4 text-center text-sm text-conduit-navy-400">No activity recorded for this vault.</p>
        )}
        {!auditLoading && vaultAuditEntries.length > 0 && (
          <div className="space-y-3">
            {vaultAuditEntries.slice(0, 20).map((entry, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-conduit-navy-800 p-3">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-conduit-navy-700 px-2 py-0.5 text-xs font-medium text-conduit-navy-300">
                    {ACTION_LABELS[entry.actionType] || `Action ${entry.actionType}`}
                  </span>
                  {entry.amount && (
                    <span className="text-sm text-conduit-navy-200">{formatUsx(Number(entry.amount.toString()))}</span>
                  )}
                </div>
                <span className="text-xs text-conduit-navy-400">{formatDate(entry.timestamp.toNumber() * 1000)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
