use anchor_lang::prelude::*;

#[account]
pub struct AgentIdentity {
    /// The institution this agent belongs to
    pub institution: Pubkey,
    /// The agent's signing public key
    pub agent_pubkey: Pubkey,
    /// Authority tier (0=observer, 1=executor, 2=manager, 3=admin)
    pub authority_tier: u8,
    /// Programs this agent is authorized to call
    pub scoped_programs: Vec<Pubkey>,
    /// Whether this agent is currently active
    pub active: bool,
    /// Timestamp when agent was registered
    pub registered_at: i64,
    /// Timestamp of last on-chain action
    pub last_action_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl AgentIdentity {
    pub const MAX_SCOPED_PROGRAMS: usize = 10;

    pub fn space(num_programs: usize) -> usize {
        8  // discriminator
        + 32 // institution
        + 32 // agent_pubkey
        + 1  // authority_tier
        + 4 + (32 * num_programs) // scoped_programs
        + 1  // active
        + 8  // registered_at
        + 8  // last_action_at
        + 1  // bump
    }
}
