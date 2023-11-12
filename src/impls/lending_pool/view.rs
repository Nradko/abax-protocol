use crate::{
    impls::{
        constants::E18_U128, lending_pool::storage::LendingPoolStorage,
        types::DecimalMultiplier,
    },
    traits::lending_pool::{
        structs::{
            reserve_abacus_tokens::ReserveAbacusTokens,
            reserve_data::ReserveData, reserve_indexes::ReserveIndexes,
            reserve_parameters::ReserveParameters,
            reserve_restrictions::ReserveRestrictions, user_config::UserConfig,
            user_reserve_data::UserReserveData,
        },
        types::{MarketRule, RuleId},
    },
};

use pendzl::traits::{AccountId, Storage};

use ink::prelude::vec::Vec;

use super::internal::{AssetPrices, InternalIncome, TimestampMock};

pub trait LendingPoolViewImpl: Storage<LendingPoolStorage> {
    fn view_flash_loan_fee_e6(&self) -> u128 {
        self.data::<LendingPoolStorage>()
            .flash_loan_fee_e6
            .get()
            .unwrap()
    }
    fn view_asset_id(&self, asset: AccountId) -> Option<RuleId> {
        self.data::<LendingPoolStorage>().asset_to_id.get(&asset)
    }
    fn view_registered_assets(&self) -> Vec<AccountId> {
        self.data::<LendingPoolStorage>()
            .get_all_registered_assets()
    }

    fn view_unupdated_reserve_data(
        &self,
        asset: AccountId,
    ) -> Option<ReserveData> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .reserve_datas
                .get(&asset_id),
            None => None,
        }
    }

    fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => {
                let mut reserve_data = self
                    .data::<LendingPoolStorage>()
                    .reserve_datas
                    .get(&asset_id)
                    .unwrap();
                let mut reserve_indexes = self
                    .data::<LendingPoolStorage>()
                    .reserve_indexes
                    .get(&asset_id)
                    .unwrap();

                reserve_data
                    .accumulate_interest(
                        &mut reserve_indexes,
                        &self._timestamp(),
                    )
                    .unwrap();
                Some(reserve_data)
            }
            None => None,
        }
    }

    fn view_unupdated_reserve_indexes(
        &self,
        asset: AccountId,
    ) -> Option<ReserveIndexes> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .reserve_indexes
                .get(&asset_id),
            None => None,
        }
    }

    fn view_reserve_parameters(
        &self,
        asset: AccountId,
    ) -> Option<ReserveParameters> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .reserve_parameters
                .get(&asset_id),
            None => None,
        }
    }

    fn view_reserve_restrictions(
        &self,
        asset: AccountId,
    ) -> Option<ReserveRestrictions> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .reserve_restrictions
                .get(&asset_id),
            None => None,
        }
    }
    fn view_reserve_tokens(
        &self,
        asset: AccountId,
    ) -> Option<ReserveAbacusTokens> {
        self.data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(&asset)
    }
    fn view_reserve_decimal_multiplier(
        &self,
        reserve_token_address: AccountId,
    ) -> Option<DecimalMultiplier> {
        self.data::<LendingPoolStorage>()
            .reserve_decimal_multiplier
            .get(
                &self
                    .data::<LendingPoolStorage>()
                    .asset_to_id
                    .get(&reserve_token_address)
                    .unwrap(),
            )
    }

    fn view_reserve_indexes(&self, asset: AccountId) -> Option<ReserveIndexes> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => {
                let mut reserve_data = self
                    .data::<LendingPoolStorage>()
                    .reserve_datas
                    .get(&asset_id)
                    .unwrap();
                let mut reserve_indexes = self
                    .data::<LendingPoolStorage>()
                    .reserve_indexes
                    .get(&asset_id)
                    .unwrap();

                reserve_data
                    .accumulate_interest(
                        &mut reserve_indexes,
                        &self._timestamp(),
                    )
                    .unwrap();
                Some(reserve_indexes)
            }
            None => None,
        }
    }

    fn view_unupdated_user_reserve_data(
        &self,
        asset: AccountId,
        user: AccountId,
    ) -> UserReserveData {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .user_reserve_datas
                .get(&(asset_id, user))
                .unwrap_or_default(),
            None => UserReserveData {
                deposit: 0,
                debt: 0,
                applied_cumulative_deposit_index_e18: E18_U128,
                applied_cumulative_debt_index_e18: E18_U128,
            },
        }
    }

    fn view_user_reserve_data(
        &self,
        asset: AccountId,
        user: AccountId,
    ) -> UserReserveData {
        match self.data::<LendingPoolStorage>().asset_to_id.get(&asset) {
            Some(asset_id) => {
                let mut user_reserve_data = self
                    .data::<LendingPoolStorage>()
                    .user_reserve_datas
                    .get(&(asset_id, user))
                    .unwrap_or_default();
                let mut reserve_data = self
                    .data::<LendingPoolStorage>()
                    .reserve_datas
                    .get(&asset_id)
                    .unwrap();
                let mut reserve_indexes = self
                    .data::<LendingPoolStorage>()
                    .reserve_indexes
                    .get(&asset_id)
                    .unwrap();
                reserve_data
                    .accumulate_interest(
                        &mut reserve_indexes,
                        &self._timestamp(),
                    )
                    .unwrap();
                user_reserve_data
                    .accumulate_user_interest(&reserve_indexes)
                    .unwrap();
                user_reserve_data
            }
            None => UserReserveData {
                deposit: 0,
                debt: 0,
                applied_cumulative_deposit_index_e18: E18_U128,
                applied_cumulative_debt_index_e18: E18_U128,
            },
        }
    }

    fn view_user_config(&self, user: AccountId) -> UserConfig {
        self.data::<LendingPoolStorage>()
            .user_configs
            .get(&user)
            .unwrap_or_default()
    }

    fn view_market_rule(&self, market_rule_id: RuleId) -> Option<MarketRule> {
        self.data::<LendingPoolStorage>()
            .market_rules
            .get(&market_rule_id)
    }

    fn get_user_free_collateral_coefficient(
        &self,
        user: AccountId,
    ) -> (bool, u128) {
        let registered_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();
        let prices_e18 =
            self._get_assets_prices_e18(registered_assets).unwrap();
        self.data::<LendingPoolStorage>()
            .calculate_user_lending_power_e6(&user, &prices_e18)
            .unwrap()
    }

    fn get_block_timestamp_provider_address(&self) -> AccountId {
        self.data::<LendingPoolStorage>()
            .block_timestamp_provider
            .get()
            .unwrap()
    }

    fn view_protocol_income(
        &self,
        assets: Option<Vec<AccountId>>,
    ) -> Vec<(AccountId, i128)> {
        match assets {
            Some(assets_vec) => self._get_protocol_income(&assets_vec).unwrap(),
            None => {
                let registered_assets = self
                    .data::<LendingPoolStorage>()
                    .get_all_registered_assets();
                self._get_protocol_income(&registered_assets).unwrap()
            }
        }
    }
}
