#![cfg_attr(not(feature = "std"), no_std)]

/// `DIA_DATA` oracle interface
pub mod dia_oracle;
/// core protocol contract `LendingPool`
pub mod lending_pool;

/// PSP22 (PSP55) token representing users deposits(debts) in `LendingPool` contract.
pub mod abacus_token;
/// dummy trait
pub mod dummy;
/// flash loan receiver
pub mod flash_loan_receiver;
/// the trait called by `LeningPool` to get prices.
pub mod price_feed;
