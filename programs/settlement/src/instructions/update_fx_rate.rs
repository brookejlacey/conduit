use anchor_lang::prelude::*;
use crate::state::{FxRate, SettlementConfig};
use crate::errors::SettlementError;

#[derive(Accounts)]
#[instruction(pair: [u8; 6])]
pub struct UpdateFxRate<'info> {
    #[account(
        init_if_needed,
        payer = oracle,
        space = FxRate::SPACE,
        seeds = [b"fx_rate" as &[u8], pair.as_ref()],
        bump,
    )]
    pub fx_rate: Account<'info, FxRate>,

    /// Settlement config with admin authority
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, SettlementConfig>,

    #[account(mut)]
    pub oracle: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateFxRate>, pair: [u8; 6], rate: u64) -> Result<()> {
    require!(rate > 0, SettlementError::InvalidFxRate);

    let fx_rate = &mut ctx.accounts.fx_rate;
    let config = &ctx.accounts.config;

    // If this is a new rate (oracle is default), require the oracle to be the admin
    // This prevents front-running of FX pair claims
    if fx_rate.oracle == Pubkey::default() {
        require!(
            ctx.accounts.oracle.key() == config.admin,
            SettlementError::AdminRequired
        );
    } else {
        // For existing rates, verify the oracle matches
        require!(
            fx_rate.oracle == ctx.accounts.oracle.key(),
            SettlementError::Unauthorized
        );
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
