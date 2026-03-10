use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
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

    /// Source token account providing the yield (owned by authority)
    #[account(
        mut,
        constraint = yield_source_token_account.owner == authority.key() @ VaultError::Unauthorized,
    )]
    pub yield_source_token_account: Account<'info, TokenAccount>,

    /// The vault's USX token account (destination for yield)
    #[account(
        mut,
        constraint = vault_token_account.key() == vault.usx_token_account @ VaultError::Unauthorized,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Only the vault authority can crank yield accrual
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<AccrueYield>, yield_amount: u64) -> Result<()> {
    require!(yield_amount > 0, VaultError::InvalidAmount);

    // Transfer actual tokens to back the yield accrual
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.yield_source_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, yield_amount)?;

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
