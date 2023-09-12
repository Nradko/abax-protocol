//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::contract]
pub mod lending_pool_v0_a_token_interface_facet {
    use ink::codegen::{EmitEvent, Env};

    use lending_project::traits::lending_pool::errors::LendingPoolTokenInterfaceError;
    use lending_project::traits::lending_pool::events::EmitDepositEvents;
    use lending_project::{
        impls::lending_pool::{
            interfaces::a_token_interface::LendingPoolATokenInterfaceImpl,
            storage::lending_pool_storage::LendingPoolStorage,
        },
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

    #[ink(event)]
    pub struct Deposit {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct Redeem {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }

    impl EmitDepositEvents for LendingPoolV0ATokenInterfaceFacet {
        fn _emit_deposit_event(
            &mut self,
            asset: AccountId,
            caller: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
        ) {
            self.env().emit_event(Deposit {
                asset,
                caller,
                on_behalf_of,
                amount,
            });
        }

        fn _emit_redeem_event(
            &mut self,
            asset: AccountId,
            caller: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
        ) {
            self.env().emit_event(Redeem {
                asset,
                caller,
                on_behalf_of,
                amount,
            });
        }
    }

    impl LendingPoolATokenInterfaceImpl for LendingPoolV0ATokenInterfaceFacet {}
    impl LendingPoolATokenInterface for LendingPoolV0ATokenInterfaceFacet {
        #[ink(message)]
        fn total_supply_of(&self, underlying_asset: AccountId) -> Balance {
            LendingPoolATokenInterfaceImpl::total_supply_of(self, underlying_asset)
        }
        #[ink(message)]
        fn user_supply_of(&self, underlying_asset: AccountId, user: AccountId) -> Balance {
            LendingPoolATokenInterfaceImpl::user_supply_of(self, underlying_asset, user)
        }
        #[ink(message)]
        fn transfer_supply_from_to(
            &mut self,
            underlying_asset: AccountId,
            from: AccountId,
            to: AccountId,
            amount: Balance,
        ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError> {
            LendingPoolATokenInterfaceImpl::transfer_supply_from_to(self, underlying_asset, from, to, amount)
        }
    }

    impl LendingPoolV0ATokenInterfaceFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
    }
}
