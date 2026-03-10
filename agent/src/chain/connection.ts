import { Connection, Commitment } from '@solana/web3.js';

export function createConnection(
  rpcUrl: string,
  commitment: Commitment = 'confirmed',
): Connection {
  return new Connection(rpcUrl, {
    commitment,
    confirmTransactionInitialTimeout: 60_000,
  });
}
