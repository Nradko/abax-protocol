#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod balance_viewer {

    use lending_project::impls::lending_pool::storage::structs::reserve_data::ReserveData;
    use lending_project::impls::lending_pool::storage::structs::user_reserve_data::UserReserveData;
    // use lending_project::traits::managing::*;
    use pendzl::{contracts::psp22::*, traits::Storage};

    use ink::prelude::{vec::Vec, *};
    use lending_project::traits::lending_pool::traits::view::LendingPoolView;
    use lending_project::traits::lending_pool::traits::view::LendingPoolViewRef;

    #[ink(storage)]
    #[derive(Storage)]
    pub struct BalanceViewer {
        lending_pool: AccountId,
    }

    impl Default for BalanceViewer {
        fn default() -> Self {
            Self {
                lending_pool: ink::blake2x256!("ZERO_ADRESS").into(),
            }
        }
    }

    // impl Managing for PSP22EmitableContract {}

    impl BalanceViewer {
        #[ink(constructor)]
        pub fn new(lending_pool: AccountId) -> Self {
            let mut instance = Self::default(); // metadata
            instance.lending_pool = lending_pool;
            instance
        }

        #[ink(message)]
        pub fn view_user_balances(
            &self,
            assets: Option<Vec<AccountId>>,
            user: AccountId,
        ) -> Vec<(AccountId, Balance)> {
            let assets_to_view = assets.unwrap_or_else(|| {
                let lending_pool: LendingPoolViewRef = self.lending_pool.into();
                lending_pool.view_registered_assets()
            });

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
            let lending_pool: LendingPoolViewRef = self.lending_pool.into();
            let assets_to_view =
                assets.unwrap_or_else(|| lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    lending_pool.view_unupdated_reserve_data(asset),
                ));
            }
            ret
        }
        #[ink(message)]
        pub fn view_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Option<ReserveData>)> {
            let lending_pool: LendingPoolViewRef = self.lending_pool.into();
            let assets_to_view =
                assets.unwrap_or_else(|| lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, Option<ReserveData>)> = vec![];
            for asset in assets_to_view {
                ret.push((asset, lending_pool.view_reserve_data(asset)));
            }
            ret
        }

        #[ink(message)]
        pub fn view_unupdated_user_reserve_datas(
            &self,
            assets: Option<Vec<AccountId>>,
            account: AccountId,
        ) -> Vec<(AccountId, UserReserveData)> {
            let lending_pool: LendingPoolViewRef = self.lending_pool.into();
            let assets_to_view =
                assets.unwrap_or_else(|| lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    lending_pool
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
            let lending_pool: LendingPoolViewRef = self.lending_pool.into();
            let assets_to_view =
                assets.unwrap_or_else(|| lending_pool.view_registered_assets());

            let mut ret: Vec<(AccountId, UserReserveData)> = vec![];
            for asset in assets_to_view {
                ret.push((
                    asset,
                    lending_pool.view_user_reserve_data(asset, account),
                ));
            }
            ret
        }
    }
}
