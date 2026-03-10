use anchor_lang::prelude::*;
use crate::state::SettlementConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = SettlementConfig::SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, SettlementConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeConfig>, max_fx_rate_age: i64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.max_fx_rate_age = if max_fx_rate_age > 0 { max_fx_rate_age } else { 3600 };
    config.bump = ctx.bumps.config;

    msg!("Settlement config initialized with admin: {}", config.admin);
    Ok(())
}
