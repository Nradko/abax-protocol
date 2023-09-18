use crate::impls::{
    constants::E18_U128,
    lending_pool::storage::{
        lending_pool_storage::LendingPoolStorage,
        structs::{reserve_data::ReserveData, user_reserve_data::*},
    },
};

use pendzl::traits::{AccountId, Storage};

use ink::prelude::{vec::Vec, *};

use super::{
    internal::{InternalIncome, TimestampMock},
    storage::{
        lending_pool_storage::{MarketRule, RuleId},
        structs::{reserve_data::ReserveIndexes, user_config::UserConfig},
    },
};

pub trait LendingPoolViewImpl: Storage<LendingPoolStorage> {
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

    fn view_unupdated_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
    ) -> Vec<(AccountId, Option<ReserveData>)> {
        let assets_to_view = assets.unwrap_or_else(|| {
            self.data::<LendingPoolStorage>()
                .get_all_registered_assets()
        });

        let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
        for asset in assets_to_view {
            ret.push((asset, self.view_unupdated_reserve_data(asset)));
        }
        ret
    }

    fn view_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
    ) -> Vec<(AccountId, Option<ReserveData>)> {
        let assets_to_view = assets.unwrap_or_else(|| {
            self.data::<LendingPoolStorage>()
                .get_all_registered_assets()
        });

        let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
        for asset in assets_to_view {
            ret.push((asset, self.view_reserve_data(asset)));
        }
        ret
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
                applied_cumulative_supply_index_e18: E18_U128,
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
                user_reserve_data.accumulate_user_interest(&reserve_indexes);
                user_reserve_data
            }
            None => UserReserveData {
                deposit: 0,
                debt: 0,
                applied_cumulative_supply_index_e18: E18_U128,
                applied_cumulative_debt_index_e18: E18_U128,
            },
        }
    }

    fn view_unupdated_user_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
        user: AccountId,
    ) -> Vec<(AccountId, UserReserveData)> {
        let assets_to_view = assets.unwrap_or_else(|| {
            self.data::<LendingPoolStorage>()
                .get_all_registered_assets()
        });

        let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
        for asset in assets_to_view {
            ret.push((
                asset,
                self.view_unupdated_user_reserve_data(asset, user),
            ));
        }
        ret
    }

    fn view_user_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
        user: AccountId,
    ) -> Vec<(AccountId, UserReserveData)> {
        let assets_to_view = assets.unwrap_or_else(|| {
            self.data::<LendingPoolStorage>()
                .get_all_registered_assets()
        });

        let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
        for asset in assets_to_view {
            ret.push((asset, self.view_user_reserve_data(asset, user)));
        }
        ret
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
        self.data::<LendingPoolStorage>()
            .calculate_user_lending_power_e6(&user)
            .unwrap()
    }

    fn get_block_timestamp_provider_address(&self) -> AccountId {
        self.data::<LendingPoolStorage>()
            .block_timestamp_provider
            .get()
            .unwrap()
    }

    fn get_reserve_token_price_e8(
        &self,
        reserve_token_address: AccountId,
    ) -> Option<u128> {
        match self.data::<LendingPoolStorage>().reserve_prices.get(
            &self
                .data::<LendingPoolStorage>()
                .asset_to_id
                .get(&reserve_token_address)
                .unwrap(),
        ) {
            Some(v) => v.token_price_e8,
            _ => None,
        }
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
