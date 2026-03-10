use anchor_lang::prelude::*;

#[account]
pub struct SettlementConfig {
    /// Admin authority for the settlement program
    pub admin: Pubkey,
    /// Maximum age for FX rates in seconds (default: 3600 = 1 hour)
    pub max_fx_rate_age: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl SettlementConfig {
    pub const SPACE: usize = 8  // discriminator
        + 32 // admin
        + 8  // max_fx_rate_age
        + 1; // bump
}
