use crate::{
    impls::lending_pool::storage::{
        lending_pool_storage::LendingPoolStorage,
        structs::{
            reserve_data::ReserveData,
            user_reserve_data::*,
        },
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::traits::view::LendingPoolView,
    },
};

use openbrush::traits::{
    AccountId,
    Storage,
};

use ink::prelude::{
    vec::Vec,
    *,
};

use super::{
    internal::{
        Internal,
        InternalIncome,
    },
    storage::structs::user_config::UserConfig,
};

impl<T: Storage<LendingPoolStorage>> LendingPoolView for T {
    default fn view_registered_assets(&self) -> Vec<AccountId> {
        self.data::<LendingPoolStorage>().registered_assets.to_vec()
    }
    default fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
        self.data::<LendingPoolStorage>().get_reserve_data(&asset)
    }

    default fn view_reserve_datas(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, Option<ReserveData>)> {
        let assets_to_view = if assets.is_some() {
            assets.unwrap()
        } else {
            self.data::<LendingPoolStorage>().registered_assets.to_vec()
        };

        let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
        for asset in assets_to_view {
            ret.push((asset, self.data::<LendingPoolStorage>().get_reserve_data(&asset)));
        }
        ret
    }

    default fn view_user_reserve_data(&self, asset: AccountId, user: AccountId) -> UserReserveData {
        self.data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &user)
            .unwrap_or_default()
    }

    default fn view_user_reserve_datas(
        &self,
        assets: Option<Vec<AccountId>>,
        user: AccountId,
    ) -> Vec<(AccountId, UserReserveData)> {
        let assets_to_view = if assets.is_some() {
            assets.unwrap()
        } else {
            self.data::<LendingPoolStorage>().registered_assets.to_vec()
        };

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

    default fn view_user_config(&self, user: AccountId) -> UserConfig {
        self.data::<LendingPoolStorage>()
            .get_user_config(&user)
            .unwrap_or_default()
    }

    default fn get_user_free_collateral_coefficient(&self, user_address: AccountId) -> (bool, u128) {
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
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

    default fn get_block_timestamp_provider_address(&self) -> AccountId {
        self.data::<LendingPoolStorage>().block_timestamp_provider
    }
    default fn get_reserve_token_price_e8(&self, reserve_token_address: AccountId) -> Option<u128> {
        match self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&reserve_token_address)
        {
            Some(v) => v.token_price_e8,
            _ => None,
        }
    }
    default fn view_protocol_income(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, i128)> {
        match assets {
            Some(assets_vec) => self._get_protocol_income(&assets_vec),
            None => {
                let registered_assets = self.data::<LendingPoolStorage>().get_all_registered_assets();
                self._get_protocol_income(&registered_assets)
            }
        }
    }
}
