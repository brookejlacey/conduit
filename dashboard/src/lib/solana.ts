import { clusterApiUrl, Cluster } from '@solana/web3.js';

export function getRpcUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (envUrl) return envUrl;

  const network = getNetwork();
  if (network === 'localnet') return 'http://127.0.0.1:8899';

  return clusterApiUrl(network as Cluster);
}

export function getNetwork(): string {
  return process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'localnet';
}

export function getWsUrl(): string {
  const rpcUrl = getRpcUrl();
  return rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
}
