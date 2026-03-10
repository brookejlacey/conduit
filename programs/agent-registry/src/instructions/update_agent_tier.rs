use anchor_lang::prelude::*;
use crate::state::{AgentIdentity, Institution};
use crate::errors::RegistryError;

#[derive(Accounts)]
pub struct UpdateAgentTier<'info> {
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

pub fn handler(ctx: Context<UpdateAgentTier>, new_tier: u8) -> Result<()> {
    require!(new_tier <= 3, RegistryError::InvalidTier);

    let agent = &mut ctx.accounts.agent;
    require!(agent.active, RegistryError::AgentInactive);

    let old_tier = agent.authority_tier;
    agent.authority_tier = new_tier;

    msg!(
        "Agent {} tier updated: {} -> {}",
        agent.agent_pubkey,
        old_tier,
        new_tier
    );
    Ok(())
}
