use anchor_lang::prelude::*;
use crate::state::AuditEntry;
use crate::errors::AuditError;

/// Agent registry program ID for cross-program PDA verification
const AGENT_REGISTRY_PROGRAM_ID: Pubkey = pubkey!("D6ixuieTocq25Rf2Ru4qAAuxSPx5mbR6UABjY7PoNDnh");

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

    // Verify the agent is active by reading the `active` field from raw account data.
    // AgentIdentity layout: 8 (discriminator) + 32 (institution) + 32 (agent_pubkey)
    //   + 1 (authority_tier) + 4 (vec len) + N*32 (scoped_programs) + 1 (active)
    let identity_data = ctx.accounts.agent_identity.try_borrow_data()?;
    let min_len = 8 + 32 + 32 + 1 + 4; // 77 bytes before the vec contents
    require!(identity_data.len() >= min_len, AuditError::Unauthorized);
    let num_programs = u32::from_le_bytes(
        identity_data[73..77].try_into().unwrap()
    ) as usize;
    let active_offset = 77 + (num_programs * 32);
    require!(identity_data.len() > active_offset, AuditError::Unauthorized);
    let is_active = identity_data[active_offset] != 0;
    require!(is_active, AuditError::AgentInactive);

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
