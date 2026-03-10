use anchor_lang::prelude::*;
use crate::state::Institution;
use crate::errors::RegistryError;

#[derive(Accounts)]
#[instruction(name: [u8; 32])]
pub struct RegisterInstitution<'info> {
    #[account(
        init,
        payer = admin,
        space = Institution::SPACE,
        seeds = [b"institution", admin.key().as_ref()],
        bump,
    )]
    pub institution: Account<'info, Institution>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterInstitution>,
    name: [u8; 32],
    kyc_hash: [u8; 32],
) -> Result<()> {
    let zero_hash = [0u8; 32];
    require!(kyc_hash != zero_hash, RegistryError::KycRequired);

    let institution = &mut ctx.accounts.institution;
    institution.name = name;
    institution.admin = ctx.accounts.admin.key();
    institution.kyc_hash = kyc_hash;
    institution.agent_count = 0;
    institution.active = true;
    institution.bump = ctx.bumps.institution;

    msg!("Institution registered: {}", ctx.accounts.admin.key());
    Ok(())
}
