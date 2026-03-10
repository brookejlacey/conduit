use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("2bm9F6XrH3NoTKUQgSM5uP5edKtGpcau9pHK6QiPUz5v");

#[program]
pub mod agent_registry {
    use super::*;

    pub fn register_institution(
        ctx: Context<RegisterInstitution>,
        name: [u8; 32],
        kyc_hash: [u8; 32],
    ) -> Result<()> {
        instructions::register_institution::handler(ctx, name, kyc_hash)
    }

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        authority_tier: u8,
        scoped_programs: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::register_agent::handler(ctx, authority_tier, scoped_programs)
    }

    pub fn update_agent_tier(ctx: Context<UpdateAgentTier>, new_tier: u8) -> Result<()> {
        instructions::update_agent_tier::handler(ctx, new_tier)
    }

    pub fn deactivate_agent(ctx: Context<DeactivateAgent>) -> Result<()> {
        instructions::deactivate_agent::handler(ctx)
    }
}
