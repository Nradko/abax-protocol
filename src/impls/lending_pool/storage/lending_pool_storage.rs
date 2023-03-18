use ink::prelude::vec::*;
use openbrush::{
    storage::Mapping,
    traits::AccountId,
};

use crate::impls::lending_pool::storage::structs::{
    reserve_data::ReserveData,
    user_config::UserConfig,
    user_reserve_data::UserReserveData,
};

use super::structs::asset_rules::AssetRules;

pub const STORAGE_KEY: u32 = openbrush::storage_unique_key!(LendingPoolStorage);

pub type MarketRule = Vec<Option<AssetRules>>;

#[derive(Debug)]
#[openbrush::upgradeable_storage(STORAGE_KEY)]
pub struct LendingPoolStorage {
    pub block_timestamp_provider: AccountId,
    pub registered_assets: Vec<AccountId>,
    pub market_rule_id_to_market_rule: Mapping<u64, MarketRule>,
    pub asset_to_reserve_data: Mapping<AccountId, ReserveData>,
    pub asset_and_user_to_user_reserve_data: Mapping<(AccountId, AccountId), UserReserveData>,
    pub user_to_user_config: Mapping<AccountId, UserConfig>,
}

impl Default for LendingPoolStorage {
    fn default() -> Self {
        Self {
            block_timestamp_provider: ink::blake2x256!("ZERO_ADRESS").into(),
            registered_assets: Vec::new(),
            market_rule_id_to_market_rule: Default::default(),
            asset_to_reserve_data: Default::default(),
            asset_and_user_to_user_reserve_data: Default::default(),
            user_to_user_config: Default::default(),
        }
    }
}

impl LendingPoolStorage {
    // registered_asset
    pub fn register_asset(&mut self, asset: &AccountId) {
        self.registered_assets.push(*asset)
    }
    pub fn get_all_registered_assets(&self) -> Vec<AccountId> {
        self.registered_assets.clone()
    }

    pub fn is_registered(&self, asset: &AccountId) -> bool {
        self.registered_assets.contains(asset)
    }

    pub fn registered_asset_len(&self) -> u64 {
        self.registered_assets.len() as u64
    }

    // asset_to_reserve
    pub fn get_reserve_data(&self, asset: &AccountId) -> Option<ReserveData> {
        self.asset_to_reserve_data.get(asset)
    }

    pub fn insert_reserve_data(&mut self, asset: &AccountId, reserve_data: &ReserveData) {
        self.asset_to_reserve_data.insert(asset, reserve_data);
    }

    // asset_user_to_user_reserve
    pub fn get_user_reserve(&self, asset: &AccountId, user: &AccountId) -> Option<UserReserveData> {
        self.asset_and_user_to_user_reserve_data.get(&(*asset, *user))
    }

    pub fn insert_user_reserve(&mut self, asset: &AccountId, user: &AccountId, user_reesrve: &UserReserveData) {
        self.asset_and_user_to_user_reserve_data
            .insert(&(*asset, *user), user_reesrve);
    }

    // user_to_user_config
    pub fn get_user_config(&self, user: &AccountId) -> Option<UserConfig> {
        self.user_to_user_config.get(user)
    }
    pub fn insert_user_config(&mut self, user: &AccountId, user_config: &UserConfig) {
        self.user_to_user_config.insert(user, user_config);
    }
    // market_rule
    pub fn get_market_rule(&self, market_rule_id: &u64) -> Option<MarketRule> {
        self.market_rule_id_to_market_rule.get(market_rule_id)
    }
    pub fn insert_market_rule(&mut self, market_rule_id: &u64, market_rule: &MarketRule) {
        self.market_rule_id_to_market_rule.insert(market_rule_id, market_rule);
    }
}
