use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::{PolicyConfig, Vault};
use crate::errors::VaultError;

#[derive(Accounts)]
#[instruction(
    policy: PolicyConfig,
    multisig_signers: Vec<Pubkey>,
)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = Vault::space(multisig_signers.len(), policy.approved_counterparties.len()),
        seeds = [b"vault", authority.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    /// The USX token account owned by the vault PDA
    #[account(
        constraint = usx_token_account.owner == vault.key() @ VaultError::Unauthorized,
    )]
    pub usx_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeVault>,
    policy: PolicyConfig,
    multisig_signers: Vec<Pubkey>,
    multisig_threshold: u8,
    institution: Pubkey,
) -> Result<()> {
    require!(
        multisig_signers.len() <= Vault::MAX_SIGNERS,
        VaultError::TooManySigners
    );
    require!(
        multisig_threshold as usize <= multisig_signers.len() && multisig_threshold > 0,
        VaultError::InvalidThreshold
    );
    require!(
        policy.approved_counterparties.len() <= PolicyConfig::MAX_COUNTERPARTIES,
        VaultError::TooManyCounterparties
    );

    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.usx_token_account = ctx.accounts.usx_token_account.key();
    vault.total_deposits = 0;
    vault.yield_accrued = 0;
    vault.policy = policy;
    vault.multisig_signers = multisig_signers;
    vault.multisig_threshold = multisig_threshold;
    vault.institution = institution;
    vault.bump = ctx.bumps.vault;

    msg!("Vault initialized for authority: {}", vault.authority);
    Ok(())
}
