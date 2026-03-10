use anchor_lang::prelude::*;

#[account]
pub struct AuditEntry {
    /// The agent that performed the action
    pub agent: Pubkey,
    /// The institution the agent belongs to
    pub institution: Pubkey,
    /// Type of action performed
    /// 0=deposit, 1=withdraw, 2=rebalance, 3=settlement, 4=policy_update, 5=yield_accrual
    pub action_type: u8,
    /// Target vault (if applicable)
    pub target_vault: Option<Pubkey>,
    /// Amount involved (if applicable)
    pub amount: Option<u64>,
    /// SHA-256 hash of the AI reasoning that led to this action
    pub reasoning_hash: [u8; 32],
    /// URI to the full reasoning (e.g., IPFS or Arweave link, padded)
    pub reasoning_uri: [u8; 64],
    /// Unix timestamp of the event
    pub timestamp: i64,
    /// Solana slot when the event was recorded
    pub slot: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl AuditEntry {
    pub const SPACE: usize = 8   // discriminator
        + 32  // agent
        + 32  // institution
        + 1   // action_type
        + 1 + 32 // target_vault (Option<Pubkey>)
        + 1 + 8  // amount (Option<u64>)
        + 32  // reasoning_hash
        + 64  // reasoning_uri
        + 8   // timestamp
        + 8   // slot
        + 1;  // bump
}
