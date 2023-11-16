/// Stores data used to accumulate deposit and debt interest rates.
#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveIndexes {
    /// index used to calculate deposit accumulated interest
    pub cumulative_deposit_index_e18: u128,
    // index used to calculate debt accumulated interest
    pub cumulative_debt_index_e18: u128,
}
