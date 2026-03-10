use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Policy violation")]
    PolicyViolation,

    #[msg("Daily spending limit exceeded")]
    DailyLimitExceeded,

    #[msg("Counterparty not on approved list")]
    CounterpartyNotApproved,

    #[msg("Transaction type not allowed by policy")]
    TxTypeForbidden,

    #[msg("Multisig threshold not met")]
    MultisigThresholdNotMet,

    #[msg("Invalid amount: must be greater than zero")]
    InvalidAmount,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Insufficient funds in vault")]
    InsufficientFunds,

    #[msg("KYC verification required for deposit")]
    KycRequired,

    #[msg("Too many multisig signers (max 5)")]
    TooManySigners,

    #[msg("Invalid multisig threshold")]
    InvalidThreshold,

    #[msg("Too many counterparties (max 20)")]
    TooManyCounterparties,
}
