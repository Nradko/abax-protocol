/// Defines rules on which asset can be borrowed and used as collateral.
#[derive(Debug, Default, Encode, Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct AssetRules {
    /// used while veryfing collateralization. If None then can not be used as collateral.
    pub collateral_coefficient_e6: Option<u128>,
    /// used while veryfing collateralization. If None then can not be borrowed.
    pub borrow_coefficient_e6: Option<u128>,
    /// penalty when liquidated, 1e6 == 100%.
    pub penalty_e6: Option<u128>,
}
