use anchor_lang::prelude::*;

#[error_code]
pub enum SettlementError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Settlement batch is not open")]
    BatchNotOpen,

    #[msg("Settlement batch is empty")]
    EmptyBatch,

    #[msg("Invalid amount: must be greater than zero")]
    InvalidAmount,

    #[msg("Invalid FX rate: must be greater than zero")]
    InvalidFxRate,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Batch already settled")]
    AlreadySettled,
}
