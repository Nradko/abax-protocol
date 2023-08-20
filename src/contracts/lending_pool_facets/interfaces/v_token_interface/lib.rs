//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::contract]
pub mod lending_pool_v0_v_token_interface_facet {
    use ink::codegen::{EmitEvent, Env};

    use lending_project::traits::lending_pool::errors::LendingPoolTokenInterfaceError;
    use lending_project::traits::lending_pool::events::EmitBorrowEvents;
    use lending_project::{
        impls::lending_pool::{
            interfaces::v_token_interface::LendingPoolVTokenInterfaceImpl,
            storage::lending_pool_storage::LendingPoolStorage,
        },
        traits::lending_pool::traits::v_token_interface::*,
    };
    // use openbrush::storage::Mapping;
    use openbrush::{
        contracts::{access_control::*, ownable::*, pausable},
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0VTokenInterfaceFacet {
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
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct Redeem {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct CollateralSet {
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        asset: AccountId,
        set: bool,
    }
    #[ink(event)]
    pub struct BorrowVariable {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct RepayVariable {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct BorrowStable {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct RepayStable {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct MarketRuleChosen {
        #[ink(topic)]
        user: AccountId,
        market_rule_id: u64,
    }

    impl EmitBorrowEvents for LendingPoolV0VTokenInterfaceFacet {
        fn _emit_market_rule_chosen(&mut self, user: &AccountId, market_rule_id: &u64) {
            self.env().emit_event(MarketRuleChosen {
                user: *user,
                market_rule_id: *market_rule_id,
            });
        }
        fn _emit_collateral_set_event(&mut self, asset: AccountId, caller: AccountId, set: bool) {
            self.env().emit_event(CollateralSet { asset, caller, set });
        }
        fn _emit_borrow_variable_event(
            &mut self,
            asset: AccountId,
            caller: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
        ) {
            self.env().emit_event(BorrowVariable {
                asset,
                caller,
                on_behalf_of,
                amount,
            });
        }

        fn _emit_repay_variable_event(
            &mut self,
            asset: AccountId,
            caller: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
        ) {
            self.env().emit_event(RepayVariable {
                asset,
                caller,
                on_behalf_of,
                amount,
            });
        }
    }

    /// Implements core lending methods
    impl LendingPoolVTokenInterfaceImpl for LendingPoolV0VTokenInterfaceFacet {}
    impl LendingPoolVTokenInterface for LendingPoolV0VTokenInterfaceFacet {
        #[ink(message)]
        fn total_variable_debt_of(&self, underlying_asset: AccountId) -> Balance {
            LendingPoolVTokenInterfaceImpl::total_variable_debt_of(self, underlying_asset)
        }
        #[ink(message)]
        fn user_variable_debt_of(&self, underlying_asset: AccountId, user: AccountId) -> Balance {
            LendingPoolVTokenInterfaceImpl::user_variable_debt_of(self, underlying_asset, user)
        }
        #[ink(message)]
        fn transfer_variable_debt_from_to(
            &mut self,
            underlying_asset: AccountId,
            from: AccountId,
            to: AccountId,
            amount: Balance,
        ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError> {
            LendingPoolVTokenInterfaceImpl::transfer_variable_debt_from_to(
                self,
                underlying_asset,
                from,
                to,
                amount,
            )
        }
    }

    impl LendingPoolV0VTokenInterfaceFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
    }
}
