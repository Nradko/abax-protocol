//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::implementation(AccessControl)]
#[openbrush::contract]
pub mod lending_pool_v0_flash_facet {
    use ink::codegen::{EmitEvent, Env};
    use ink::prelude::vec::Vec;

    use lending_project::{
        impls::lending_pool::{
            actions::flash::LendingPoolFlashImpl, storage::lending_pool_storage::LendingPoolStorage,
        },
        traits::lending_pool::{
            errors::LendingPoolError, events::EmitFlashEvents, traits::actions::*,
        },
    };

    use openbrush::{
        contracts::{access_control::*, ownable::*},
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0FlashFacet {
        #[storage_field]
        /// storage used by openbrush's `Ownable` trait
        ownable: ownable::Data,
        #[storage_field]
        /// storage used by openbrush's `AccesControl` trait
        access: access_control::Data,
        #[storage_field]
        /// reserve and user datas
        lending_pool: LendingPoolStorage,
    }

    impl LendingPoolFlashImpl for LendingPoolV0FlashFacet {}
    impl LendingPoolFlash for LendingPoolV0FlashFacet {
        #[ink(message)]
        fn flash_loan(
            &mut self,
            receiver_address: AccountId,
            assets: Vec<AccountId>,
            amounts: Vec<Balance>,
            receiver_params: Vec<u8>,
        ) -> Result<(), LendingPoolError> {
            LendingPoolFlashImpl::flash_loan(
                self,
                receiver_address,
                assets,
                amounts,
                receiver_params,
            )
        }
    }

    impl LendingPoolV0FlashFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
    }

    #[ink(event)]
    pub struct FlashLoan {
        #[ink(topic)]
        receiver_address: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        asset: AccountId,
        amount: u128,
        fee: u128,
    }

    impl EmitFlashEvents for LendingPoolV0FlashFacet {
        fn _emit_flash_loan_event(
            &mut self,
            receiver_address: AccountId,
            caller: AccountId,
            asset: AccountId,
            amount: u128,
            fee: u128,
        ) {
            self.env().emit_event(FlashLoan {
                receiver_address,
                caller,
                asset,
                amount,
                fee,
            });
        }
    }
}
