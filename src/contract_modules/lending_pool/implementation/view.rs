use crate::lending_pool::{
    DecimalMultiplier, InterestRateModel, MarketRule, RuleId,
};
use abax_library::{
    math::E18_U128,
    structs::{
        AccountConfig, AccountReserveData, ReserveAbacusTokens, ReserveData,
        ReserveFees, ReserveIndexes, ReserveRestrictions,
    },
};
use pendzl::traits::{AccountId, Balance, StorageFieldGetter};

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

    fn view_unupdated_account_reserve_data(
        &self,
        asset: AccountId,
        account: AccountId,
    ) -> AccountReserveData {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => {
                self.data::<LendingPoolStorage>()
                    .get_account_reserve_data(asset_id, &account)
                    .0
            }
            None => AccountReserveData {
                deposit: 0,
                debt: 0,
                applied_deposit_index_e18: E18_U128,
                applied_debt_index_e18: E18_U128,
            },
        }
    }

    fn view_account_reserve_data(
        &self,
        asset: AccountId,
        account: AccountId,
    ) -> AccountReserveData {
        match self.data::<LendingPoolStorage>().asset_to_id.get(asset) {
            Some(asset_id) => {
                let mut account_reserve_data = self
                    .data::<LendingPoolStorage>()
                    .get_account_reserve_data(asset_id, &account)
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
                let fee_reductions = self
                    .data::<LendingPoolStorage>()
                    .get_fee_reductions_of_account(&account);

                reserve_indexes_and_fees
                    .indexes
                    .update(&reserve_data, &Self::env().block_timestamp())
                    .unwrap();
                account_reserve_data
                    .accumulate_account_interest(
                        &reserve_indexes_and_fees.indexes,
                        &mut reserve_indexes_and_fees.fees,
                        &fee_reductions,
                    )
                    .unwrap();
                account_reserve_data
            }
            None => AccountReserveData {
                deposit: 0,
                debt: 0,
                applied_deposit_index_e18: E18_U128,
                applied_debt_index_e18: E18_U128,
            },
        }
    }

    fn view_account_config(&self, account: AccountId) -> AccountConfig {
        self.data::<LendingPoolStorage>()
            .account_configs
            .get(account)
            .unwrap_or_default()
    }

    fn view_market_rule(&self, market_rule_id: RuleId) -> Option<MarketRule> {
        self.data::<LendingPoolStorage>()
            .market_rules
            .get(market_rule_id)
    }

    fn get_account_free_collateral_coefficient(
        &self,
        account: AccountId,
    ) -> (bool, u128) {
        self.data::<LendingPoolStorage>()
            .calculate_lending_power_of_an_account_e6(&account)
            .unwrap()
    }

    fn view_protocol_income(
        &self,
        assets: Option<Vec<AccountId>>,
    ) -> Vec<(AccountId, Balance)> {
        match assets {
            Some(assets_vec) => {
                self._view_protocol_income(&assets_vec).unwrap()
            }
            None => {
                let registered_assets = self
                    .data::<LendingPoolStorage>()
                    .get_all_registered_assets();
                self._view_protocol_income(&registered_assets).unwrap()
            }
        }
    }
}
