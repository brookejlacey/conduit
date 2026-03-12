use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Ctd8BHaHPD7QUjk18SeRkaadpkR5dDF2opq4Cn6vGPii");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        policy: state::PolicyConfig,
        multisig_signers: Vec<Pubkey>,
        multisig_threshold: u8,
        institution: Pubkey,
    ) -> Result<()> {
        instructions::initialize_vault::handler(
            ctx,
            policy,
            multisig_signers,
            multisig_threshold,
            institution,
        )
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, kyc_hash: [u8; 32]) -> Result<()> {
        instructions::deposit::handler(ctx, amount, kyc_hash)
    }

    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
        tx_type: u8,
        counterparty: Pubkey,
    ) -> Result<()> {
        instructions::withdraw::handler(ctx, amount, tx_type, counterparty)
    }

    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        new_policy: state::PolicyConfig,
    ) -> Result<()> {
        instructions::update_policy::handler(ctx, new_policy)
    }

    pub fn accrue_yield(ctx: Context<AccrueYield>, yield_amount: u64) -> Result<()> {
        instructions::accrue_yield::handler(ctx, yield_amount)
    }
}
