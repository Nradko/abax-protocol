use crate::{
    impls::lending_pool::storage::{
        lending_pool_storage::LendingPoolStorage,
        structs::{reserve_data::ReserveData, user_reserve_data::*},
    },
    traits::block_timestamp_provider::BlockTimestampProviderRef,
};

use openbrush::traits::{AccountId, Storage};

use ink::prelude::{vec::Vec, *};

use super::{
    internal::{Internal, InternalIncome, _accumulate_interest},
    storage::{lending_pool_storage::MarketRule, structs::user_config::UserConfig},
};

pub trait LendingPoolViewImpl: Storage<LendingPoolStorage> {
    fn view_registered_assets(&self) -> Vec<AccountId> {
        self.data::<LendingPoolStorage>()
            .registered_assets
            .get_or_default()
            .to_vec()
    }

    fn view_unupdated_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
        self.data::<LendingPoolStorage>().get_reserve_data(&asset)
    }

    fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
        match self.data::<LendingPoolStorage>().get_reserve_data(&asset) {
            Some(mut reserve_data) => {
                let block_timestamp = BlockTimestampProviderRef::get_block_timestamp(
                    &self
                        .data::<LendingPoolStorage>()
                        .block_timestamp_provider
                        .get()
                        .unwrap(),
                );
                reserve_data._accumulate_interest(block_timestamp);
                Some(reserve_data)
            }
            None => None,
        }
    }

    fn view_unupdated_reserve_datas(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, Option<ReserveData>)> {
        let assets_to_view = assets.unwrap_or_else(|| {
            self.data::<LendingPoolStorage>()
                .registered_assets
                .get_or_default()
                .to_vec()
        });

        let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
        for asset in assets_to_view {
            ret.push((asset, self.data::<LendingPoolStorage>().get_reserve_data(&asset)));
        }
        ret
    }

    fn view_reserve_datas(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, Option<ReserveData>)> {
        let assets_to_view = assets.unwrap_or_else(|| {
            self.data::<LendingPoolStorage>()
                .registered_assets
                .get_or_default()
                .to_vec()
        });

        let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
        for asset in assets_to_view {
            ret.push((asset, self.view_reserve_data(asset)));
        }
        ret
    }

    fn view_unupdated_user_reserve_data(&self, asset: AccountId, user: AccountId) -> UserReserveData {
        self.data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &user)
            .unwrap_or_default()
    }

    fn view_user_reserve_data(&self, asset: AccountId, user: AccountId) -> UserReserveData {
        match self.data::<LendingPoolStorage>().get_reserve_data(&asset) {
            Some(mut reserve_data) => match self.data::<LendingPoolStorage>().get_user_reserve(&asset, &user) {
                Some(mut user_reserve_data) => {
                    let block_timestamp = BlockTimestampProviderRef::get_block_timestamp(
                        &self
                            .data::<LendingPoolStorage>()
                            .block_timestamp_provider
                            .get()
                            .unwrap(),
                    );
                    _accumulate_interest(&mut reserve_data, &mut user_reserve_data, block_timestamp);
                    user_reserve_data
                }
                None => UserReserveData::default(),
            },
            None => UserReserveData::default(),
        }
    }

    fn view_unupdated_user_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
        user: AccountId,
    ) -> Vec<(AccountId, UserReserveData)> {
        let assets_to_view = assets.unwrap_or_else(|| {
            self.data::<LendingPoolStorage>()
                .registered_assets
                .get_or_default()
                .to_vec()
        });

        let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
        for asset in assets_to_view {
            ret.push((
                asset,
                self.data::<LendingPoolStorage>()
                    .get_user_reserve(&asset, &user)
                    .unwrap_or_default(),
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
                .registered_assets
                .get_or_default()
                .to_vec()
        });

        let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
        for asset in assets_to_view {
            ret.push((asset, self.view_user_reserve_data(asset, user)));
        }
        ret
    }

    fn view_user_config(&self, user: AccountId) -> UserConfig {
        self.data::<LendingPoolStorage>()
            .get_user_config(&user)
            .unwrap_or_default()
    }

    fn view_market_rule(&self, market_rule_id: u64) -> Option<MarketRule> {
        self.data::<LendingPoolStorage>().get_market_rule(&market_rule_id)
    }

    fn get_user_free_collateral_coefficient(&self, user_address: AccountId) -> (bool, u128) {
        let block_timestamp = BlockTimestampProviderRef::get_block_timestamp(
            &self
                .data::<LendingPoolStorage>()
                .block_timestamp_provider
                .get()
                .unwrap(),
        );
        let user_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&user_address)
            .unwrap_or_default();
        let market_rule = self
            .data::<LendingPoolStorage>()
            .get_market_rule(&user_config.market_rule_id)
            .unwrap_or_default();

        self._get_user_free_collateral_coefficient_e6(&user_address, &user_config, &market_rule, block_timestamp)
            .unwrap_or_default()
    }

    fn get_block_timestamp_provider_address(&self) -> AccountId {
        self.data::<LendingPoolStorage>()
            .block_timestamp_provider
            .get()
            .unwrap()
    }

    fn get_reserve_token_price_e8(&self, reserve_token_address: AccountId) -> Option<u128> {
        match self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&reserve_token_address)
        {
            Some(v) => v.token_price_e8,
            _ => None,
        }
    }

    fn view_protocol_income(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, i128)> {
        match assets {
            Some(assets_vec) => self._get_protocol_income(&assets_vec),
            None => {
                let registered_assets = self.data::<LendingPoolStorage>().get_all_registered_assets();
                self._get_protocol_income(&registered_assets)
            }
        }
    }
}
