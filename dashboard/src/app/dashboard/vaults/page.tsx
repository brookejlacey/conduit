'use client';

import { VaultCard } from '@/components/vault/VaultCard';
import { useVaults } from '@/hooks/useVaults';

export default function VaultsPage() {
  const { vaults, loading, error, refresh } = useVaults();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Vaults</h1>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-4 py-2 text-sm text-conduit-navy-200 transition hover:bg-conduit-navy-700"
          >
            Refresh
          </button>
          <button className="btn-primary">Create Vault</button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-conduit-blue-400 border-t-transparent" />
          <span className="ml-3 text-conduit-navy-300">Loading vaults...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            Failed to load vaults: {error.message}
          </p>
          <button
            onClick={refresh}
            className="mt-2 text-xs text-red-300 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && vaults.length === 0 && (
        <div className="rounded-lg border border-conduit-navy-700 bg-conduit-navy-800/50 p-8 text-center">
          <p className="text-conduit-navy-400">No vaults found on the current network.</p>
          <p className="mt-1 text-xs text-conduit-navy-500">
            Create a vault or connect to a network with deployed vaults.
          </p>
        </div>
      )}

      {!loading && vaults.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {vaults.map((vault, i) => (
            <VaultCard key={i} vault={vault} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
