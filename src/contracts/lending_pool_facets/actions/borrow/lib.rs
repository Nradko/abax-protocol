//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::contract]
pub mod lending_pool_v0_borrow_facet {
    use ink::codegen::{EmitEvent, Env};
    use ink::prelude::vec::Vec;
    use lending_project::impls::lending_pool::actions::borrow::LendingPoolBorrowImpl;
    use lending_project::traits::lending_pool::errors::LendingPoolError;
    use lending_project::traits::lending_pool::events::EmitBorrowEvents;
    use lending_project::{
        impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
        traits::lending_pool::traits::actions::*,
    };
    // use openbrush::storage::Mapping;
    use openbrush::{
        contracts::{access_control::*, ownable::*},
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0BorrowFacet {
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

    impl LendingPoolBorrowImpl for LendingPoolV0BorrowFacet {}
    impl LendingPoolBorrow for LendingPoolV0BorrowFacet {
        #[ink(message)]
        fn choose_market_rule(&mut self, market_rule_id: u64) -> Result<(), LendingPoolError> {
            LendingPoolBorrowImpl::choose_market_rule(self, market_rule_id)
        }
        #[ink(message)]
        fn set_as_collateral(
            &mut self,
            asset: AccountId,
            use_as_collateral: bool,
        ) -> Result<(), LendingPoolError> {
            LendingPoolBorrowImpl::set_as_collateral(self, asset, use_as_collateral)
        }
        #[ink(message)]
        fn borrow(
            &mut self,
            asset: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
            data: Vec<u8>,
        ) -> Result<(), LendingPoolError> {
            LendingPoolBorrowImpl::borrow(self, asset, on_behalf_of, amount, data)
        }
        #[ink(message)]
        fn repay(
            &mut self,
            asset: AccountId,
            on_behalf_of: AccountId,
            amount_arg: Option<Balance>,
            data: Vec<u8>,
        ) -> Result<Balance, LendingPoolError> {
            LendingPoolBorrowImpl::repay(self, asset, on_behalf_of, amount_arg, data)
        }
    }

    impl LendingPoolV0BorrowFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
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

    impl EmitBorrowEvents for LendingPoolV0BorrowFacet {
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
}
