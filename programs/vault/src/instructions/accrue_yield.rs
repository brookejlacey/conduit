use anchor_lang::prelude::*;
use crate::state::Vault;
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct AccrueYield<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump,
        has_one = authority @ VaultError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,

    /// Only the vault authority can crank yield accrual
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<AccrueYield>, yield_amount: u64) -> Result<()> {
    require!(yield_amount > 0, VaultError::InvalidAmount);

    let vault = &mut ctx.accounts.vault;
    vault.yield_accrued = vault
        .yield_accrued
        .checked_add(yield_amount)
        .ok_or(VaultError::Overflow)?;

    msg!(
        "Accrued {} USX yield for vault {}. Total yield: {}",
        yield_amount,
        vault.key(),
        vault.yield_accrued
    );
    Ok(())
}
