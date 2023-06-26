//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod lending_pool_v0_a_token_interface_facet {

    use lending_project::{
        impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
        traits::lending_pool::traits::a_token_interface::*,
    };
    // use openbrush::storage::Mapping;
    use openbrush::{
        contracts::{access_control::*, ownable, pausable},
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0ATokenInterfaceFacet {
        #[storage_field]
        pause: pausable::Data,
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

    /// Implements core lending methods
    impl LendingPoolATokenInterface for LendingPoolV0ATokenInterfaceFacet {}

    impl LendingPoolV0ATokenInterfaceFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
    }
}
