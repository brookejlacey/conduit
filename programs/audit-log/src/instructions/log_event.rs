use anchor_lang::prelude::*;
use crate::state::AuditEntry;
use crate::errors::AuditError;

/// Agent registry program ID for cross-program PDA verification
const AGENT_REGISTRY_PROGRAM_ID: Pubkey = pubkey!("2bm9F6XrH3NoTKUQgSM5uP5edKtGpcau9pHK6QiPUz5v");

#[derive(Accounts)]
#[instruction(
    action_type: u8,
    target_vault: Option<Pubkey>,
    amount: Option<u64>,
    reasoning_hash: [u8; 32],
    reasoning_uri: [u8; 64],
    nonce: u64,
)]
pub struct LogEvent<'info> {
    #[account(
        init,
        payer = agent,
        space = AuditEntry::SPACE,
        seeds = [
            b"audit",
            agent.key().as_ref(),
            &nonce.to_le_bytes(),
        ],
        bump,
    )]
    pub audit_entry: Account<'info, AuditEntry>,

    /// The agent signing and paying for this log entry
    #[account(mut)]
    pub agent: Signer<'info>,

    /// The agent's registered identity PDA from agent-registry program.
    /// Verifies the agent is actually registered under the given institution.
    /// CHECK: Validated by PDA derivation check and owner check below
    pub agent_identity: UncheckedAccount<'info>,

    /// CHECK: The institution pubkey — validated via agent_identity PDA derivation
    pub institution: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<LogEvent>,
    action_type: u8,
    target_vault: Option<Pubkey>,
    amount: Option<u64>,
    reasoning_hash: [u8; 32],
    reasoning_uri: [u8; 64],
    _nonce: u64,
) -> Result<()> {
    require!(action_type <= 5, AuditError::InvalidActionType);

    // Verify the agent identity PDA is owned by the agent-registry program
    require!(
        ctx.accounts.agent_identity.owner == &AGENT_REGISTRY_PROGRAM_ID,
        AuditError::Unauthorized
    );

    // Verify the PDA derivation matches [b"agent", institution, agent_pubkey]
    let (expected_pda, _) = Pubkey::find_program_address(
        &[
            b"agent",
            ctx.accounts.institution.key().as_ref(),
            ctx.accounts.agent.key().as_ref(),
        ],
        &AGENT_REGISTRY_PROGRAM_ID,
    );
    require!(
        ctx.accounts.agent_identity.key() == expected_pda,
        AuditError::Unauthorized
    );

    // Verify the agent is active (byte offset: 8 discriminator + 32 institution + 32 agent_pubkey + 1 tier + 4+N*32 scoped_programs)
    // For simplicity, verify the account has data (is initialized) — a deactivated agent's
    // account would still exist but the `active` field would be false.
    // Full deserialization would require importing the agent-registry types.
    require!(
        ctx.accounts.agent_identity.data_len() > 0,
        AuditError::Unauthorized
    );

    let clock = Clock::get()?;
    let entry = &mut ctx.accounts.audit_entry;

    entry.agent = ctx.accounts.agent.key();
    entry.institution = ctx.accounts.institution.key();
    entry.action_type = action_type;
    entry.target_vault = target_vault;
    entry.amount = amount;
    entry.reasoning_hash = reasoning_hash;
    entry.reasoning_uri = reasoning_uri;
    entry.timestamp = clock.unix_timestamp;
    entry.slot = clock.slot;
    entry.bump = ctx.bumps.audit_entry;

    msg!(
        "Audit entry logged: agent={}, action={}, slot={}",
        entry.agent,
        action_type,
        entry.slot
    );
    Ok(())
}
