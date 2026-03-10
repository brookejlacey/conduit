use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{DepositReceipt, Vault};
use crate::errors::VaultError;

#[derive(Accounts)]
#[instruction(amount: u64, kyc_hash: [u8; 32])]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = depositor,
        space = DepositReceipt::SPACE,
        seeds = [b"deposit", vault.key().as_ref(), depositor.key().as_ref(), &vault.total_deposits.to_le_bytes()],
        bump,
    )]
    pub deposit_receipt: Account<'info, DepositReceipt>,

    /// The depositor's USX token account (source)
    #[account(
        mut,
        constraint = depositor_token_account.owner == depositor.key() @ VaultError::Unauthorized,
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,

    /// The vault's USX token account (destination)
    #[account(
        mut,
        constraint = vault_token_account.key() == vault.usx_token_account @ VaultError::Unauthorized,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Deposit>, amount: u64, kyc_hash: [u8; 32]) -> Result<()> {
    require!(amount > 0, VaultError::InvalidAmount);

    // Verify KYC hash is non-zero (depositor must have KYC)
    let zero_hash = [0u8; 32];
    require!(kyc_hash != zero_hash, VaultError::KycRequired);

    // Transfer USX from depositor to vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Create deposit receipt
    let receipt = &mut ctx.accounts.deposit_receipt;
    receipt.vault = ctx.accounts.vault.key();
    receipt.depositor = ctx.accounts.depositor.key();
    receipt.amount = amount;
    receipt.timestamp = Clock::get()?.unix_timestamp;
    receipt.kyc_hash = kyc_hash;
    receipt.bump = ctx.bumps.deposit_receipt;

    // Update vault totals
    let vault = &mut ctx.accounts.vault;
    vault.total_deposits = vault
        .total_deposits
        .checked_add(amount)
        .ok_or(VaultError::Overflow)?;

    msg!("Deposited {} USX into vault {}", amount, vault.key());
    Ok(())
}
