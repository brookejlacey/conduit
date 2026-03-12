use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DQj9jfTNEaMCrUD8DfAiRkcmMiragBYv33Qh27ZiZuYU");

#[program]
pub mod settlement {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, max_fx_rate_age: i64) -> Result<()> {
        instructions::initialize_config::handler(ctx, max_fx_rate_age)
    }

    pub fn create_batch(ctx: Context<CreateBatch>, batch_id: u64) -> Result<()> {
        instructions::create_batch::handler(ctx, batch_id)
    }

    pub fn add_entry(
        ctx: Context<AddEntry>,
        amount_usx: u64,
        destination_currency: [u8; 3],
        fx_rate: u64,
    ) -> Result<()> {
        instructions::add_entry::handler(ctx, amount_usx, destination_currency, fx_rate)
    }

    pub fn execute_settlement(ctx: Context<ExecuteSettlement>) -> Result<()> {
        instructions::execute_settlement::handler(ctx)
    }

    pub fn update_fx_rate(
        ctx: Context<UpdateFxRate>,
        pair: [u8; 6],
        rate: u64,
    ) -> Result<()> {
        instructions::update_fx_rate::handler(ctx, pair, rate)
    }
}
