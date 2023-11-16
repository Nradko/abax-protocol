/// stores information about which asset is deposited, used as collatearl and borrowed by an user and which `market_rule_id` the user has chosen.
#[derive(Debug, Default, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct UserConfig {
    /// active user deposits. The order in the Bitmap corresponds to the `assets_id`.`
    pub deposits: Bitmap128,
    /// turned on collaterals. The order in the Bitmap corresponds to the `assets_id`.
    pub collaterals: Bitmap128,
    /// active borrow_variable. The order in the Bitmap corresponds to the `assets_id`.
    pub borrows: Bitmap128,
    /// id of market_rule chosen by user
    pub market_rule_id: u32,
}
