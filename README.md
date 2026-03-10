# Conduit Protocol

**Compliant AI Agent Treasury Infrastructure on Solana**

> What if institutional treasury didn't need a human at the keyboard — just compliant AI agents with programmable guardrails, settling in USX on Solana?

Built for [StableHacks 2026](https://dorahacks.io/) by Brooke & CJ.

---

## The Problem

Institutions are deploying AI agents for everything — except moving money. Why? Because there's no compliant infrastructure that lets autonomous agents execute treasury operations within institutional guardrails.

Every existing solution puts a human at the keyboard. But the future is **AI agents managing treasury autonomously**, bounded by programmable compliance policies, with full on-chain auditability.

## The Solution

Conduit is the permissioned financial infrastructure layer that lets institutions deploy AI agents with programmable treasury authority on Solana, settling in USX.

### Core Components

| Component | What it does |
|-----------|-------------|
| **Permissioned Vaults** | KYC-gated institutional vaults with embedded policy engines (daily limits, counterparty whitelists, tx type restrictions) |
| **Agent Registry** | On-chain AI agent identities with tiered authority (read-only → execute → full treasury management) |
| **Settlement Engine** | Cross-border USX settlement with FX routing and multilateral netting |
| **Audit Log** | Immutable on-chain record of every agent decision with reasoning hash |
| **AI Treasury Agent** | Claude-powered autonomous agent that analyzes positions, rebalances, and executes — all within policy bounds |
| **Institutional Dashboard** | Real-time monitoring of vault positions, agent decisions, compliance status, and risk metrics |

### Architecture

```
┌─────────────────────────────────────────────┐
│           Institutional Dashboard            │
│     (Next.js · Real-time · Compliance)       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│           AI Treasury Agent                  │
│     (Claude API · Autonomous · Auditable)    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│              Solana Programs                 │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Vault   │ │  Agent   │ │  Settlement  │ │
│  │ + Policy │ │ Registry │ │  + FX Oracle │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────────────────────────────────┐   │
│  │           Audit Log                   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Tech Stack

- **Smart Contracts**: Rust / Anchor 0.30.1 on Solana
- **Settlement**: USX stablecoin
- **AI Agent**: TypeScript + Claude API (@anthropic-ai/sdk)
- **Dashboard**: Next.js 15, React 19, Tailwind CSS, Recharts
- **SDK**: TypeScript types + PDA helpers + program clients
- **Monorepo**: pnpm workspaces + Turborepo

## Quick Start

```bash
# Prerequisites: Rust, Solana CLI, Anchor 0.30.1, Node 20+, pnpm

git clone https://github.com/<your-repo>/conduit
cd conduit
pnpm install
cp .env.example .env

# Build & test
anchor build
anchor test

# Start development
pnpm dev
```

See [SETUP.md](./SETUP.md) for detailed instructions.

## Project Structure

```
conduit/
├── programs/           # 4 Anchor/Rust Solana programs
│   ├── vault/          # Permissioned vaults + policy engine
│   ├── agent-registry/ # On-chain agent identities + tiers
│   ├── settlement/     # Cross-border FX + settlement
│   └── audit-log/      # Immutable agent action log
├── sdk/                # TypeScript SDK (@conduit/sdk)
├── agent/              # Claude-powered treasury agent
├── dashboard/          # Next.js institutional dashboard
├── tests/              # Anchor integration tests
└── docker/             # Local dev containers
```

## Why Solana + USX?

- **Sub-second finality** enables real-time agent-driven treasury operations
- **Low transaction costs** make per-action audit logging economically viable
- **USX as settlement layer** provides institutional-grade stablecoin infrastructure
- **Parallel execution** supports multiple agents operating simultaneously

## Team

- **Brooke** — Smart contracts, AI agent, SDK
- **CJ** — Dashboard, UX, integration

## License

MIT
