use crate::lending_pool::{
    DecimalMultiplier, InterestRateModel, MarketRule, RuleId,
};
use abax_library::{
    math::E18_U128,
    structs::{
        ReserveAbacusTokens, ReserveData, ReserveFees, ReserveIndexes,
        ReserveRestrictions, UserConfig, UserReserveData,
    },
};
use pendzl::traits::{AccountId, StorageFieldGetter};

use ink::prelude::vec::Vec;

use super::{internal::InternalIncome, storage::LendingPoolStorage};

pub trait LendingPoolViewImpl: StorageFieldGetter<LendingPoolStorage> {
    fn view_flash_loan_fee_e6(&self) -> u128 {
        self.data::<LendingPoolStorage>()
            .flash_loan_fee_e6
            .get()
            .unwrap()
    }
    fn view_asset_id(&self, asset: AccountId) -> Option<RuleId> {
        self.data::<LendingPoolStorage>().asset_to_id.get(asset)
    }
    fn view_registered_assets(&self) -> Vec<AccountId> {
        self.data::<LendingPoolStorage>()
            .get_all_registered_assets()
    }

    fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .reserve_datas
                .get(asset_id),
            None => None,
        }
    }

    fn view_unupdated_reserve_indexes(
        &self,
        asset: AccountId,
    ) -> Option<ReserveIndexes> {
        self.data::<LendingPoolStorage>()
            .asset_to_id
            .get(asset)
            .map(|asset_id| {
                self.data::<LendingPoolStorage>()
                    .reserve_indexes_and_fees
                    .get(asset_id)
                    .unwrap()
                    .indexes
            })
    }

    fn view_reserve_indexes(&self, asset: AccountId) -> Option<ReserveIndexes> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => {
                let reserve_data = self
                    .data::<LendingPoolStorage>()
                    .reserve_datas
                    .get(asset_id)
                    .unwrap();
                let mut reserve_indexes_and_fees = self
                    .data::<LendingPoolStorage>()
                    .reserve_indexes_and_fees
                    .get(asset_id)
                    .unwrap();

                reserve_indexes_and_fees
                    .indexes
                    .update(&reserve_data, &Self::env().block_timestamp())
                    .unwrap();
                Some(reserve_indexes_and_fees.indexes)
            }
            None => None,
        }
    }

    fn view_reserve_fees(&self, asset: AccountId) -> Option<ReserveFees> {
        self.data::<LendingPoolStorage>()
            .asset_to_id
            .get(asset)
            .map(|asset_id| {
                self.data::<LendingPoolStorage>()
                    .reserve_indexes_and_fees
                    .get(asset_id)
                    .unwrap()
                    .fees
            })
    }

    fn view_interest_rate_model(
        &self,
        asset: AccountId,
    ) -> Option<InterestRateModel> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .interest_rate_model
                .get(asset_id),
            None => None,
        }
    }

    fn view_reserve_restrictions(
        &self,
        asset: AccountId,
    ) -> Option<ReserveRestrictions> {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => self
                .data::<LendingPoolStorage>()
                .reserve_restrictions
                .get(asset_id),
            None => None,
        }
    }
    fn view_reserve_tokens(
        &self,
        asset: AccountId,
    ) -> Option<ReserveAbacusTokens> {
        self.data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(asset)
    }
    fn view_reserve_decimal_multiplier(
        &self,
        reserve_token_address: AccountId,
    ) -> Option<DecimalMultiplier> {
        self.data::<LendingPoolStorage>()
            .reserve_decimal_multiplier
            .get(
                self.data::<LendingPoolStorage>()
                    .asset_to_id
                    .get(reserve_token_address)
                    .unwrap(),
            )
    }

    fn view_unupdated_user_reserve_data(
        &self,
        asset: AccountId,
        user: AccountId,
    ) -> UserReserveData {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => {
                self.data::<LendingPoolStorage>()
                    .get_user_reserve_data(asset_id, &user)
                    .0
            }
            None => UserReserveData {
                deposit: 0,
                debt: 0,
                applied_deposit_index_e18: E18_U128,
                applied_debt_index_e18: E18_U128,
            },
        }
    }

    fn view_user_reserve_data(
        &self,
        asset: AccountId,
        user: AccountId,
    ) -> UserReserveData {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => {
                let mut user_reserve_data = self
                    .data::<LendingPoolStorage>()
                    .get_user_reserve_data(asset_id, &user)
                    .0;
                let reserve_data = self
                    .data::<LendingPoolStorage>()
                    .reserve_datas
                    .get(asset_id)
                    .unwrap();
                let mut reserve_indexes_and_fees = self
                    .data::<LendingPoolStorage>()
                    .reserve_indexes_and_fees
                    .get(asset_id)
                    .unwrap();
                let user_config = self
                    .data::<LendingPoolStorage>()
                    .user_configs
                    .get(user)
                    .unwrap_or_default();

                reserve_indexes_and_fees
                    .indexes
                    .update(&reserve_data, &Self::env().block_timestamp())
                    .unwrap();
                user_reserve_data
                    .accumulate_user_interest(
                        &reserve_indexes_and_fees.indexes,
                        &reserve_indexes_and_fees.fees,
                        &user_config.fee_reductions,
                    )
                    .unwrap();
                user_reserve_data
            }
            None => UserReserveData {
                deposit: 0,
                debt: 0,
                applied_deposit_index_e18: E18_U128,
                applied_debt_index_e18: E18_U128,
            },
        }
    }

    fn view_user_config(&self, user: AccountId) -> UserConfig {
        self.data::<LendingPoolStorage>()
            .user_configs
            .get(user)
            .unwrap_or_default()
    }

    fn view_market_rule(&self, market_rule_id: RuleId) -> Option<MarketRule> {
        self.data::<LendingPoolStorage>()
            .market_rules
            .get(market_rule_id)
    }

    fn get_user_free_collateral_coefficient(
        &self,
        user: AccountId,
    ) -> (bool, u128) {
        self.data::<LendingPoolStorage>()
            .calculate_lending_power_of_an_account_e6(&user)
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
