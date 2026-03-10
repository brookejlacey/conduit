'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { shortenAddress } from '@/lib/format';

export function WalletButton() {
  const { publicKey, connected, connect, disconnect, select, wallets } = useWallet();

  const handleClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      if (wallets.length > 0) {
        select(wallets[0].adapter.name);
      }
      await connect();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2.5 text-sm transition-colors hover:bg-conduit-navy-700"
    >
      <div
        className={`h-2 w-2 rounded-full ${connected ? 'bg-conduit-emerald-400' : 'bg-conduit-navy-500'}`}
      />
      <span className="text-conduit-navy-200">
        {connected && publicKey ? shortenAddress(publicKey.toBase58()) : 'Connect Wallet'}
      </span>
    </button>
  );
}
