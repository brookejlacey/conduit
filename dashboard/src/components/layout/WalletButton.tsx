'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { shortenAddress } from '@/lib/format';

export function WalletButton() {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [disconnecting, setDisconnecting] = useState(false);

  const handleClick = async () => {
    if (connected) {
      try {
        setDisconnecting(true);
        await disconnect();
      } catch (err) {
        console.error('Failed to disconnect wallet:', err);
      } finally {
        setDisconnecting(false);
      }
    } else {
      setVisible(true);
    }
  };

  const isLoading = connecting || disconnecting;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex w-full items-center gap-3 rounded-lg border border-conduit-navy-600 bg-conduit-navy-800 px-3 py-2.5 text-sm transition-colors hover:bg-conduit-navy-700 disabled:opacity-50"
    >
      {isLoading ? (
        <div className="h-2 w-2 animate-spin rounded-full border border-conduit-blue-400 border-t-transparent" />
      ) : (
        <div
          className={`h-2 w-2 rounded-full ${connected ? 'bg-conduit-emerald-400' : 'bg-conduit-navy-500'}`}
        />
      )}
      <span className="text-conduit-navy-200">
        {connecting
          ? 'Connecting...'
          : disconnecting
            ? 'Disconnecting...'
            : connected && publicKey
              ? shortenAddress(publicKey.toBase58())
              : 'Connect Wallet'}
      </span>
    </button>
  );
}
