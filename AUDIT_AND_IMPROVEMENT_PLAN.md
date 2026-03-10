# Conduit Protocol — Audit & Improvement Plan

## Part 1: Bug Report & Security Audit

### CRITICAL — Security Vulnerabilities

#### 1. Settlement `execute_settlement` uses `UncheckedAccount` for vault authority without validation
**File:** `programs/settlement/src/instructions/execute_settlement.rs:26`
```rust
/// CHECK: Validated by the token account owner check
pub vault_authority: UncheckedAccount<'info>,
```
The comment claims the token account owner is validated, but **no such constraint exists** on `from_token_account`. An attacker could pass any account as `vault_authority`. The transfer at line 50-58 uses `creator` as authority anyway, making `vault_authority` a dead parameter — but if this was meant to be the PDA signer for vault-owned transfers, it's completely broken.

**Fix:** Either remove `vault_authority` entirely (since `creator` signs the transfer), or add proper constraints:
```rust
constraint = from_token_account.owner == vault_authority.key() @ SettlementError::Unauthorized
```

#### 2. Settlement `add_entry` uses `UncheckedAccount` for `from_vault` and `to_vault`
**File:** `programs/settlement/src/instructions/add_entry.rs:29-32`
```rust
/// CHECK: Validated as an existing vault account by the caller
pub from_vault: UncheckedAccount<'info>,
/// CHECK: Validated as an existing vault account by the caller
pub to_vault: UncheckedAccount<'info>,
```
These are never validated. Anyone can pass any pubkey as a vault. In production, these should be deserialized as `Account<'info, Vault>` with cross-program ownership checks, or at minimum verified to be owned by the vault program.

#### 3. Audit log doesn't verify agent is registered
**File:** `programs/audit-log/src/instructions/log_event.rs:33`
```rust
/// CHECK: The institution pubkey is stored for reference; validated off-chain
pub institution: UncheckedAccount<'info>,
```
Anyone can write audit entries claiming to be any institution. There's no CPI check or cross-program verification that the `agent` signer is actually registered in the agent-registry program. This means the audit trail can be polluted with fake entries.

**Fix:** Add a cross-program account deserialization check:
```rust
#[account(
    seeds = [b"agent", institution.key().as_ref(), agent.key().as_ref()],
    bump,
    seeds::program = agent_registry_program.key(),
)]
pub agent_identity: Account<'info, AgentIdentity>,
```

#### 4. FX rate oracle has no access control on first write
**File:** `programs/settlement/src/instructions/update_fx_rate.rs:29`
```rust
if fx_rate.oracle != Pubkey::default() && fx_rate.oracle != ctx.accounts.oracle.key() {
    return Err(SettlementError::Unauthorized.into());
}
```
The first person to write an FX rate for any pair becomes its oracle forever. There's no governance or admin authority. A front-runner could claim all FX pairs.

**Fix:** Add a program-level admin authority that must approve oracle assignments.

#### 5. Multisig threshold bypass in `update_policy`
**File:** `programs/vault/src/instructions/update_policy.rs:43-46`
```rust
require!(
    vault.multisig_threshold <= 1
        || signer_key == vault.authority,
    VaultError::MultisigThresholdNotMet
);
```
If threshold is >1, only the original authority can update policy — **not** a quorum of signers. The multisig is effectively non-functional for policy changes. This defeats the purpose of having multisig at all.

#### 6. `accrue_yield` allows arbitrary yield injection
**File:** `programs/vault/src/instructions/accrue_yield.rs:19`
The authority can call `accrue_yield` with any amount and it just increments `vault.yield_accrued` without any corresponding token transfer. This is a bookkeeping-only operation with no actual asset backing. It could be used to inflate reported yields.

### HIGH — Logic Bugs

#### 7. Daily limit reset race condition in `withdraw`
**File:** `programs/vault/src/instructions/withdraw.rs:63-67`
```rust
if now - vault.policy.last_reset_ts >= seconds_per_day {
    vault.policy.daily_spent = 0;
    vault.policy.last_reset_ts = now;
}
```
The daily counter resets based on the _first transaction after 24h_, not on a fixed schedule. This means if no transactions happen for 48h, the entire daily limit is available as one burst. Also, the `check_daily_limit` method in `PolicyConfig` duplicates this reset logic but doesn't actually reset the values — it just checks as if they were reset. The double-check between `withdraw.rs:64-67` and `policy.rs:45-46` is redundant and could diverge.

#### 8. `total_deposits` doesn't account for yield
**File:** `programs/vault/src/state/vault.rs`
`total_deposits` is decremented on withdraw but `yield_accrued` is a separate counter that's never added to the withdrawable balance. There's no mechanism for a depositor to claim yield — it's just a number on the account.

#### 9. `VaultCard` component: `toNumber()` overflow for large values
**File:** `dashboard/src/components/vault/VaultCard.tsx:12`
```typescript
const totalDeposits = vault.totalDeposits.toNumber();
```
BN's `toNumber()` throws for values > `Number.MAX_SAFE_INTEGER` (2^53). With USX having 6 decimals, any vault with >9 billion USX will crash the dashboard. Use `.toString()` and format from string instead.

#### 10. `useVaults` hook never actually deserializes accounts
**File:** `dashboard/src/hooks/useVaults.ts:38`
```typescript
setVaults([]);
```
The hook fetches program accounts but always returns an empty array. The dashboard uses mock data instead of live data.

### MEDIUM — Code Quality Issues

#### 11. Agent services are entirely mock implementations
- `TreasuryService.getVaultPositions()` — returns hardcoded mock data
- `TreasuryService.executeRebalance()` — returns `'simulated-rebalance-tx'`
- `SettlementService.getPendingPayments()` — returns hardcoded mock data
- `SettlementService.executeBatch()` — returns `'simulated-settlement-tx'`
- `ComplianceService.runFullScan()` — uses hardcoded 0.85 utilization
- `OnChainLogger.logAction()` — doesn't send any transaction
- `MarketService.getMarketSnapshot()` — returns hardcoded mock data

None of the agent services actually interact with the blockchain. The entire agent is a scaffold.

#### 12. Claude API model reference is outdated
**File:** `agent/src/ai/claude.ts:31`
```typescript
model: 'claude-sonnet-4-20250514',
```
Should use a more recent model ID or make it configurable.

#### 13. `findAuditEntryPda` uses `slot` but program uses `nonce`
**File:** `sdk/src/utils/pda.ts:78`
```typescript
export function findAuditEntryPda(agent: PublicKey, slot: BN)
```
The PDA parameter is named `slot` but the on-chain program uses `nonce`. This naming mismatch will confuse SDK users.

#### 14. Compliance `validateAction` doesn't halt execution on failure
**File:** `agent/src/core/agent.ts:68`
```typescript
await this.compliance.validateAction('rebalance', decision as unknown as Record<string, unknown>);
await this.treasury.executeRebalance(decision);
```
`validateAction` returns `false` on compliance failure but the return value is never checked. The rebalance executes regardless of compliance validation.

#### 15. Wallet private key stored as plaintext JSON
**File:** `agent/src/core/wallet.ts:24-34`
`saveWallet` writes raw private keys to disk as JSON without any encryption. Production systems should use encrypted keystores or HSMs.

#### 16. Dashboard pages all use mock data with no loading/error states
All dashboard pages (`page.tsx`, `vaults/page.tsx`, `risk/page.tsx`, `agents/page.tsx`, `settlements/page.tsx`, `audit/page.tsx`) use hardcoded mock data. None show loading spinners, error boundaries, or empty states for when real data is unavailable.

#### 17. No `reactivate_agent` instruction
The agent-registry has `deactivate_agent` but no way to reactivate. Once an agent is deactivated, it's permanent. The admin would need to register an entirely new agent identity.

#### 18. `net_offset` parameter in settlement is user-supplied, not computed
**File:** `programs/settlement/src/instructions/add_entry.rs:48`
The net offset should be computed on-chain from the amount and FX rate, not passed as a parameter. Currently, a caller can pass any arbitrary net_offset and the program trusts it, meaning `total_net` on the batch can be manipulated.

---

## Part 2: Competitive Landscape Analysis

### Direct Competitors & Relevant Protocols

| Protocol | What They Do | Conduit Differentiator |
|----------|-------------|----------------------|
| **Squads Protocol** | Multisig + vault management, formally verified, $10B+ secured | Conduit adds AI-powered autonomous decision-making on top of vault controls |
| **Kamino Finance** | Automated lending/yield vaults, $2.8B TVL, risk-curated vaults | Conduit focuses on institutional cross-border settlement, not DeFi yield farming |
| **Jupiter Lend** | Lending vaults with 95% LTV, $1.65B TVL | Conduit targets treasury management, not consumer lending |
| **Meteora** | Dynamic yield vaults, auto-rebalancing across lending markets | Conduit adds compliance, KYC, and audit trail — institutional-grade |
| **MeanFi** | No-code corporate treasury, payment streams, payroll | Closest competitor — but MeanFi lacks AI agent capabilities |
| **Fireblocks + Solana** | Enterprise custody + treasury ops | Conduit is on-chain native; Fireblocks is custodial/off-chain |
| **DeFi Development Corp** | Public company accumulating SOL, research on agentic finance | Validates the market thesis for AI agents managing on-chain treasuries |
| **Solana Agent Kit (SendAI)** | 60+ pre-built Solana actions for AI agents | Infrastructure layer — Conduit could integrate it to accelerate agent capabilities |

### Key Market Insights (2025-2026)

1. **Agentic AI + DeFi is the #1 narrative**: DeFi Dev Corp projects $27B+ structural SOL demand from autonomous agents alone
2. **Institutional stablecoin market on Solana hit $14.1B** in Q3 2025, growing 36.5% QoQ
3. **Squads Protocol** — the benchmark for institutional Solana vault security — is formally verified and secures $10B+. Conduit's vault program lacks formal verification
4. **Kamino's curated vaults** are the gold standard for automated yield optimization — their vault layer hit $593M in one month
5. **elizaOS** has become the de-facto agent framework, and **Solana Agent Kit** provides 60+ pre-built actions
6. **Zero-Knowledge ML (ZK-ML)** is emerging for cryptographically verifiable AI risk assessments without revealing model parameters

---

## Part 3: Improvement Plan — Making Conduit Best-in-Class

### Phase 1: Fix Critical Bugs & Ship Real On-Chain Integration (Week 1-2)

1. **Fix all 6 critical security vulnerabilities** listed above
   - Validate `from_vault`/`to_vault` in settlement
   - Add agent registry cross-program verification to audit-log
   - Implement proper FX oracle governance
   - Build real multisig signature collection
   - Back `accrue_yield` with actual token transfers
   - Remove or properly constrain `vault_authority` in settlement

2. **Wire up agent services to real on-chain data**
   - Replace all mock data with actual RPC calls
   - Implement `TreasuryService.executeRebalance()` with real transaction building
   - Implement `SettlementService.executeBatch()` with on-chain batch creation
   - Implement `OnChainLogger.logAction()` with actual audit-log program calls
   - Integrate real market data (CoinGecko, Pyth, Switchboard)

3. **Fix the compliance validation bug** — check return value and halt on failure

4. **Compute `net_offset` on-chain** from amount * fx_rate instead of trusting user input

5. **Wire up dashboard hooks** — implement real `useVaults`, `useAgents`, `useAuditLog` deserialization

### Phase 2: Institutional-Grade Features (Week 2-3)

6. **Integrate Squads Protocol for multisig**
   - Replace the homebrew multisig with Squads v4 smart accounts
   - Get formal verification parity with the industry standard
   - Implement time locks, spending limits, and role-based access per Squads spec

7. **Add Pyth/Switchboard oracle integration for FX rates**
   - Replace the custom FX oracle with battle-tested oracle infrastructure
   - Add staleness checks (reject rates older than N seconds)
   - Support multiple oracle sources with median pricing

8. **Implement yield-bearing vault strategies**
   - Integrate with Kamino or Jupiter Lend for automated yield on idle USX
   - Auto-compound yields into vault deposits
   - Risk-tiered strategies (conservative/balanced/aggressive per vault)

9. **Build proper KYC/AML integration**
   - Integrate with on-chain identity protocols (e.g., Civic, Quadrata)
   - Replace the raw KYC hash with verifiable credentials
   - Add sanctions screening for counterparties

10. **Add `reactivate_agent` instruction** with admin governance

### Phase 3: AI Agent Differentiation (Week 3-4)

11. **Integrate Solana Agent Kit (SendAI)**
    - Use pre-built actions for token operations, DeFi interactions
    - Enable the agent to discover and interact with new protocols autonomously
    - Add tool-use capabilities to Claude prompts for structured on-chain actions

12. **Implement multi-step reasoning with tool use**
    - Switch from single-shot Claude API calls to agentic tool-use loops
    - Give Claude tools: `get_vault_positions`, `get_market_data`, `simulate_rebalance`, `execute_transaction`
    - Let the agent reason through multi-step strategies before acting

13. **Add ZK-ML verified risk assessments**
    - Hash and verify AI risk scores on-chain using ZK proofs
    - Enable third-party auditors to verify risk model outputs without seeing model weights
    - Publish verifiable risk attestations

14. **Implement agent-to-agent settlement**
    - Allow Conduit agents at different institutions to negotiate settlement terms
    - Automated bilateral netting across institutional boundaries
    - Agent reputation scoring based on on-chain history

### Phase 4: Platform & Growth (Week 4+)

15. **Build a real-time WebSocket dashboard**
    - Replace polling with Solana account subscriptions
    - Live transaction feed with AI reasoning explanations
    - Interactive vault management (deposit/withdraw/policy changes from UI)
    - Mobile-responsive design for on-the-go monitoring

16. **Add Arweave/IPFS integration for reasoning storage**
    - Store full AI reasoning text on permanent storage
    - Currently using `conduit://reasoning/` placeholder URIs
    - Enable full audit trail reconstruction from on-chain hashes

17. **Multi-vault portfolio optimization**
    - Cross-vault rebalancing (not just single-vault)
    - Portfolio-level risk metrics across all institutional vaults
    - Automated reserve management (maintain minimum balances)

18. **Add Jito MEV protection for settlement transactions**
    - Bundle settlement transactions to prevent front-running
    - Use Jito tip distribution for priority inclusion
    - Critical for large settlement batches

19. **Build a REST/GraphQL API layer**
    - Enable traditional fintech integrations
    - Webhook notifications for compliance events
    - API keys with rate limiting for institutional clients

20. **SDK improvements**
    - Generate TypeScript client from Anchor IDL automatically
    - Add proper error handling and retry logic
    - Publish to npm as `@conduit/sdk`

---

## Summary

**Bugs found:** 18 issues (6 critical security, 3 high logic bugs, 9 medium code quality)

**Market position:** Conduit sits at a unique intersection that no competitor fully covers:
- **Squads** does vaults + multisig but has no AI
- **Kamino/Jupiter** do yield but aren't institutional-grade
- **MeanFi** does corporate treasury but lacks AI agents
- **Fireblocks** is institutional but off-chain/custodial

**The opportunity:** Build the first **on-chain, AI-native, institutional treasury protocol** that combines Squads-grade vault security, Kamino-grade yield optimization, and Claude-powered autonomous decision-making — all with immutable on-chain audit trails. The market is clearly heading toward autonomous AI agents managing institutional capital on Solana, and Conduit is positioned to lead that wave.
