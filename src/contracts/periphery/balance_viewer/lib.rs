#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod balance_viewer {

    use lending_project::impls::lending_pool::storage::structs::reserve_data;
    use lending_project::impls::lending_pool::storage::structs::reserve_data::ReserveAbacusTokens;
    use lending_project::impls::lending_pool::storage::structs::reserve_data::ReserveData;
    use lending_project::impls::lending_pool::storage::structs::reserve_data::ReserveParameters;
    use lending_project::impls::lending_pool::storage::structs::reserve_data::ReservePrice;
    use lending_project::impls::lending_pool::storage::structs::reserve_data::ReserveRestrictions;
    use lending_project::impls::lending_pool::storage::structs::user_reserve_data::UserReserveData;
    use lending_project::traits::lending_pool::errors::LendingPoolError;
    // use lending_project::traits::managing::*;
    use pendzl::{contracts::psp22::*, traits::Storage};

    use ink::prelude::{vec::Vec, *};
    use lending_project::traits::lending_pool::traits::view::LendingPoolView;
    use lending_project::traits::lending_pool::traits::view::LendingPoolViewRef;

    #[derive(Debug, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct CompleteReserveData {
        pub data: Option<ReserveData>,
        pub parameters: Option<ReserveParameters>,
        pub restriction: Option<ReserveRestrictions>,
        pub price: Option<ReservePrice>,
        pub tokens: Option<ReserveAbacusTokens>,
    }

    #[ink(storage)]
    #[derive(Storage)]
    pub struct BalanceViewer {
        lending_pool: LendingPoolViewRef,
    }

    // impl Managing for PSP22EmitableContract {}

    impl BalanceViewer {
        #[ink(constructor)]
        pub fn new(lending_pool: AccountId) -> Self {
            BalanceViewer {
                lending_pool: lending_pool.into(),
            }
        }

        #[ink(message)]
        pub fn view_user_balances(
            &self,
            assets: Option<Vec<AccountId>>,
            user: AccountId,
        ) -> Vec<(AccountId, Balance)> {
            let assets_to_view = assets
                .unwrap_or_else(|| self.lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, Balance)> = vec![];
            for asset in assets_to_view {
                let psp22: PSP22Ref = asset.into();
                ret.push((asset, psp22.balance_of(user)));
            }
            ret
        }

        #[ink(message)]
        pub fn view_unupdated_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Option<ReserveData>)> {
            let assets_to_view = assets
                .unwrap_or_else(|| self.lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    self.lending_pool.view_unupdated_reserve_data(asset),
                ));
            }
            ret
        }
        #[ink(message)]
        pub fn view_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Option<ReserveData>)> {
            let assets_to_view = assets
                .unwrap_or_else(|| self.lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
            for asset in assets_to_view {
                ret.push((asset, self.lending_pool.view_reserve_data(asset)));
            }
            ret
        }

        #[ink(message)]
        pub fn view_unupdated_user_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, UserReserveData)> {
            let assets_to_view = assets
                .unwrap_or_else(|| self.lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    self.lending_pool
                        .view_unupdated_user_reserve_data(asset, account),
                ));
            }
            ret
        }
        #[ink(message)]
        pub fn view_user_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, UserReserveData)> {
            let assets_to_view = assets
                .unwrap_or_else(|| self.lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    self.lending_pool.view_user_reserve_data(asset, account),
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
                data: self.lending_pool.view_reserve_data(asset),
                parameters: self.lending_pool.view_reserve_parameters(asset),
                restriction: self.lending_pool.view_reserve_restrictions(asset),
                price: self.lending_pool.view_reserve_prices(asset),
                tokens: self.lending_pool.view_reserve_tokens(asset),
            }
        }

        #[ink(message)]
        pub fn view_complete_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, CompleteReserveData)> {
            let assets_to_view = assets
                .unwrap_or_else(|| self.lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, CompleteReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((asset, self.view_complete_reserve_data(asset)));
            }
            ret
        }
    }
}
