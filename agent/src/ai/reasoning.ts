import { createHash } from 'crypto';

export interface ReasoningRecord {
  reasoning: string;
  hash: Buffer;
  uri: Buffer;
  timestamp: number;
}

/**
 * Compute SHA-256 hash of the reasoning text for on-chain storage.
 */
export function hashReasoning(reasoning: string): Buffer {
  return createHash('sha256').update(reasoning, 'utf-8').digest();
}

/**
 * Create a padded 64-byte URI buffer for on-chain storage.
 * For hackathon, we use a simple format. In production, store on IPFS/Arweave.
 */
export function createReasoningUri(identifier: string): Buffer {
  const uri = `conduit://reasoning/${identifier}`;
  const buffer = Buffer.alloc(64, 0);
  Buffer.from(uri, 'utf-8').copy(buffer, 0, 0, Math.min(uri.length, 64));
  return buffer;
}

/**
 * Create a full reasoning record ready for on-chain logging.
 */
export function createReasoningRecord(reasoning: string): ReasoningRecord {
  const hash = hashReasoning(reasoning);
  const identifier = hash.toString('hex').slice(0, 16);
  const uri = createReasoningUri(identifier);

  return {
    reasoning,
    hash,
    uri,
    timestamp: Date.now(),
  };
}

/**
 * Verify that a reasoning text matches a given hash.
 */
export function verifyReasoning(reasoning: string, expectedHash: Buffer): boolean {
  const actualHash = hashReasoning(reasoning);
  return actualHash.equals(expectedHash);
}
