use crate::impls::lending_pool::storage::{
    lending_pool_storage::MarketRule,
    structs::{reserve_data::ReserveData, user_config::UserConfig, user_reserve_data::UserReserveData},
};

use openbrush::traits::AccountId;

use ink::prelude::vec::Vec;

#[openbrush::wrapper]
pub type LendingPoolViewRef = dyn LendingPoolView;

#[openbrush::trait_definition]
pub trait LendingPoolView {
    #[ink(message)]
    fn view_registered_assets(&self) -> Vec<AccountId>;
    #[ink(message)]
    fn view_unupdated_reserve_data(&self, asset: AccountId) -> Option<ReserveData>;
    #[ink(message)]
    fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData>;
    #[ink(message)]
    fn view_unupdated_reserve_datas(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, Option<ReserveData>)>;
    #[ink(message)]
    fn view_reserve_datas(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, Option<ReserveData>)>;
    #[ink(message)]
    fn view_unupdated_user_reserve_data(&self, asset: AccountId, account: AccountId) -> UserReserveData;
    #[ink(message)]
    fn view_user_reserve_data(&self, asset: AccountId, account: AccountId) -> UserReserveData;
    #[ink(message)]
    fn view_unupdated_user_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
        account: AccountId,
    ) -> Vec<(AccountId, UserReserveData)>;
    #[ink(message)]
    fn view_user_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
        account: AccountId,
    ) -> Vec<(AccountId, UserReserveData)>;
    #[ink(message)]
    fn view_user_config(&self, user: AccountId) -> UserConfig;
    #[ink(message)]
    fn view_market_rule(&self, market_rule_id: u64) -> Option<MarketRule>;
    #[ink(message)]
    fn get_user_free_collateral_coefficient(&self, user_address: AccountId) -> (bool, u128);
    #[ink(message)]
    fn get_block_timestamp_provider_address(&self) -> AccountId;
    #[ink(message)]
    fn get_reserve_token_price_e8(&self, reserve_token_address: AccountId) -> Option<u128>;

    #[ink(message)]
    fn view_protocol_income(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, i128)>;
}
