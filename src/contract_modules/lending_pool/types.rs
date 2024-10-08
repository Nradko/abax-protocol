// SPDX-License-Identifier: BUSL-1.1
use abax_library::structs::AssetRules;
use ink::prelude::vec::Vec;

/// type used to represent market rule
pub type MarketRule = Vec<Option<AssetRules>>;
/// type used to identigy rule
pub type RuleId = u32;

/// type used to represent decimal multiplier
pub type DecimalMultiplier = u128;
