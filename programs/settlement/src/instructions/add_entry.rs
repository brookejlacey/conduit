use anchor_lang::prelude::*;
use crate::state::{SettlementBatch, SettlementEntry, SettlementStatus};
use crate::errors::SettlementError;

#[derive(Accounts)]
pub struct AddEntry<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch.creator.as_ref(), &batch.id.to_le_bytes()],
        bump = batch.bump,
        constraint = batch.status == SettlementStatus::Open @ SettlementError::BatchNotOpen,
    )]
    pub batch: Account<'info, SettlementBatch>,

    #[account(
        init,
        payer = creator,
        space = SettlementEntry::SPACE,
        seeds = [
            b"entry",
            batch.key().as_ref(),
            &batch.entry_count.to_le_bytes(),
        ],
        bump,
    )]
    pub entry: Account<'info, SettlementEntry>,

    /// CHECK: Validated as an existing vault account by the caller
    pub from_vault: UncheckedAccount<'info>,

    /// CHECK: Validated as an existing vault account by the caller
    pub to_vault: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = creator.key() == batch.creator @ SettlementError::Unauthorized,
    )]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddEntry>,
    amount_usx: u64,
    destination_currency: [u8; 3],
    fx_rate: u64,
    net_offset: i64,
) -> Result<()> {
    require!(amount_usx > 0, SettlementError::InvalidAmount);
    require!(fx_rate > 0, SettlementError::InvalidFxRate);

    let entry = &mut ctx.accounts.entry;
    entry.batch = ctx.accounts.batch.key();
    entry.from_vault = ctx.accounts.from_vault.key();
    entry.to_vault = ctx.accounts.to_vault.key();
    entry.amount_usx = amount_usx;
    entry.destination_currency = destination_currency;
    entry.fx_rate = fx_rate;
    entry.net_offset = net_offset;
    entry.bump = ctx.bumps.entry;

    let batch = &mut ctx.accounts.batch;
    batch.entry_count = batch
        .entry_count
        .checked_add(1)
        .ok_or(SettlementError::Overflow)?;
    batch.total_gross = batch
        .total_gross
        .checked_add(amount_usx)
        .ok_or(SettlementError::Overflow)?;

    // Update net total (handle signed offset)
    if net_offset >= 0 {
        batch.total_net = batch
            .total_net
            .checked_add(net_offset as u64)
            .ok_or(SettlementError::Overflow)?;
    } else {
        let abs_offset = net_offset.unsigned_abs();
        batch.total_net = batch.total_net.saturating_sub(abs_offset);
    }

    msg!(
        "Entry added to batch {}: {} USX from {} to {}",
        batch.id,
        amount_usx,
        entry.from_vault,
        entry.to_vault,
    );
    Ok(())
}
