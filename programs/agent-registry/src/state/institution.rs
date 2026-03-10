use anchor_lang::prelude::*;

#[account]
pub struct Institution {
    /// Institution name (fixed-size byte array)
    pub name: [u8; 32],
    /// Admin authority for this institution
    pub admin: Pubkey,
    /// KYC verification hash
    pub kyc_hash: [u8; 32],
    /// Number of registered agents
    pub agent_count: u32,
    /// Whether the institution is active
    pub active: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl Institution {
    pub const SPACE: usize = 8  // discriminator
        + 32 // name
        + 32 // admin
        + 32 // kyc_hash
        + 4  // agent_count
        + 1  // active
        + 1; // bump
}
