use anchor_lang::prelude::*;

#[account]
pub struct FxRate {
    /// Currency pair (e.g., b"USDEUR" for USD/EUR)
    pub pair: [u8; 6],
    /// Exchange rate (scaled by 1e8 for precision, e.g., 92000000 = 0.92)
    pub rate: u64,
    /// Last update timestamp
    pub updated_at: i64,
    /// Oracle authority that can update rates
    pub oracle: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl FxRate {
    pub const SPACE: usize = 8  // discriminator
        + 6  // pair
        + 8  // rate
        + 8  // updated_at
        + 32 // oracle
        + 1; // bump
}
