use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("ATyFG3Bc481rrNCWa7pBHvSVgY1tc6nW8mTC2pcm6kqT");

#[program]
pub mod audit_log {
    use super::*;

    pub fn log_event(
        ctx: Context<LogEvent>,
        action_type: u8,
        target_vault: Option<Pubkey>,
        amount: Option<u64>,
        reasoning_hash: [u8; 32],
        reasoning_uri: [u8; 64],
        nonce: u64,
    ) -> Result<()> {
        instructions::log_event::handler(
            ctx,
            action_type,
            target_vault,
            amount,
            reasoning_hash,
            reasoning_uri,
            nonce,
        )
    }
}
