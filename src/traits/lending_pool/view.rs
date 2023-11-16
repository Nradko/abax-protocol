use crate::impls::types::DecimalMultiplier;

use pendzl::traits::AccountId;

use ink::prelude::vec::Vec;

use ink::contract_ref;
use ink::env::DefaultEnvironment;

use super::structs::reserve_abacus_tokens::ReserveAbacusTokens;
use super::structs::reserve_data::ReserveData;
use super::structs::reserve_indexes::ReserveIndexes;
use super::structs::reserve_parameters::ReserveParameters;
use super::structs::reserve_restrictions::ReserveRestrictions;
use super::structs::user_config::UserConfig;
use super::structs::user_reserve_data::UserReserveData;
use super::types::{MarketRule, RuleId};

pub type LendingPoolViewRef =
    contract_ref!(LendingPoolView, DefaultEnvironment);

#[ink::trait_definition]
pub trait LendingPoolView {
    #[ink(message)]
    fn view_flash_loan_fee_e6(&self) -> u128;
    #[ink(message)]
    fn view_asset_id(&self, asset: AccountId) -> Option<RuleId>;
    #[ink(message)]
    fn view_registered_assets(&self) -> Vec<AccountId>;
    #[ink(message)]
    fn view_unupdated_reserve_data(
        &self,
        asset: AccountId,
    ) -> Option<ReserveData>;
    #[ink(message)]
    fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData>;
    #[ink(message)]
    fn view_unupdated_reserve_indexes(
        &self,
        asset: AccountId,
    ) -> Option<ReserveIndexes>;
    #[ink(message)]
    fn view_reserve_indexes(&self, asset: AccountId) -> Option<ReserveIndexes>;
    #[ink(message)]
    fn view_reserve_parameters(
        &self,
        asset: AccountId,
    ) -> Option<ReserveParameters>;
    #[ink(message)]
    fn view_reserve_restrictions(
        &self,
        asset: AccountId,
    ) -> Option<ReserveRestrictions>;
    #[ink(message)]
    fn view_reserve_tokens(
        &self,
        asset: AccountId,
    ) -> Option<ReserveAbacusTokens>;
    #[ink(message)]
    fn view_reserve_decimal_multiplier(
        &self,
        asset: AccountId,
    ) -> Option<DecimalMultiplier>;
    #[ink(message)]
    fn view_unupdated_user_reserve_data(
        &self,
        asset: AccountId,
        account: AccountId,
    ) -> UserReserveData;
    #[ink(message)]
    fn view_user_reserve_data(
        &self,
        asset: AccountId,
        account: AccountId,
    ) -> UserReserveData;
    #[ink(message)]
    fn view_user_config(&self, user: AccountId) -> UserConfig;
    #[ink(message)]
    fn view_market_rule(&self, market_rule_id: RuleId) -> Option<MarketRule>;
    #[ink(message)]
    fn get_user_free_collateral_coefficient(
        &self,
        user_address: AccountId,
    ) -> (bool, u128);
    #[ink(message)]
    fn get_block_timestamp_provider_address(&self) -> AccountId;

    #[ink(message)]
    fn view_protocol_income(
        &self,
        assets: Option<Vec<AccountId>>,
    ) -> Vec<(AccountId, i128)>;
}