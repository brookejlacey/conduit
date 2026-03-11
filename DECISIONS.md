# Decision Log

> Architecture and design decisions. Append-only — newest at top.

---

## 2026-03-11: Default network changed to devnet

**Context:** Dashboard was trying to hit localhost:8899 when deployed to Vercel, causing ERR_CONNECTION_REFUSED on every page.

**Decision:** Changed default network from `localnet` to `devnet` in `dashboard/src/lib/solana.ts`. The `NEXT_PUBLIC_SOLANA_NETWORK` env var can still override to localnet for local dev.

**Impact:** Dashboard works on Vercel without requiring a local validator. Developers can set env var for local dev.

## 2026-03-11: Individual wallet adapter packages over mega-bundle

**Context:** `@solana/wallet-adapter-wallets` pulls in every wallet adapter (Trezor, Particle, Fractal, etc.) causing build failures from missing peer deps (tslib, uuid, @solana/web3.js version conflicts).

**Decision:** Replaced with direct imports: `@solana/wallet-adapter-phantom` and `@solana/wallet-adapter-solflare`. We only support these two wallets.

**Impact:** Build succeeds cleanly. Bundle size reduced significantly. Adding wallet support requires explicitly installing the adapter package.

## 2026-03-11: Wallet modal over custom connect logic

**Context:** WalletButton had a custom `handleClick` that called `select(wallets[0])` then `connect()` with no error handling. Failed silently when no wallet extension was installed.

**Decision:** Use `useWalletModal` from `@solana/wallet-adapter-react-ui` to open the standard wallet picker dialog. Let the library handle wallet selection, connection, and error states.

**Impact:** Users see a proper wallet picker. Errors surface visibly. Works even without a wallet extension installed (modal shows install links).

## 2026-03-11: Conduit as standalone company play (not just hackathon)

**Context:** StableHacks 2026 terms confirm full IP retention. Investor (Alon) runs a blockchain-specific fund and has already invested in Jayla.

**Decision:** Build Conduit as a real protocol with investor-grade positioning. Submit to hackathon for validation + prizes, but pursue investment independently. Created investor pitch Notion page at brookejlacey.notion.site/conduit.

**Impact:** Development priorities shift from "hackathon demo" to "production-grade infrastructure." Backlog reprioritized accordingly.

---

## Pre-existing Decisions

| Decision | Rationale |
|----------|-----------|
| Anchor 0.31.1 | Latest stable, Rust 1.88+ compatible |
| 4 separate programs (not 1 monolith) | Cleaner separation, independent upgrades |
| Off-chain AI agent (not on-chain) | Claude API can't run on-chain; agent submits signed txns |
| Reasoning hash on-chain, full text off-chain | On-chain storage expensive; hash provides verifiability |
| USX as sole settlement currency | Simplifies FX routing, stablecoin-native |
| pnpm workspaces monorepo | Proven at scale, matches Jayla's pattern |
| Dark institutional theme | Target audience is banks/institutions |
