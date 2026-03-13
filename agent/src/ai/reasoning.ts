import { createHash } from 'crypto';
import { IPFSStorage } from '../storage/ipfs';

export interface ReasoningRecord {
  reasoning: string;
  hash: Buffer;
  uri: Buffer;
  timestamp: number;
  ipfsCid?: string;
}

/**
 * Compute SHA-256 hash of the reasoning text for on-chain storage.
 */
export function hashReasoning(reasoning: string): Buffer {
  return createHash('sha256').update(reasoning, 'utf-8').digest();
}

/**
 * Create a padded 64-byte URI buffer for on-chain storage.
 */
export function createReasoningUri(uri: string): Buffer {
  const buffer = Buffer.alloc(64, 0);
  Buffer.from(uri, 'utf-8').copy(buffer, 0, 0, Math.min(uri.length, 64));
  return buffer;
}

/**
 * Create a full reasoning record, optionally uploading to IPFS.
 */
export async function createReasoningRecord(
  reasoning: string,
  ipfsStorage?: IPFSStorage,
  metadata?: Record<string, string>,
): Promise<ReasoningRecord> {
  const hash = hashReasoning(reasoning);
  const timestamp = Date.now();
  let uri: Buffer;
  let ipfsCid: string | undefined;

  // Try IPFS upload if configured
  if (ipfsStorage?.isConfigured) {
    try {
      const result = await ipfsStorage.uploadReasoning(reasoning, metadata);
      uri = createReasoningUri(result.uri);
      ipfsCid = result.cid;
    } catch {
      // Fallback to hash-based URI
      const identifier = hash.toString('hex').slice(0, 16);
      uri = createReasoningUri(`conduit://reasoning/${identifier}`);
    }
  } else {
    const identifier = hash.toString('hex').slice(0, 16);
    uri = createReasoningUri(`conduit://reasoning/${identifier}`);
  }

  return { reasoning, hash, uri, timestamp, ipfsCid };
}

/**
 * Verify that a reasoning text matches a given hash.
 */
export function verifyReasoning(reasoning: string, expectedHash: Buffer): boolean {
  const actualHash = hashReasoning(reasoning);
  return actualHash.equals(expectedHash);
}
