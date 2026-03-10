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

    // Verify the signer is one of the multisig signers
    let signer_key = ctx.accounts.signer.key();
    let is_valid_signer = vault.multisig_signers.contains(&signer_key);
    require!(is_valid_signer, VaultError::Unauthorized);

    require!(
        new_policy.approved_counterparties.len() <= PolicyConfig::MAX_COUNTERPARTIES,
        VaultError::TooManyCounterparties
    );

    // Ensure new policy doesn't exceed the space allocated for this vault account.
    // The vault was allocated with space for the original number of counterparties,
    // so the new policy cannot have more counterparties than what was originally allocated.
    require!(
        new_policy.approved_counterparties.len() <= vault.policy.approved_counterparties.len(),
        VaultError::TooManyCounterparties
    );

    // For hackathon simplicity, we accept a single multisig signer
    // In production, this would collect signatures and verify threshold
    // The threshold check is simplified: authority or any signer can update
    require!(
        vault.multisig_threshold <= 1
            || signer_key == vault.authority,
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
