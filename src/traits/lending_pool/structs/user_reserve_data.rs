/// stores data of user
#[derive(Debug, Default, Encode, Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct UserReserveData {
    /// underlying asset amount of deposit plus accumulated interest.
    pub deposit: Balance,
    /// underlying asset amount of debt plus accumulated interest.
    pub debt: Balance,
    /// index that is used to accumulate deposit interest.
    pub applied_cumulative_deposit_index_e18: u128,
    /// index that is used to accumulate debt interest.
    pub applied_cumulative_debt_index_e18: u128,
}
