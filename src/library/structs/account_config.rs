pub type Bitmap128 = u128;

/// stores information about which asset is deposited, used as collatearl and borrowed by an account and which `market_rule_id` the account has chosen.
#[derive(Debug, Default, scale::Encode, scale::Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct AccountConfig {
    /// active account deposits. The order in the Bitmap corresponds to the `assets_id`.
    pub deposits: Bitmap128,
    /// turned on collaterals. The order in the Bitmap corresponds to the `assets_id`.
    pub collaterals: Bitmap128,
    /// active borrow_variable. The order in the Bitmap corresponds to the `assets_id`.
    pub borrows: Bitmap128,
    /// id of `MarketRule` chosen by account
    pub market_rule_id: u32,
}
