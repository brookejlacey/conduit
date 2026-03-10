use anchor_lang::prelude::*;
use crate::state::{AgentIdentity, Institution};
use crate::errors::RegistryError;

#[derive(Accounts)]
pub struct DeactivateAgent<'info> {
    #[account(
        seeds = [b"institution", institution.admin.as_ref()],
        bump = institution.bump,
        has_one = admin @ RegistryError::Unauthorized,
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        mut,
        seeds = [b"agent", institution.key().as_ref(), agent.agent_pubkey.as_ref()],
        bump = agent.bump,
        constraint = agent.institution == institution.key() @ RegistryError::AgentNotInInstitution,
    )]
    pub agent: Account<'info, AgentIdentity>,

    pub admin: Signer<'info>,
}

pub fn handler(ctx: Context<DeactivateAgent>) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    require!(agent.active, RegistryError::AgentInactive);

    agent.active = false;
    agent.last_action_at = Clock::get()?.unix_timestamp;

    msg!("Agent {} deactivated (kill switch)", agent.agent_pubkey);
    Ok(())
}
