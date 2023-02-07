#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod balance_viewer {

    // use lending_project::traits::managing::*;
    use openbrush::{
        contracts::psp22::*,
        traits::Storage,
    };

    use ink_prelude::{
        vec::Vec,
        *,
    };
    use ink_storage::traits::SpreadAllocate;
    use lending_project::traits::lending_pool::traits::view::LendingPoolViewRef;

    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct BalanceViewer {
        lending_pool: AccountId,
    }

    // impl Managing for PSP22EmitableContract {}

    impl BalanceViewer {
        #[ink(constructor)]
        pub fn new(lending_pool: AccountId) -> Self {
            ink_lang::codegen::initialize_contract(|instance: &mut Self| {
                // metadata
                instance.lending_pool = lending_pool;
            })
        }

        #[ink(message)]
        pub fn view_user_balances(&self, assets: Option<Vec<AccountId>>, user: AccountId) -> Vec<(AccountId, Balance)> {
            let assets_to_view = if assets.is_some() {
                assets.unwrap()
            } else {
                LendingPoolViewRef::view_registered_assets(&self.lending_pool)
            };
            let mut ret: Vec<(AccountId, Balance)> = vec![];
            for asset in assets_to_view {
                ret.push((asset, PSP22Ref::balance_of(&asset, user)));
            }
            ret
        }
    }
}
