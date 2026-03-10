use anchor_lang::prelude::*;
use crate::state::{PolicyConfig, Vault};
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    /// One of the multisig signers
    pub signer: Signer<'info>,
}

pub fn handler(ctx: Context<UpdatePolicy>, new_policy: PolicyConfig) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    // Verify the primary signer is one of the multisig signers
    let signer_key = ctx.accounts.signer.key();
    let is_valid_signer = vault.multisig_signers.contains(&signer_key);
    require!(is_valid_signer, VaultError::Unauthorized);

    require!(
        new_policy.approved_counterparties.len() <= PolicyConfig::MAX_COUNTERPARTIES,
        VaultError::TooManyCounterparties
    );

    require!(
        new_policy.approved_counterparties.len() <= vault.policy.approved_counterparties.len(),
        VaultError::TooManyCounterparties
    );

    // Count valid signers: primary signer + any additional signers in remaining_accounts
    let mut signer_count: u8 = 1; // The primary signer already validated above
    for account in ctx.remaining_accounts.iter() {
        if account.is_signer && vault.multisig_signers.contains(account.key) {
            // Don't double-count the primary signer
            if *account.key != signer_key {
                signer_count = signer_count.saturating_add(1);
            }
        }
    }

    require!(
        signer_count >= vault.multisig_threshold,
        VaultError::MultisigThresholdNotMet
    );

    // Preserve daily tracking state when updating policy
    let mut policy = new_policy;
    policy.daily_spent = vault.policy.daily_spent;
    policy.last_reset_ts = vault.policy.last_reset_ts;

    vault.policy = policy;

    msg!("Policy updated for vault {}", vault.key());
    Ok(())
}
