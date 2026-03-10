use anchor_lang::prelude::*;
use crate::state::AuditEntry;
use crate::errors::AuditError;

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

    /// CHECK: The institution pubkey is stored for reference; validated off-chain
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
