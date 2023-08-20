//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::contract]
pub mod lending_pool_v0_liquidate_facet {
    use ink::codegen::{EmitEvent, Env};
    use ink::prelude::vec::Vec;
    use lending_project::impls::lending_pool::actions::liquidate::LendingPoolLiquidateImpl;
    use lending_project::traits::lending_pool::errors::LendingPoolError;
    use lending_project::{
        impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
        traits::lending_pool::traits::actions::*,
    };
    // use openbrush::storage::Mapping;
    use lending_project::traits::lending_pool::events::EmitLiquidateEvents;
    use openbrush::{
        contracts::{access_control::*, ownable::*},
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0LiquidateFacet {
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
    impl LendingPoolLiquidateImpl for LendingPoolV0LiquidateFacet {}
    impl LendingPoolLiquidate for LendingPoolV0LiquidateFacet {
        #[ink(message)]
        fn liquidate(
            &mut self,
            liquidated_user: AccountId,
            asset_to_repay: AccountId,
            asset_to_take: AccountId,
            amount_to_repay: Option<Balance>,
            minimum_recieved_for_one_repaid_token_e18: u128,
            #[allow(unused_variables)] data: Vec<u8>,
        ) -> Result<(Balance, Balance), LendingPoolError> {
            LendingPoolLiquidateImpl::liquidate(
                self,
                liquidated_user,
                asset_to_repay,
                asset_to_take,
                amount_to_repay,
                minimum_recieved_for_one_repaid_token_e18,
                data,
            )
        }
    }

    impl LendingPoolV0LiquidateFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
    }

    #[ink(event)]
    pub struct LiquidationVariable {
        liquidator: AccountId,
        user: AccountId,
        asset_to_rapay: AccountId,
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    }

    impl EmitLiquidateEvents for LendingPoolV0LiquidateFacet {
        fn _emit_liquidation_variable_event(
            &mut self,
            liquidator: AccountId,
            user: AccountId,
            asset_to_rapay: AccountId,
            asset_to_take: AccountId,
            amount_repaid: Balance,
            amount_taken: Balance,
        ) {
            self.env().emit_event(LiquidationVariable {
                liquidator,
                user,
                asset_to_rapay,
                asset_to_take,
                amount_repaid,
                amount_taken,
            })
        }
    }
}
