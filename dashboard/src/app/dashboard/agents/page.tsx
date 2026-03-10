'use client';

import { AgentCard } from '@/components/agent/AgentCard';
import type { AgentIdentity } from '@conduit/sdk';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const mockAgents: AgentIdentity[] = [
  {
    institution: PublicKey.default,
    agentPubkey: PublicKey.default,
    authorityTier: 2,
    scopedPrograms: [PublicKey.default, PublicKey.default, PublicKey.default],
    active: true,
    registeredAt: new BN(Math.floor(Date.now() / 1000) - 86400 * 30),
    lastActionAt: new BN(Math.floor(Date.now() / 1000) - 300),
    bump: 255,
  },
  {
    institution: PublicKey.default,
    agentPubkey: PublicKey.default,
    authorityTier: 1,
    scopedPrograms: [PublicKey.default, PublicKey.default],
    active: true,
    registeredAt: new BN(Math.floor(Date.now() / 1000) - 86400 * 15),
    lastActionAt: new BN(Math.floor(Date.now() / 1000) - 1200),
    bump: 254,
  },
  {
    institution: PublicKey.default,
    agentPubkey: PublicKey.default,
    authorityTier: 0,
    scopedPrograms: [PublicKey.default],
    active: false,
    registeredAt: new BN(Math.floor(Date.now() / 1000) - 86400 * 60),
    lastActionAt: new BN(Math.floor(Date.now() / 1000) - 86400 * 5),
    bump: 253,
  },
];

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-conduit-navy-50">Agents</h1>
        <button className="btn-primary">Register Agent</button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {mockAgents.map((agent, i) => (
          <AgentCard key={i} agent={agent} />
        ))}
      </div>
    </div>
  );
}
