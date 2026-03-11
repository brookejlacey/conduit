# Conduit Protocol

AI-powered institutional treasury management on Solana.

## Session Protocol

**At session start:** Read BACKLOG.md, WORKLOG.md, DECISIONS.md. Understand what shipped, what's next, and what's blocked.

**At session end:** Update all three. Mark completed items in BACKLOG.md, log what shipped in WORKLOG.md, record any architectural decisions in DECISIONS.md. Then commit and push.

## The Loop

PICK → IMPLEMENT → VERIFY → COMMIT → UPDATE → PICK

1. **PICK** — Take highest-priority incomplete item from BACKLOG.md (P0 first, then P1, etc.)
2. **IMPLEMENT** — Write code. Fix bugs. Build features.
3. **VERIFY** — Run `cd C:/Users/brook/source/repos/conduit/dashboard && npx next build` for dashboard changes. Run Playwright tests: `cd C:/Users/brook/source/repos/conduit/dashboard && npx playwright test`. For Solana programs, build/test in WSL: `wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/brook/source/repos/conduit && anchor test"`.
4. **COMMIT** — `git add <files> && git commit -m "message" && git push`. Always push. Vercel auto-deploys dashboard on push.
5. **UPDATE** — Mark item done in BACKLOG.md, update WORKLOG.md with what shipped.
6. **PICK** — Go to step 1 until blocked or user says stop.

## Rules

- Don't ask "which item?" — just start with the highest priority incomplete item
- Don't break work into phases requiring approval
- Don't present options and wait — execute
- Only ask if truly blocked
- When user brain-dumps: parse into tasks → add to BACKLOG.md → start executing
- Always commit and push after completing work — Vercel deploys automatically
- Never add "Co-Authored-By" or any AI attribution to commit messages

## Architecture

Monorepo: pnpm workspaces + Anchor workspace

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

# Build dashboard
cd dashboard && npx next build

# Run Playwright e2e tests
cd dashboard && npx playwright test

# Dev mode (dashboard)
cd dashboard && npx next dev

# Typecheck dashboard
cd dashboard && npx tsc --noEmit

# Build/test Solana programs (MUST use WSL)
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/brook/source/repos/conduit && anchor build"
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/brook/source/repos/conduit && anchor test"

# Deploy to devnet (WSL)
wsl -d Ubuntu -- bash -lc "cd /mnt/c/Users/brook/source/repos/conduit && anchor deploy --provider.cluster devnet"
```

## CLI Tools

- **Git** — Always commit + push. Dashboard auto-deploys to Vercel.
- **Vercel** — `npx vercel` for manual deploys if needed. `npx vercel logs` to check deploy status.
- **Playwright** — `cd dashboard && npx playwright test` for e2e tests. `npx playwright test --ui` for debug mode.
- **pnpm** — Package manager. Use `pnpm add --filter @conduit/dashboard <pkg>` to add deps to specific workspace.
- **Anchor** — Must run in WSL. `anchor build`, `anchor test`, `anchor deploy`.

## Deployment

- Dashboard auto-deploys to Vercel on every push to GitHub
- Repo: https://github.com/brookejlacey/conduit
- Solana programs deploy to devnet via `anchor deploy` in WSL

## Program IDs

After `anchor build`, update program IDs in:
- `Anchor.toml` (programs.localnet section)
- `sdk/src/utils/constants.ts`
- `.env` (copy from .env.example)
- Each program's `declare_id!()` in lib.rs

## Conventions

- Solana programs use Anchor 0.31.1
- TypeScript strict mode everywhere
- Dashboard uses App Router (Next.js 15), React 19, Tailwind CSS
- Default network is devnet (configured in `dashboard/src/lib/solana.ts`)
- Agent uses Claude API (@anthropic-ai/sdk) for treasury decisions
- All agent actions are logged on-chain via audit-log program
- USX is the base settlement stablecoin (6 decimals)
- Dark institutional theme (navy/blue/emerald/amber)
- Wallet adapters: Phantom + Solflare only (individual packages, not mega-bundle)
