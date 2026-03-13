# Worklog

> What shipped, what's next, blockers. Keep under 100 lines.

---

## Current Session (2026-03-13)

### What shipped
- **Deployed all 4 programs to devnet** — vault, agent-registry, settlement, audit-log
- **Fixed cross-program ID references** — Settlement had stale vault program ID, audit-log had stale agent-registry ID
- **Seeded demo data on devnet** — Institution, agent, vault (8.5M USX + 125K yield), 3 settlement entries, 7 audit logs
- **Made seed script idempotent** — Handles re-runs gracefully (reads on-chain state for PDA derivation)
- **Rebuilt SDK** — dist had stale program IDs from old build

### What's next
- **P2: E2E agent flow** — Now unblocked with devnet deploy
- **P3: Record Loom video** — 3-min walkthrough
- **P3: Testnet demo link** — Dashboard URL with live data

### Blockers
- Anchor build/test requires WSL (not native Windows)

---

## Previous Session (2026-03-11)

### What shipped
- Vault, agent, settlement detail pages
- Responsive mobile sidebar with hamburger menu
- Skeleton loading states, WebSocket real-time updates
- Header shows actual network
- All 17 Playwright e2e tests passing

---

## Archive

<details>
<summary>Previous sessions</summary>

### 2026-03-11 (earlier)
- Fixed RPC connection refused (changed default to devnet)
- Fixed wallet connect button (useWalletModal)
- Fixed wallet adapter bundle bloat (individual packages)
- Added overview error handling
- Set up Playwright e2e tests (17 tests)
- Created BACKLOG.md, WORKLOG.md, DECISIONS.md
- Investor pitch Notion page

### 2026-03-10
- Upgraded Anchor 0.30.1 → 0.31.1, fixed all test failures
- Added test coverage for new features and edge cases (28 tests passing)
- Added Borsh-encoded instruction builders for all programs
- Completed Phase 1 audit fixes

</details>
