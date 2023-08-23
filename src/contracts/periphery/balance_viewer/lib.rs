#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::contract]
pub mod balance_viewer {

    // use lending_project::traits::managing::*;
    use openbrush::{contracts::psp22::*, traits::Storage};

    use ink::prelude::{vec::Vec, *};
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
            let assets_to_view = assets
                .unwrap_or_else(|| LendingPoolViewRef::view_registered_assets(&self.lending_pool));

            let mut ret: Vec<(AccountId, Balance)> = vec![];
            for asset in assets_to_view {
                ret.push((asset, PSP22Ref::balance_of(&asset, user)));
            }
            ret
        }
    }
}
