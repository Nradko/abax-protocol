//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::contract]
pub mod lending_pool_v0_view_facet {

    use ink::prelude::vec::Vec;
    use lending_project::impls::lending_pool::view::LendingPoolViewImpl;
    use lending_project::traits::lending_pool::traits::view::*;
    use lending_project::{
        impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
        impls::lending_pool::storage::{
            lending_pool_storage::MarketRule,
            structs::{
                reserve_data::ReserveData, user_config::UserConfig,
                user_reserve_data::UserReserveData,
            },
        },
    };
    use openbrush::{
        contracts::{access_control::*, ownable::*},
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0ViewFacet {
        #[storage_field]
        /// storage used by openbrush's `Ownable` trait
        ownable: ownable::Data,
        #[storage_field]
        /// storage used by openbrush's `AccesControl` trait
        access: access_control::Data,
        #[storage_field]
        /// reserve and user datas
        lending_pool: LendingPoolStorage,
    }

    impl LendingPoolViewImpl for LendingPoolV0ViewFacet {}
    impl LendingPoolView for LendingPoolV0ViewFacet {
        #[ink(message)]
        fn view_registered_assets(&self) -> Vec<AccountId> {
            LendingPoolViewImpl::view_registered_assets(self)
        }
        #[ink(message)]
        fn view_unupdated_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
            LendingPoolViewImpl::view_unupdated_reserve_data(self, asset)
        }
        #[ink(message)]
        fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
            LendingPoolViewImpl::view_reserve_data(self, asset)
        }
        #[ink(message)]
        fn view_unupdated_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Option<ReserveData>)> {
            LendingPoolViewImpl::view_unupdated_reserve_datas(self, assets)
        }
        #[ink(message)]
        fn view_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Option<ReserveData>)> {
            LendingPoolViewImpl::view_reserve_datas(self, assets)
        }
        #[ink(message)]
        fn view_unupdated_user_reserve_data(
            &self,
            asset: AccountId,
            account: AccountId,
        ) -> UserReserveData {
            LendingPoolViewImpl::view_unupdated_user_reserve_data(self, asset, account)
        }
        #[ink(message)]
        fn view_user_reserve_data(&self, asset: AccountId, account: AccountId) -> UserReserveData {
            LendingPoolViewImpl::view_user_reserve_data(self, asset, account)
        }
        #[ink(message)]
        fn view_unupdated_user_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, UserReserveData)> {
            LendingPoolViewImpl::view_unupdated_user_reserve_datas(self, assets, account)
        }
        #[ink(message)]
        fn view_user_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, UserReserveData)> {
            LendingPoolViewImpl::view_user_reserve_datas(self, assets, account)
        }
        #[ink(message)]
        fn view_user_config(&self, user: AccountId) -> UserConfig {
            LendingPoolViewImpl::view_user_config(self, user)
        }
        #[ink(message)]
        fn view_market_rule(&self, market_rule_id: u64) -> Option<MarketRule> {
            LendingPoolViewImpl::view_market_rule(self, market_rule_id)
        }
        #[ink(message)]
        fn get_user_free_collateral_coefficient(&self, user_address: AccountId) -> (bool, u128) {
            LendingPoolViewImpl::get_user_free_collateral_coefficient(self, user_address)
        }
        #[ink(message)]
        fn get_block_timestamp_provider_address(&self) -> AccountId {
            LendingPoolViewImpl::get_block_timestamp_provider_address(self)
        }
        #[ink(message)]
        fn get_reserve_token_price_e8(&self, reserve_token_address: AccountId) -> Option<u128> {
            LendingPoolViewImpl::get_reserve_token_price_e8(self, reserve_token_address)
        }

        #[ink(message)]
        fn view_protocol_income(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, i128)> {
            LendingPoolViewImpl::view_protocol_income(self, assets)
        }
    }

    impl LendingPoolV0ViewFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
    }
}
