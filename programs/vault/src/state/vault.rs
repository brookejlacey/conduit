use anchor_lang::prelude::*;
use super::PolicyConfig;

#[account]
pub struct Vault {
    /// Authority that created and controls this vault
    pub authority: Pubkey,
    /// USX SPL token account owned by the vault PDA
    pub usx_token_account: Pubkey,
    /// Total deposits tracked in USX lamports
    pub total_deposits: u64,
    /// Yield accrued (in USX lamports)
    pub yield_accrued: u64,
    /// Embedded policy configuration
    pub policy: PolicyConfig,
    /// Multisig signer pubkeys (max 5)
    pub multisig_signers: Vec<Pubkey>,
    /// Minimum number of signers required for policy changes
    pub multisig_threshold: u8,
    /// Institution this vault belongs to
    pub institution: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl Vault {
    pub const MAX_SIGNERS: usize = 5;

    pub fn space(num_signers: usize, num_counterparties: usize) -> usize {
        8  // discriminator
        + 32 // authority
        + 32 // usx_token_account
        + 8  // total_deposits
        + 8  // yield_accrued
        + PolicyConfig::space(num_counterparties) // policy
        + 4 + (32 * num_signers) // multisig_signers
        + 1  // multisig_threshold
        + 32 // institution
        + 1  // bump
    }
}
