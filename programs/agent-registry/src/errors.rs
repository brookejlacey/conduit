use anchor_lang::prelude::*;

#[error_code]
pub enum RegistryError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Invalid authority tier (must be 0-3)")]
    InvalidTier,

    #[msg("Institution is not active")]
    InstitutionInactive,

    #[msg("Agent is not active")]
    AgentInactive,

    #[msg("Agent does not belong to this institution")]
    AgentNotInInstitution,

    #[msg("KYC verification required")]
    KycRequired,

    #[msg("Too many scoped programs (max 10)")]
    TooManyScopedPrograms,

    #[msg("Arithmetic overflow")]
    Overflow,
}
