# Conduit Protocol — Hackathon Backlog

Status: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0: Foundation [Target: Day 1 Morning]

### Brooke
- [x] Project scaffolding (monorepo, all packages, Rust programs)
- [x] Notion project page with architecture
- [x] CLAUDE.md, SETUP.md, backlog
- [ ] `anchor build` passes on all 4 programs (fix any Rust compilation errors)
- [ ] `anchor keys list` — update all program IDs everywhere
- [ ] `anchor test` — all integration tests pass
- [ ] `pnpm build` — SDK, agent, dashboard all compile clean

### CJ
- [ ] Clone repo, follow SETUP.md, confirm everything builds
- [ ] Review dashboard scaffold, identify any missing pages/components

---

## Phase 1: Core Smart Contracts [Target: Day 1]

### Vault Program (Brooke)
- [ ] `initialize_vault` — create vault PDA, set policy, multisig signers
- [ ] `deposit` — KYC-gated USX deposit via SPL token transfer, mint receipt
- [ ] `withdraw` — full policy engine checks (daily limit, max tx, counterparty, tx type bitmask)
- [ ] `update_policy` — multisig threshold verification
- [ ] `accrue_yield` — permissioned crank
- [ ] Daily limit auto-reset logic (check last_reset_ts, reset daily_spent)
- [ ] Integration tests: happy path deposit/withdraw, policy violation errors, multisig override

### Agent Registry Program (Brooke)
- [ ] `register_institution` — create institution PDA with KYC hash
- [ ] `register_agent` — bind agent to institution, set authority tier
- [ ] `update_agent_tier` — admin-only tier change
- [ ] `deactivate_agent` — kill switch
- [ ] Integration tests: register, tier changes, unauthorized access, deactivation

### Audit Log Program (Brooke)
- [ ] `log_event` — agent-signed audit entry with reasoning hash + URI
- [ ] Integration tests: log events, verify on-chain data

### Settlement Program (Brooke)
- [ ] `create_batch` — open new settlement batch
- [ ] `add_entry` — add payment entry with FX rate
- [ ] `execute_settlement` — atomic multi-vault USX transfers
- [ ] `update_fx_rate` — oracle/admin rate update
- [ ] Integration tests: batch lifecycle, settlement execution, FX rate updates

---

## Phase 2: SDK + Agent Wiring [Target: Day 2 Morning]

### SDK (Brooke)
- [ ] Copy generated IDL JSONs from `target/idl/` into `sdk/src/idl/`
- [ ] Write typed program client wrappers (if not auto-generated)
- [ ] Verify all PDA derivation helpers match actual program seeds
- [ ] Verify all TypeScript types match Rust account structs exactly
- [ ] Export everything cleanly from index.ts

### Agent Service (Brooke)
- [ ] Wire Claude API client — test basic prompt/response flow
- [ ] Implement compliance service — policy check before every action
- [ ] Implement treasury service — analyze vault positions, decide rebalancing
- [ ] Implement settlement service — batch cross-border payments
- [ ] Wire on-chain audit logging — hash reasoning, store on-chain
- [ ] Implement cron scheduler — rebalance every 15min, settlements every 4hrs
- [ ] Create seed script — populate test institution, agent, vault, mock deposits
- [ ] End-to-end test: agent starts, analyzes, makes decision, executes, logs

---

## Phase 3: Dashboard [Target: Day 2-3]

### Dashboard Core (CJ)
- [ ] Wallet adapter integration — connect Phantom/Solflare
- [ ] Program provider context — connect to all 4 programs via SDK
- [ ] Sidebar navigation — working links, active state highlighting
- [ ] Dark theme polish — consistent colors, proper contrast ratios

### Dashboard Pages (CJ)
- [ ] **Overview** — total AUM, active agents count, pending settlements, compliance rate
- [ ] **Vaults** — list all vaults with deposit amounts, policy summaries, yield
- [ ] **Vault Detail** — deposit history chart, policy display, yield accrual timeline
- [ ] **Agents** — list agents with tier badges, status, last action timestamp
- [ ] **Agent Detail** — decision timeline with expandable AI reasoning
- [ ] **Settlements** — batch list with status, gross vs net amounts
- [ ] **Audit Log** — chronological timeline of all agent actions
- [ ] **Risk** — exposure breakdown chart, anomaly flags, policy limit proximity

### Real-time Updates (CJ)
- [ ] WebSocket subscription to vault account changes
- [ ] WebSocket subscription to audit log entries
- [ ] Auto-refresh on new agent decisions

---

## Phase 4: Integration + Polish [Target: Day 3]

### Devnet Deployment (Both)
- [ ] Deploy all 4 programs to Solana devnet
- [ ] Create USX mock token on devnet
- [ ] Initialize demo institution + agent + vault on devnet
- [ ] Agent running against devnet (not localhost)
- [ ] Dashboard connected to devnet

### Demo Preparation (Both)
- [ ] Seed realistic demo data — multiple vaults, varied policies, historical decisions
- [ ] Script the demo flow — what to show in 3 minutes
- [ ] Record 3-minute Loom video:
  - [ ] 0:00-0:30 — Problem statement (institutional treasury + AI agents)
  - [ ] 0:30-1:30 — Architecture walkthrough (programs, agent, dashboard)
  - [ ] 1:30-2:30 — Live demo: agent makes decision, executes on-chain, dashboard updates
  - [ ] 2:30-3:00 — Why Solana + USX, compliance angle, future vision

### Submission (Both)
- [ ] Public GitHub repo
- [ ] Loom video link
- [ ] DoraHacks BUIDL submission (project name, team, country, links)
- [ ] Testnet demo link (dashboard URL pointing at devnet)

---

## Stretch Goals (If Time Permits)

- [ ] Multilateral netting visualization (animated flow diagram in dashboard)
- [ ] Multiple agent instances with different authority tiers
- [ ] Historical yield chart with actual on-chain data
- [ ] Export compliance report as PDF
- [ ] Mobile-responsive dashboard
- [ ] Agent reasoning replay (step through past decisions)
- [ ] Rate limiting on agent actions (token bucket on-chain)
- [ ] IPFS storage for full reasoning text (vs just hash on-chain)

---

## Architecture Decisions Log

| Decision | Rationale |
|----------|-----------|
| Anchor 0.30.1 | Latest stable, well-documented |
| 4 separate programs (not 1 monolith) | Cleaner separation of concerns, independent upgrades |
| Off-chain AI agent (not on-chain) | Claude API can't run on-chain; agent submits signed txns |
| Reasoning hash on-chain, full text off-chain | On-chain storage is expensive; hash provides verifiability |
| USX as sole settlement currency | Hackathon requirement, simplifies FX routing |
| Turborepo monorepo | Proven at scale, good caching, Brooke's existing convention |
| Dark institutional theme | Target audience is banks/institutions; conveys seriousness |
