use anchor_lang::prelude::*;

#[account]
pub struct DepositReceipt {
    /// The vault this deposit belongs to
    pub vault: Pubkey,
    /// The depositor's public key
    pub depositor: Pubkey,
    /// Amount deposited in USX lamports
    pub amount: u64,
    /// Unix timestamp of deposit
    pub timestamp: i64,
    /// KYC verification hash (SHA-256 of KYC data)
    pub kyc_hash: [u8; 32],
    /// PDA bump seed
    pub bump: u8,
}

impl DepositReceipt {
    pub const SPACE: usize = 8  // discriminator
        + 32 // vault
        + 32 // depositor
        + 8  // amount
        + 8  // timestamp
        + 32 // kyc_hash
        + 1; // bump
}
