//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::implementation(AccessControl)]
#[openbrush::contract]
pub mod lending_pool_v0_facet_initialize {
    use lending_project::{
        self,
        impls::lending_pool::{manage::GLOBAL_ADMIN, storage::lending_pool_storage::LendingPoolStorage},
    };
    // use openbrush::storage::Mapping;
    use openbrush::{
        contracts::{
            access_control::*,
            ownable::{OwnableError, *},
        },
        modifiers,
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0InitializeFacet {
        /// storage used by openbrush's `Ownable` trait
        #[storage_field]
        ownable: ownable::Data,
        /// storage used by openbrush's `AccesControl` trait
        #[storage_field]
        access: access_control::Data,
        /// reserve and user datas
        #[storage_field]
        lending_pool: LendingPoolStorage,
    }

    impl LendingPoolV0InitializeFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }

        #[ink(message)]
        #[modifiers(only_owner)]
        pub fn initialize_contract(&mut self) -> Result<(), LendingPoolV0InitializeFacetError> {
            let caller = self.env().caller();
            access_control::Internal::_init_with_admin(self, caller.into());
            access_control::AccessControl::grant_role(self, GLOBAL_ADMIN, caller.into())?;

            Ok(())
        }
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum LendingPoolV0InitializeFacetError {
        OwnableError(OwnableError),
        AccessControlError(AccessControlError),
    }

    impl From<OwnableError> for LendingPoolV0InitializeFacetError {
        fn from(error: OwnableError) -> Self {
            LendingPoolV0InitializeFacetError::OwnableError(error)
        }
    }
    impl From<AccessControlError> for LendingPoolV0InitializeFacetError {
        fn from(error: AccessControlError) -> Self {
            LendingPoolV0InitializeFacetError::AccessControlError(error)
        }
    }
}
