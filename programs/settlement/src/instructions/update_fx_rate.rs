use anchor_lang::prelude::*;
use crate::state::FxRate;
use crate::errors::SettlementError;

#[derive(Accounts)]
#[instruction(pair: [u8; 6])]
pub struct UpdateFxRate<'info> {
    #[account(
        init_if_needed,
        payer = oracle,
        space = FxRate::SPACE,
        seeds = [b"fx_rate", &pair],
        bump,
    )]
    pub fx_rate: Account<'info, FxRate>,

    #[account(mut)]
    pub oracle: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateFxRate>, pair: [u8; 6], rate: u64) -> Result<()> {
    require!(rate > 0, SettlementError::InvalidFxRate);

    let fx_rate = &mut ctx.accounts.fx_rate;

    // If this is an existing rate, verify the oracle matches
    if fx_rate.oracle != Pubkey::default() && fx_rate.oracle != ctx.accounts.oracle.key() {
        return Err(SettlementError::Unauthorized.into());
    }

    fx_rate.pair = pair;
    fx_rate.rate = rate;
    fx_rate.updated_at = Clock::get()?.unix_timestamp;
    fx_rate.oracle = ctx.accounts.oracle.key();
    fx_rate.bump = ctx.bumps.fx_rate;

    msg!(
        "FX rate updated: {:?} = {} (scaled 1e8)",
        pair,
        rate
    );
    Ok(())
}
