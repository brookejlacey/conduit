use anchor_lang::prelude::*;

#[account]
pub struct SettlementEntry {
    /// The batch this entry belongs to
    pub batch: Pubkey,
    /// Source vault
    pub from_vault: Pubkey,
    /// Destination vault
    pub to_vault: Pubkey,
    /// Amount in USX lamports
    pub amount_usx: u64,
    /// Destination currency ISO code (e.g., b"USD", b"EUR", b"GBP")
    pub destination_currency: [u8; 3],
    /// FX rate (scaled by 1e8 for precision)
    pub fx_rate: u64,
    /// Net offset after netting (can be negative for net receivers)
    pub net_offset: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl SettlementEntry {
    pub const SPACE: usize = 8  // discriminator
        + 32 // batch
        + 32 // from_vault
        + 32 // to_vault
        + 8  // amount_usx
        + 3  // destination_currency
        + 8  // fx_rate
        + 8  // net_offset
        + 1; // bump
}
