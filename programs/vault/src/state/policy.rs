use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct PolicyConfig {
    /// Maximum amount that can be spent per day (in USX lamports)
    pub daily_spend_limit: u64,
    /// Maximum single transaction size (in USX lamports)
    pub max_single_tx_size: u64,
    /// Approved counterparties that this vault can transact with
    pub approved_counterparties: Vec<Pubkey>,
    /// Bitmask for allowed transaction types
    /// bit 0: standard transfer
    /// bit 1: settlement
    /// bit 2: yield claim
    /// bit 3: rebalance
    pub allowed_tx_types: u8,
    /// Amount spent in the current day period
    pub daily_spent: u64,
    /// Timestamp of the last daily reset
    pub last_reset_ts: i64,
}

impl PolicyConfig {
    pub const MAX_COUNTERPARTIES: usize = 20;

    pub fn space(num_counterparties: usize) -> usize {
        8  // daily_spend_limit
        + 8  // max_single_tx_size
        + 4 + (32 * num_counterparties) // approved_counterparties vec
        + 1  // allowed_tx_types
        + 8  // daily_spent
        + 8  // last_reset_ts
    }

    pub fn is_tx_type_allowed(&self, tx_type: u8) -> bool {
        self.allowed_tx_types & (1 << tx_type) != 0
    }

    pub fn is_counterparty_approved(&self, counterparty: &Pubkey) -> bool {
        self.approved_counterparties.contains(counterparty)
    }

    pub fn check_daily_limit(&self, amount: u64, current_ts: i64) -> bool {
        let seconds_per_day: i64 = 86400;
        if current_ts - self.last_reset_ts >= seconds_per_day {
            // Day has rolled over, only check against limit with fresh counter
            amount <= self.daily_spend_limit
        } else {
            self.daily_spent.checked_add(amount).map_or(false, |total| total <= self.daily_spend_limit)
        }
    }
}
