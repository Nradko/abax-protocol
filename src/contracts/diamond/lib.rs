//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod diamond {
    use openbrush::{contracts::diamond::extensions::diamond_loupe::*, traits::Storage};

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct Contract {
        #[storage_field]
        ownable: ownable::Data,
        #[storage_field]
        diamond: diamond::Data<Loupe>,
    }

    impl Contract {
        #[ink(constructor)]
        pub fn new(owner: AccountId) -> Self {
            let mut instance = Self::default();
            instance._init_with_owner(owner);
            instance
        }

        #[ink(message, payable, selector = _)]
        pub fn forward(&mut self) {
            self._fallback()
        }
    }

    impl Ownable for Contract {}

    impl Diamond for Contract {}

    impl DiamondLoupe for Contract {}
}
