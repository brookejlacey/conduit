# Worklog

> What shipped, what's next, blockers. Keep under 100 lines.

---

## Current Session (2026-03-11)

### What shipped
- **fix: RPC connection refused** — Dashboard defaulted to `localnet` (127.0.0.1:8899). Changed default network to `devnet` in `dashboard/src/lib/solana.ts`
- **fix: wallet connect button** — Rewrote WalletButton to use `useWalletModal` from wallet-adapter-react-ui. Now opens proper wallet picker with Phantom/Solflare. Added loading states and error handling.
- **fix: wallet adapter bundle bloat** — Replaced `@solana/wallet-adapter-wallets` mega-package (caused build failures from tslib/uuid/etc) with direct `@solana/wallet-adapter-phantom` + `@solana/wallet-adapter-solflare` imports
- **fix: overview error handling** — Added amber error banner when RPC connection fails instead of infinite loading spinner
- **setup: Playwright e2e tests** — 17 tests covering navigation, page loads, wallet modal, error states. All passing.
- **setup: workflow docs** — Created BACKLOG.md (prioritized), WORKLOG.md, DECISIONS.md. Updated CLAUDE.md with session protocol and Loop.
- **Investor pitch** — Created Notion page with full technical depth (Rust schemas, PDA seeds, instruction sets). Published at brookejlacey.notion.site/conduit

### What's next
- **P0: Deploy programs to devnet** — Dashboard needs live data
- **P0: Seed demo data** — Institution, agent, vault, deposits, audit entries on devnet
- **P0: Dashboard error states** — Verify all pages handle empty/error states gracefully

### Blockers
- Anchor build/test requires WSL (not native Windows)

---

## Archive

<details>
<summary>Previous sessions</summary>

### 2026-03-10
- Upgraded Anchor 0.30.1 → 0.31.1, fixed all test failures
- Added test coverage for new features and edge cases (28 tests passing)
- Added Borsh-encoded instruction builders for all programs
- Completed Phase 1 audit fixes

</details>
