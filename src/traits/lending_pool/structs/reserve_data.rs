pub use pendzl::traits::{Balance, Timestamp};
use scale::{Decode, Encode};

/// is a struct containing all important constants and non-constant parameters and variables for each asset available on market.
/// records  total supplly and debt, interest rates.
/// very ofther used
#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveData {
    /// are any actions allowed?
    pub activated: bool,
    /// are borrows and supplies freezed?
    pub freezed: bool,
    ///// Variables
    //// deposit
    /// total deposit of underlying asset. It is sum of deposits and  of accumulated interests. Total deposit of aToken.
    pub total_deposit: Balance,
    /// current interest rate for supplied tokens per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_deposit_rate_e24: u128,
    //// variable_borrow
    /// total debt. It is sum of debts with accumulated interests. Total supply of vToken.
    pub total_debt: Balance,
    // current interest rate for variable debt per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_debt_rate_e24: u128,
    /// timestamp of the last update od rate indexes
    pub indexes_update_timestamp: Timestamp,
}
