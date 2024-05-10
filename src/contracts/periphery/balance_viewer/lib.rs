#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod balance_viewer {

    use abax_contracts::lending_pool::{
        DecimalMultiplier, LendingPoolView, LendingPoolViewRef,
    };
    use abax_library::structs::{
        AccountReserveData, InterestRateModel, ReserveAbacusTokens,
        ReserveData, ReserveFees, ReserveIndexes, ReserveRestrictions,
    };
    use pendzl::{
        contracts::psp22::{PSP22Ref, PSP22},
        traits::StorageFieldGetter,
    };

    use ink::codegen::TraitCallBuilder;
    use ink::prelude::{vec::Vec, *};

    #[derive(Debug, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct CompleteReserveData {
        pub data: Option<ReserveData>,
        pub indexes: Option<ReserveIndexes>,
        pub interest_rate_model: Option<InterestRateModel>,
        pub fees: Option<ReserveFees>,
        pub restriction: Option<ReserveRestrictions>,
        pub decimal_multiplier: Option<DecimalMultiplier>,
        pub tokens: Option<ReserveAbacusTokens>,
    }

    #[ink(storage)]
    #[derive(StorageFieldGetter)]
    pub struct BalanceViewer {
        lending_pool: LendingPoolViewRef,
    }

    impl BalanceViewer {
        #[ink(constructor)]
        pub fn new(lending_pool: AccountId) -> Self {
            BalanceViewer {
                lending_pool: lending_pool.into(),
            }
        }

        #[ink(message)]
        pub fn view_account_balances(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, Balance)> {
            let assets_to_view = assets.unwrap_or_else(|| {
                self.lending_pool
                    .call()
                    .view_registered_assets()
                    .call_v1()
                    .invoke()
            });

            let mut ret: Vec<(AccountId, Balance)> = vec![];
            for asset in assets_to_view {
                let psp22: PSP22Ref = asset.into();
                ret.push((
                    asset,
                    psp22.call().balance_of(account).call_v1().invoke(),
                ));
            }
            ret
        }

        #[ink(message)]
        pub fn view_unupdated_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Option<ReserveData>)> {
            let assets_to_view = assets.unwrap_or_else(|| {
                self.lending_pool
                    .call()
                    .view_registered_assets()
                    .call_v1()
                    .invoke()
            });

            let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    self.lending_pool
                        .call()
                        .view_reserve_data(asset)
                        .call_v1()
                        .invoke(),
                ));
            }
            ret
        }
        #[ink(message)]
        pub fn view_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Option<ReserveData>)> {
            let assets_to_view = assets.unwrap_or_else(|| {
                self.lending_pool
                    .call()
                    .view_registered_assets()
                    .call_v1()
                    .invoke()
            });

            let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    self.lending_pool
                        .call()
                        .view_reserve_data(asset)
                        .call_v1()
                        .invoke(),
                ));
            }
            ret
        }

        #[ink(message)]
        pub fn view_unupdated_account_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, AccountReserveData)> {
            let assets_to_view = assets.unwrap_or_else(|| {
                self.lending_pool
                    .call()
                    .view_registered_assets()
                    .call_v1()
                    .invoke()
            });

            let mut ret: Vec<(AccountId, AccountReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    self.lending_pool
                        .call()
                        .view_unupdated_account_reserve_data(asset, account)
                        .call_v1()
                        .invoke(),
                ));
            }
            ret
        }
        #[ink(message)]
        pub fn view_account_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, AccountReserveData)> {
            let assets_to_view = assets.unwrap_or_else(|| {
                self.lending_pool
                    .call()
                    .view_registered_assets()
                    .call_v1()
                    .invoke()
            });

            let mut ret: Vec<(AccountId, AccountReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    self.lending_pool
                        .call()
                        .view_account_reserve_data(asset, account)
                        .call_v1()
                        .invoke(),
                ));
            }
            ret
        }

        #[ink(message)]
        pub fn view_complete_reserve_data(
            &self,
            asset: AccountId,
        ) -> CompleteReserveData {
            CompleteReserveData {
                data: self
                    .lending_pool
                    .call()
                    .view_reserve_data(asset)
                    .call_v1()
                    .invoke(),
                indexes: self
                    .lending_pool
                    .call()
                    .view_reserve_indexes(asset)
                    .call_v1()
                    .invoke(),
                interest_rate_model: self
                    .lending_pool
                    .call()
                    .view_interest_rate_model(asset)
                    .call_v1()
                    .invoke(),
                fees: self
                    .lending_pool
                    .call()
                    .view_reserve_fees(asset)
                    .call_v1()
                    .invoke(),
                restriction: self
                    .lending_pool
                    .call()
                    .view_reserve_restrictions(asset)
                    .call_v1()
                    .invoke(),
                decimal_multiplier: self
                    .lending_pool
                    .call()
                    .view_reserve_decimal_multiplier(asset)
                    .call_v1()
                    .invoke(),
                tokens: self
                    .lending_pool
                    .call()
                    .view_reserve_tokens(asset)
                    .call_v1()
                    .invoke(),
            }
        }

        #[ink(message)]
        pub fn view_complete_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, CompleteReserveData)> {
            let assets_to_view = assets.unwrap_or_else(|| {
                self.lending_pool
                    .call()
                    .view_registered_assets()
                    .call_v1()
                    .invoke()
            });

            let mut ret: Vec<(AccountId, CompleteReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((asset, self.view_complete_reserve_data(asset)));
            }
            ret
        }
    }
}
