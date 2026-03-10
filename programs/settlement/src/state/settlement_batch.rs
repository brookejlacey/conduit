use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum SettlementStatus {
    Open,
    Processing,
    Settled,
    Failed,
}

impl Default for SettlementStatus {
    fn default() -> Self {
        SettlementStatus::Open
    }
}

#[account]
pub struct SettlementBatch {
    /// Unique batch identifier
    pub id: u64,
    /// Creator of the batch
    pub creator: Pubkey,
    /// Current status
    pub status: SettlementStatus,
    /// Number of entries in this batch
    pub entry_count: u32,
    /// Total gross amount (sum of all entry amounts in USX)
    pub total_gross: u64,
    /// Total net amount after offsets
    pub total_net: u64,
    /// Batch creation timestamp
    pub created_at: i64,
    /// Timestamp when settlement was executed
    pub settled_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl SettlementBatch {
    pub const SPACE: usize = 8  // discriminator
        + 8  // id
        + 32 // creator
        + 1  // status (enum)
        + 4  // entry_count
        + 8  // total_gross
        + 8  // total_net
        + 8  // created_at
        + 8  // settled_at
        + 1; // bump
}
