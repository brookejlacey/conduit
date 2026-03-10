use anchor_lang::prelude::*;
use crate::state::{AgentIdentity, Institution};
use crate::errors::RegistryError;

#[derive(Accounts)]
#[instruction(authority_tier: u8, scoped_programs: Vec<Pubkey>)]
pub struct RegisterAgent<'info> {
    #[account(
        mut,
        seeds = [b"institution", institution.admin.as_ref()],
        bump = institution.bump,
        has_one = admin @ RegistryError::Unauthorized,
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        init,
        payer = admin,
        space = AgentIdentity::space(scoped_programs.len()),
        seeds = [b"agent", institution.key().as_ref(), agent_pubkey.key().as_ref()],
        bump,
    )]
    pub agent: Account<'info, AgentIdentity>,

    /// The pubkey that this agent identity will be bound to
    /// CHECK: This is the agent's public key, validated by seed derivation
    pub agent_pubkey: UncheckedAccount<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterAgent>,
    authority_tier: u8,
    scoped_programs: Vec<Pubkey>,
) -> Result<()> {
    require!(authority_tier <= 3, RegistryError::InvalidTier);
    require!(
        scoped_programs.len() <= AgentIdentity::MAX_SCOPED_PROGRAMS,
        RegistryError::TooManyScopedPrograms
    );

    // Capture keys before taking mutable borrows
    let institution_key = ctx.accounts.institution.key();
    let agent_pubkey_key = ctx.accounts.agent_pubkey.key();

    require!(ctx.accounts.institution.active, RegistryError::InstitutionInactive);

    let clock = Clock::get()?;

    let agent = &mut ctx.accounts.agent;
    agent.institution = institution_key;
    agent.agent_pubkey = agent_pubkey_key;
    agent.authority_tier = authority_tier;
    agent.scoped_programs = scoped_programs;
    agent.active = true;
    agent.registered_at = clock.unix_timestamp;
    agent.last_action_at = clock.unix_timestamp;
    agent.bump = ctx.bumps.agent;

    let institution = &mut ctx.accounts.institution;
    institution.agent_count = institution
        .agent_count
        .checked_add(1)
        .ok_or(RegistryError::Overflow)?;

    msg!(
        "Agent {} registered under institution {} with tier {}",
        agent_pubkey_key,
        institution_key,
        authority_tier
    );
    Ok(())
}
