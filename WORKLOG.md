# Worklog

> What shipped, what's next, blockers. Keep under 100 lines.

---

## Current Session (2026-03-11, continued)

### What shipped
- **Vault detail page** — `/dashboard/vaults/[index]` with full policy config, addresses, counterparties, activity log
- **Agent detail page** — `/dashboard/agents/[index]` with identity, scoped programs, decision timeline
- **Settlement batch detail** — `/dashboard/settlements/[index]` with netting breakdown, timeline, metrics
- **Clickable cards/rows** — All list pages now link to detail views
- **Responsive sidebar** — Mobile hamburger menu with slide-out overlay, close on nav
- **Loading skeletons** — Replaced all spinners with skeleton loaders (cards, table rows, timeline)
- **Header network display** — Shows actual network (devnet/localnet) instead of hardcoded "Localnet"
- **WebSocket subscriptions** — All 4 hooks use `onProgramAccountChange` for real-time updates
- **Updated e2e tests** — All 17 tests passing with dual-sidebar DOM

### What's next
- **P0: Deploy programs to devnet** — BLOCKED by airdrop rate limit
- **P0: Seed demo data** — Depends on deploy
- **P3: Demo script** — Can draft structure now
- **P4: Stretch goals** — Netting visualization, yield chart, compliance PDF

### Blockers
- Devnet airdrop rate limited (wallet: `CEsL1n9oUiWRPAX2n245tg3nJXRzaVRJTa251nAkQ4mw`)
- Anchor build/test requires WSL (not native Windows)

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
