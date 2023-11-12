use pendzl::traits::Balance;
use scale::{Decode, Encode};

/// stores all importand data corresponding to some asset for an user.
#[derive(Debug, Default, Encode, Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct UserReserveData {
    /// underlying asset amount of supplied plus accumulated interest.
    pub deposit: Balance,
    /// underlying asset amount of borrowed (variable rate) plus accumulates interest.
    pub debt: Balance,
    /// applied cumulative rate index that is used to accumulate deposit interest.
    pub applied_cumulative_deposit_index_e18: u128,
    /// applied cumulative rate index that is used to accumulate debt (variable) interest.
    pub applied_cumulative_debt_index_e18: u128,
}
