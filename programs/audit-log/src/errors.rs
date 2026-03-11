use anchor_lang::prelude::*;

#[error_code]
pub enum AuditError {
    #[msg("Invalid action type (must be 0-5)")]
    InvalidActionType,

    #[msg("Unauthorized: agent not registered")]
    Unauthorized,

    #[msg("Agent is not active")]
    AgentInactive,
}
