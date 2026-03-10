# Conduit Protocol

AI-powered institutional treasury management on Solana for StableHacks 2026.

## Architecture

Monorepo: pnpm workspaces + Turborepo + Anchor workspace

- `programs/` — 4 Anchor/Rust Solana programs (vault, agent-registry, settlement, audit-log)
- `sdk/` — @conduit/sdk — TypeScript types, PDA helpers, program clients
- `agent/` — @conduit/agent — Claude-powered autonomous treasury agent
- `dashboard/` — @conduit/dashboard — Next.js 15 institutional monitoring UI
- `tests/` — Anchor integration tests (Mocha/Chai)
- `docker/` — Local dev containers (validator, agent, dashboard)

## Dev Commands

```bash
# Install deps
pnpm install

# Build Anchor programs (generates IDL → sdk/src/idl/)
anchor build

# Run Anchor tests (starts local validator automatically)
anchor test

# Build all TypeScript packages
pnpm build

# Dev mode (dashboard + agent)
pnpm dev

# Typecheck all packages
pnpm typecheck

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Program IDs

After `anchor build`, update program IDs in:
- `Anchor.toml` (programs.localnet section)
- `sdk/src/utils/constants.ts`
- `.env` (copy from .env.example)
- Each program's `declare_id!()` in lib.rs

## Conventions

- Solana programs use Anchor 0.30.1
- TypeScript strict mode everywhere
- Dashboard uses App Router (Next.js 15), React 19, Tailwind CSS
- Agent uses Claude API (@anthropic-ai/sdk) for treasury decisions
- All agent actions are logged on-chain via audit-log program
- USX is the base settlement stablecoin
- Dark institutional theme (navy/blue/emerald/amber)

## Commit Rules

- Never add "Co-Authored-By" or any AI attribution to commit messages
