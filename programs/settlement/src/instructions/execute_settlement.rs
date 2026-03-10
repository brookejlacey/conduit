use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{SettlementBatch, SettlementStatus};
use crate::errors::SettlementError;

#[derive(Accounts)]
pub struct ExecuteSettlement<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch.creator.as_ref(), &batch.id.to_le_bytes()],
        bump = batch.bump,
        constraint = batch.status == SettlementStatus::Open @ SettlementError::BatchNotOpen,
    )]
    pub batch: Account<'info, SettlementBatch>,

    /// Source USX token account — must be owned by the batch creator
    #[account(
        mut,
        constraint = from_token_account.owner == creator.key() @ SettlementError::Unauthorized,
    )]
    pub from_token_account: Account<'info, TokenAccount>,

    /// Destination USX token account
    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,

    #[account(
        constraint = creator.key() == batch.creator @ SettlementError::Unauthorized,
    )]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ExecuteSettlement>) -> Result<()> {
    let batch = &mut ctx.accounts.batch;

    require!(batch.entry_count > 0, SettlementError::EmptyBatch);

    // Mark batch as processing
    batch.status = SettlementStatus::Processing;

    // Execute the net settlement transfer
    let net_amount = batch.total_net;

    if net_amount > 0 {
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from_token_account.to_account_info(),
                to: ctx.accounts.to_token_account.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, net_amount)?;
    }

    // Mark as settled
    batch.status = SettlementStatus::Settled;
    batch.settled_at = Clock::get()?.unix_timestamp;

    msg!(
        "Settlement batch {} executed. Gross: {}, Net: {}",
        batch.id,
        batch.total_gross,
        batch.total_net
    );
    Ok(())
}
