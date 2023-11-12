use super::structs::asset_rules::AssetRules;

use ink::prelude::vec::Vec;

pub type MarketRule = Vec<Option<AssetRules>>;
pub type AssetId = u32;
pub type RuleId = u32;
