use scale::{Decode, Encode};

use crate::impls::types::Bitmap128;

/// stores configuration of the user for each reserve in Bitmap
/// the order of reserve is the order from registered_asset list in LendingPoolStorage
#[derive(Debug, Default, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct UserConfig {
    /// active user deposits.
    pub deposits: Bitmap128,
    /// turned on collaterals.
    pub collaterals: Bitmap128,
    /// active borrow_variable.
    pub borrows: Bitmap128,
    /// used market_rule_id
    pub market_rule_id: u32,
}
