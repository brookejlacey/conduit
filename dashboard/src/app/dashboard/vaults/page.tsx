'use client';

import { VaultCard } from '@/components/vault/VaultCard';
import type { VaultAccount, PolicyConfig } from '@conduit/sdk';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const mockVaults: VaultAccount[] = [
  {
    authority: PublicKey.default,
    usxTokenAccount: PublicKey.default,
    totalDeposits: new BN(5_000_000_000_000),
    yieldAccrued: new BN(125_000_000_000),
    policy: {
      dailySpendLimit: new BN(500_000_000_000),
      maxSingleTxSize: new BN(100_000_000_000),
      approvedCounterparties: [PublicKey.default],
      allowedTxTypes: 0b1111,
      dailySpent: new BN(150_000_000_000),
      lastResetTs: new BN(Math.floor(Date.now() / 1000)),
    },
    multisigSigners: [PublicKey.default],
    multisigThreshold: 1,
    institution: PublicKey.default,
    bump: 255,
  },
  {
    authority: PublicKey.default,
    usxTokenAccount: PublicKey.default,
    totalDeposits: new BN(3_200_000_000_000),
    yieldAccrued: new BN(78_000_000_000),
    policy: {
      dailySpendLimit: new BN(300_000_000_000),
      maxSingleTxSize: new BN(50_000_000_000),
      approvedCounterparties: [PublicKey.default, PublicKey.default],
      allowedTxTypes: 0b0111,
      dailySpent: new BN(245_000_000_000),
      lastResetTs: new BN(Math.floor(Date.now() / 1000)),
    },
    multisigSigners: [PublicKey.default, PublicKey.default],
    multisigThreshold: 2,
    institution: PublicKey.default,
    bump: 254,
  },
];

export default function VaultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Vaults</h1>
        <button className="btn-primary">Create Vault</button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {mockVaults.map((vault, i) => (
          <VaultCard key={i} vault={vault} index={i} />
        ))}
      </div>
    </div>
  );
}
