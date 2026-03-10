use anchor_lang::prelude::*;
use crate::state::{SettlementBatch, SettlementEntry, SettlementStatus};
use crate::errors::SettlementError;

/// Vault program ID for ownership validation
const VAULT_PROGRAM_ID: Pubkey = pubkey!("GdmDuzHbXd2hytSpPyfwnaARSCTnntbTnniAPLr3JRHb");

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

    /// Source vault — must be owned by the vault program
    /// CHECK: Validated by owner check against vault program ID
    #[account(
        constraint = from_vault.owner == &VAULT_PROGRAM_ID @ SettlementError::InvalidVault,
    )]
    pub from_vault: UncheckedAccount<'info>,

    /// Destination vault — must be owned by the vault program
    /// CHECK: Validated by owner check against vault program ID
    #[account(
        constraint = to_vault.owner == &VAULT_PROGRAM_ID @ SettlementError::InvalidVault,
    )]
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
) -> Result<()> {
    require!(amount_usx > 0, SettlementError::InvalidAmount);
    require!(fx_rate > 0, SettlementError::InvalidFxRate);

    // Compute net_offset on-chain from amount and FX rate (scaled by 1e8)
    let net_offset_raw = (amount_usx as u128)
        .checked_mul(fx_rate as u128)
        .ok_or(SettlementError::Overflow)?
        / 100_000_000u128;
    let net_offset = i64::try_from(net_offset_raw)
        .map_err(|_| error!(SettlementError::Overflow))?;

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

    // Update net total using on-chain computed offset
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
