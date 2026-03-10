import { formatDistanceToNow } from 'date-fns';

const USX_DECIMALS = 6;

/**
 * Format USX lamports to human-readable string.
 * e.g., 1_000_000_000_000 -> "$1,000,000"
 */
export function formatUsx(lamports: number): string {
  const amount = lamports / 10 ** USX_DECIMALS;

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Format a timestamp to relative time.
 */
export function formatDate(timestamp: number): string {
  if (timestamp === 0) return 'N/A';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Format an absolute date.
 */
export function formatAbsoluteDate(timestamp: number): string {
  if (timestamp === 0) return 'N/A';
  return new Date(timestamp).toLocaleString();
}

/**
 * Shorten a Solana address for display.
 * e.g., "7xKnR4pQ9bZ3fPqN..." -> "7xKn...3fPq"
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a percentage value.
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a large number with comma separators.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}
