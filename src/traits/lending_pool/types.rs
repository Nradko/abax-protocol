use super::structs::asset_rules::AssetRules;

use ink::prelude::vec::Vec;

/// type used to identify asset
pub type AssetId = u32;
/// type used to represent market rule
pub type MarketRule = Vec<Option<AssetRules>>;
/// type used to identigy rule
pub type RuleId = u32;
