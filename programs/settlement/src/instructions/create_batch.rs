use anchor_lang::prelude::*;
use crate::state::{SettlementBatch, SettlementStatus};

#[derive(Accounts)]
#[instruction(batch_id: u64)]
pub struct CreateBatch<'info> {
    #[account(
        init,
        payer = creator,
        space = SettlementBatch::SPACE,
        seeds = [b"batch", creator.key().as_ref(), &batch_id.to_le_bytes()],
        bump,
    )]
    pub batch: Account<'info, SettlementBatch>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateBatch>, batch_id: u64) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;

    batch.id = batch_id;
    batch.creator = ctx.accounts.creator.key();
    batch.status = SettlementStatus::Open;
    batch.entry_count = 0;
    batch.total_gross = 0;
    batch.total_net = 0;
    batch.created_at = clock.unix_timestamp;
    batch.settled_at = 0;
    batch.bump = ctx.bumps.batch;

    msg!("Settlement batch {} created", batch_id);
    Ok(())
}
