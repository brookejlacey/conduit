# Conduit Protocol — Backlog

> Prioritized by impact. Claude: execute top-to-bottom within each priority tier.

Status: `[ ]` todo · `[x]` done

---

## P0 — Ship Blockers

- [ ] **Deploy programs to devnet** — All 4 programs need to be live on devnet so dashboard shows real data
- [ ] **Seed demo data on devnet** — Create institution, register agent, initialize vault, make deposits, log audit entries
- [ ] **Dashboard error states** — All pages should gracefully handle RPC errors and empty states (overview done, check others)

## P1 — Dashboard Polish

- [x] **Vault detail page** — Click a vault to see deposit history, policy config, yield timeline
- [x] **Agent detail page** — Click an agent to see decision timeline with expandable AI reasoning
- [x] **Settlement batch detail** — Click a batch to see entries, FX rates, netting efficiency
- [ ] **Real-time updates** — WebSocket subscriptions for vault changes and new audit entries
- [x] **Responsive layout** — Mobile-friendly sidebar (collapse to icons on small screens)
- [x] **Loading skeletons** — Replace spinners with skeleton loaders for better perceived performance

## P2 — Agent Service

- [ ] **Wire Claude API** — Test basic prompt/response flow for treasury decisions
- [ ] **Compliance pre-check** — Policy validation before every on-chain action
- [ ] **Treasury analysis** — Analyze vault positions, decide rebalancing actions
- [ ] **Settlement batching** — Aggregate cross-border payments into batches
- [ ] **On-chain audit logging** — Hash reasoning text, store hash + URI on-chain
- [ ] **Cron scheduler** — Rebalance every 15min, settlements every 4hrs, compliance every 5min
- [ ] **E2E agent flow** — Agent starts → analyzes → decides → executes → logs

## P3 — Demo & Submission

- [ ] **Demo script** — What to show in 3 minutes (problem → architecture → live agent → dashboard)
- [ ] **Record Loom video** — 3-min walkthrough for StableHacks submission
- [ ] **DoraHacks submission** — Project name, team, links, video
- [ ] **Testnet demo link** — Dashboard URL pointing at devnet with live data

## P4 — Stretch Goals

- [ ] **Multilateral netting visualization** — Animated flow diagram in dashboard
- [ ] **Multiple agent instances** — Different authority tiers running concurrently
- [ ] **Yield chart** — Historical yield accrual from on-chain data
- [ ] **Compliance report PDF** — Export audit trail as downloadable report
- [ ] **Agent reasoning replay** — Step through past decisions with reasoning text
- [ ] **IPFS reasoning storage** — Store full reasoning text on IPFS, link via URI

---

## Completed

<details>
<summary>Click to expand</summary>

### Phase 0: Foundation
- [x] Project scaffolding (monorepo, all packages, Rust programs)
- [x] Notion project page with architecture
- [x] CLAUDE.md, BACKLOG.md

### Phase 1: Solana Programs (All 4 Complete)
- [x] Vault program — initialize, deposit, withdraw, update_policy, accrue_yield
- [x] Agent Registry — register_institution, register_agent, update_tier, deactivate, reactivate
- [x] Settlement — initialize_config, create_batch, add_entry, execute_settlement, update_fx_rate
- [x] Audit Log — log_event with reasoning hash + URI
- [x] All integration tests passing (28 tests)
- [x] Anchor 0.30.1 → 0.31.1 upgrade

### Phase 1.5: SDK
- [x] IDL generation and types
- [x] PDA derivation helpers
- [x] Borsh instruction builders
- [x] Account decoders (vault, agent, settlement, audit)
- [x] Constants and program IDs

### Dashboard
- [x] Next.js 15 scaffold with App Router
- [x] Dark institutional theme (navy/blue/emerald/amber)
- [x] Sidebar navigation with all routes
- [x] Overview page with metric cards and recent activity
- [x] Agents list page
- [x] Vaults list page
- [x] Settlements list page
- [x] Audit log page
- [x] Risk dashboard page
- [x] Wallet adapter (Phantom + Solflare via individual packages)
- [x] Wallet modal integration (click to open picker)
- [x] Default network changed to devnet
- [x] Overview page error handling for RPC failures
- [x] Playwright e2e tests (17 tests passing)

### Infrastructure
- [x] Vercel auto-deploy on push
- [x] Investor pitch Notion page
- [x] GitHub repo public

</details>
