use abax_library::structs::AssetRules;
use ink::prelude::vec::Vec;

/// type used to represent market rule
pub type MarketRule = Vec<Option<AssetRules>>;
/// type used to identigy rule
pub type RuleId = u32;

pub type DecimalMultiplier = u128;

pub type RoleType = u32;

pub type InterestRateModel = [u64; 7];
