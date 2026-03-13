import type { Logger } from 'pino';

export interface IPFSUploadResult {
  cid: string;
  uri: string;
}

/**
 * IPFS storage client using Pinata HTTP API.
 * Uploads reasoning text and returns IPFS CID for on-chain URI storage.
 *
 * Supports:
 * - Pinata (default, requires PINATA_JWT)
 * - Generic IPFS HTTP API (fallback)
 */
export class IPFSStorage {
  constructor(
    private pinataJwt: string | undefined,
    private logger: Logger,
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.pinataJwt);
  }

  async uploadReasoning(reasoning: string, metadata?: Record<string, string>): Promise<IPFSUploadResult> {
    if (!this.pinataJwt) {
      throw new Error('IPFS storage not configured (missing PINATA_JWT)');
    }

    const body = JSON.stringify({
      reasoning,
      timestamp: new Date().toISOString(),
      protocol: 'conduit',
      version: '1.0',
      ...metadata,
    });

    const formData = new FormData();
    formData.append('file', new Blob([body], { type: 'application/json' }), 'reasoning.json');
    formData.append('pinataMetadata', JSON.stringify({
      name: `conduit-reasoning-${Date.now()}`,
      keyvalues: metadata || {},
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.pinataJwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error({ status: response.status, error: errorText }, 'Pinata upload failed');
      throw new Error(`Pinata upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json() as { IpfsHash: string };
    const cid = result.IpfsHash;
    const uri = `ipfs://${cid}`;

    this.logger.info({ cid, uri }, 'Reasoning uploaded to IPFS');
    return { cid, uri };
  }

  async fetchReasoning(cid: string): Promise<string> {
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await fetch(gatewayUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.status}`);
    }

    const data = await response.json() as { reasoning: string };
    return data.reasoning;
  }
}
