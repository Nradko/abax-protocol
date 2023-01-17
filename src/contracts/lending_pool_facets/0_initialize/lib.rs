//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod lending_pool_v0_facet_initialize {
    use ink_storage::traits::SpreadAllocate;
    use lending_project::{
        self,
        impls::lending_pool::{
            manage::GLOBAL_ADMIN,
            storage::lending_pool_storage::LendingPoolStorage,
        },
    };
    // use openbrush::storage::Mapping;
    use openbrush::{
        contracts::{
            access_control::{
                members::MembersManager,
                *,
            },
            ownable::{
                OwnableError,
                *,
            },
        },
        modifiers,
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
    pub struct LendingPoolV0InitializeFacet {
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

    impl LendingPoolV0InitializeFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            ink_lang::codegen::initialize_contract(|_instance: &mut LendingPoolV0InitializeFacet| {})
        }

        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn initialize_contract(&mut self) -> Result<(), OwnableError> {
            ink_lang::codegen::initialize_contract(|instance: &mut LendingPoolV0InitializeFacet| {
                let caller = self.env().caller();
                instance._init_with_admin(caller);
                instance.access.members.add(GLOBAL_ADMIN, &caller);
            });
            Ok(())
        }
    }
}
