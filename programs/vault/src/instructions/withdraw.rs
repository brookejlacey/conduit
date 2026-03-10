use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::Vault;
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump,
        has_one = authority @ VaultError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,

    /// The vault's USX token account (source)
    #[account(
        mut,
        constraint = vault_token_account.key() == vault.usx_token_account @ VaultError::Unauthorized,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// The destination USX token account
    #[account(mut)]
    pub destination_token_account: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<Withdraw>,
    amount: u64,
    tx_type: u8,
    counterparty: Pubkey,
) -> Result<()> {
    require!(amount > 0, VaultError::InvalidAmount);

    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Policy check: transaction type allowed
    require!(
        vault.policy.is_tx_type_allowed(tx_type),
        VaultError::TxTypeForbidden
    );

    // Policy check: max single transaction size
    require!(
        amount <= vault.policy.max_single_tx_size,
        VaultError::PolicyViolation
    );

    // Policy check: counterparty approved
    require!(
        vault.policy.is_counterparty_approved(&counterparty),
        VaultError::CounterpartyNotApproved
    );

    // Policy check: daily limit
    let seconds_per_day: i64 = 86400;
    if now - vault.policy.last_reset_ts >= seconds_per_day {
        vault.policy.daily_spent = 0;
        vault.policy.last_reset_ts = now;
    }
    require!(
        vault.policy.check_daily_limit(amount, now),
        VaultError::DailyLimitExceeded
    );

    // Update daily spent
    vault.policy.daily_spent = vault
        .policy
        .daily_spent
        .checked_add(amount)
        .ok_or(VaultError::Overflow)?;

    // Update vault totals
    vault.total_deposits = vault
        .total_deposits
        .checked_sub(amount)
        .ok_or(VaultError::InsufficientFunds)?;

    // Transfer USX from vault to destination using PDA signer seeds
    let authority_key = vault.authority;
    let bump = vault.bump;
    let seeds = &[b"vault" as &[u8], authority_key.as_ref(), &[bump]];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.destination_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    msg!("Withdrew {} USX from vault", amount);
    Ok(())
}
