# Conduit Protocol — StableHacks 2026 Submission

---

## Project Name

Conduit Protocol

## Tagline

AI-powered institutional treasury management and cross-border settlement on Solana.

---

## Description

Conduit Protocol is on-chain infrastructure for institutional treasury operations. It replaces the slow, expensive, and opaque cross-border payment stack — built on SWIFT and correspondent banking — with autonomous AI-driven treasury management on Solana. An AI agent powered by Claude continuously monitors positions, rebalances vaults, and settles cross-border obligations in seconds using USX stablecoins. Every agent decision is logged on-chain with a hash of its reasoning, providing a complete audit trail for compliance and oversight.

The protocol consists of four Solana programs that work together: Vault (fund custody with policy limits and multisig), Agent Registry (AI agent authorization and guardrails), Settlement (payment batching with cross-counterparty netting), and Audit Log (immutable on-chain record of every agent action and its reasoning). Netting alone reduces on-chain transaction volume by 30 percent or more, cutting fees and improving finality for high-volume institutional flows.

Conduit is designed for the $150 trillion cross-border payments market. It is not a wallet or a DeFi yield tool — it is institutional infrastructure that combines Solana's sub-second finality with AI reasoning to automate treasury operations that currently require teams of analysts, manual reconciliation, and days of settlement latency. Built solo in one day, fully open source.

---

## Track Fit

### DeFi Track

Conduit brings institutional treasury management on-chain. The vault system, settlement netting engine, and stablecoin-based clearing layer are core DeFi primitives purpose-built for real-world institutional capital flows. The AI agent layer adds autonomous portfolio management within programmable policy guardrails.

### Infrastructure Track

Conduit is foundational infrastructure for institutional adoption of Solana. The four-program architecture (vault, agent registry, settlement, audit log) provides a composable base layer that other protocols and institutions can build on. The SDK, agent framework, and dashboard are production-ready tooling for the institutional stablecoin ecosystem.

---

## Tech Stack

- **Blockchain:** Solana (sub-second finality, low fees)
- **Smart Contracts:** Anchor 0.31.1 (Rust) — 4 programs
- **AI Agent:** Claude API (@anthropic-ai/sdk) for autonomous treasury decisions
- **SDK:** TypeScript — types, PDA helpers, instruction builders, decode utilities
- **Dashboard:** Next.js 15, React 19, Tailwind CSS (dark institutional theme)
- **Stablecoin:** USX (6 decimals, SPL token)
- **Build System:** pnpm workspaces, Turborepo
- **Testing:** Mocha/Chai via Anchor test runner (28 tests passing)
- **Deployment:** Vercel (dashboard), Solana devnet (programs)

---

## Links

- **GitHub:** https://github.com/brookejlacey/conduit
- **Live Dashboard:** [Vercel deployment URL]
- **Demo Video:** [To be recorded]

---

## Team

**Brooke Lacey** — Solo builder. Full-stack development: Solana programs, TypeScript SDK, AI agent, dashboard, tests, and deployment. Built end-to-end in one day for StableHacks 2026.
