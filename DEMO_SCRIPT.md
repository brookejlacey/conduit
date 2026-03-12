# Conduit Protocol — StableHacks 2026 Demo Script (3 min)

---

## 0:00 - 0:30 | The Problem

"Every day, $150 trillion moves across borders. And it moves slowly.

Banks rely on SWIFT — a messaging system designed in the 1970s. A single cross-border payment takes 3 to 5 days, costs 3 to 5 percent in fees, and passes through up to 5 intermediary banks. At each hop, funds sit idle, fees stack up, and nobody has real-time visibility into where the money actually is.

Corporate treasurers are flying blind. They manage billions across dozens of accounts with spreadsheets, manual reconciliation, and phone calls to correspondent banks. This is broken."

---

## 0:30 - 1:00 | The Solution

"Conduit is AI-powered institutional treasury management on Solana.

An autonomous AI agent — powered by Claude — continuously analyzes treasury positions, rebalances across vaults, and settles cross-border payments in seconds, not days. Settlement happens in USX stablecoins with on-chain netting that eliminates redundant transfers.

Every single decision the agent makes is logged on-chain with a hash of its reasoning. Full auditability. No black boxes.

This is not a wallet. This is institutional infrastructure."

---

## 1:00 - 1:30 | Architecture

"Conduit is four Solana programs working together.

**Vault** holds funds with configurable policy limits and multisig approval thresholds. **Agent Registry** manages AI agent authorization — what each agent can do, how much it can move, and when it needs human approval. **Settlement** batches cross-border payments and nets them, so if Bank A owes Bank B $10M and Bank B owes Bank A $8M, only $2M moves on-chain. **Audit Log** records every agent action with an on-chain hash of the AI's reasoning.

On top of that: a TypeScript SDK, a Claude-powered autonomous agent, and a real-time institutional dashboard. All open source."

[ACTION] Show architecture diagram if available, or briefly gesture at the four-program structure.

---

## 1:30 - 2:30 | Live Demo

[ACTION] Open the Conduit dashboard.

"Here is the institutional dashboard. The overview shows total AUM, active agents, vault count, and recent activity — everything a treasury team needs at a glance."

[ACTION] Point out the AUM figure, agent count, and vault count on the overview page.

"Let me click into a vault."

[ACTION] Click into a vault detail view.

"Each vault has configurable policy: daily transfer limits, per-transaction caps, and multisig thresholds. You can see the signers and how many approvals are required for large transfers. The agent operates within these guardrails autonomously — anything above the threshold requires human sign-off."

[ACTION] Navigate to the agent view.

"Here is the AI agent's decision timeline. Each entry shows what the agent decided, when, and why. The reasoning hash links back to the full audit trail on-chain."

[ACTION] Navigate to the settlement view.

"This is where it gets interesting. Settlement batching with netting. Instead of executing every payment individually, Conduit nets obligations across counterparties. In this batch, netting efficiency is over 30 percent — meaning 30 percent fewer on-chain transactions, lower fees, faster finality."

[ACTION] Show the netting efficiency metric.

[ACTION] Navigate to the risk dashboard.

"The risk dashboard shows exposure by counterparty, concentration risk, and policy compliance. Real-time, not end-of-day."

[ACTION] Navigate to the audit log.

"And the audit log. Every agent action, on-chain, with the reasoning hash. Click any entry to see the full decision context. This is how you build institutional trust in autonomous systems."

---

## 2:30 - 3:00 | Why Now / Ask

"Why does this work now? Two things came together.

First, Solana. Sub-second finality, negligible fees, and the throughput to handle institutional volumes. You cannot do real-time treasury management on a chain that takes 12 seconds per block.

Second, AI reasoning. Claude can analyze complex treasury positions, weigh tradeoffs, and make decisions that would take a human analyst hours — and it can explain its reasoning in plain language, hashed and stored on-chain for compliance.

Solana's speed plus AI reasoning equals institutional-grade infrastructure. The total addressable market is $150 trillion in daily cross-border flows. Conduit was built by one person in one day. It is fully open source.

We are looking for protocol partnerships, pilot customers in the institutional stablecoin space, and feedback from the Solana ecosystem. Thank you."

---

## Notes

- Total runtime target: 3 minutes sharp.
- Rehearse transitions between dashboard views to keep them under 3 seconds each.
- If the dashboard is not live, use screenshots with clear annotations.
- Speak in short declarative sentences. No filler words.
