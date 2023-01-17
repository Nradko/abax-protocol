//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod lending_pool_v0_liquidate_facet {
    use ink_lang::codegen::{
        EmitEvent,
        Env,
    };
    use ink_storage::traits::SpreadAllocate;
    use lending_project::{
        impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
        traits::lending_pool::traits::actions::*,
    };
    // use openbrush::storage::Mapping;
    use lending_project::traits::lending_pool::events::EmitLiquidateEvents;
    use openbrush::{
        contracts::{
            access_control::*,
            ownable::*,
        },
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, SpreadAllocate, Storage)]
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
    impl LendingPoolLiquidate for LendingPoolV0LiquidateFacet {}

    impl LendingPoolV0LiquidateFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            ink_lang::codegen::initialize_contract(|_instance: &mut LendingPoolV0LiquidateFacet| {})
        }
    }

    #[ink(event)]
    pub struct LiquidationVariableEvent {
        liquidator: AccountId,
        user: AccountId,
        asset_to_rapay: AccountId,
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    }

    #[ink(event)]
    pub struct LiquidationStableEvent {
        liquidator: AccountId,
        user: AccountId,
        asset_to_rapay: AccountId,
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    }

    impl EmitLiquidateEvents for LendingPoolV0LiquidateFacet {
        default fn _emit_liquidation_variable_event(
            &mut self,
            liquidator: AccountId,
            user: AccountId,
            asset_to_rapay: AccountId,
            asset_to_take: AccountId,
            amount_repaid: Balance,
            amount_taken: Balance,
        ) {
            self.env().emit_event(LiquidationVariableEvent {
                liquidator,
                user,
                asset_to_rapay,
                asset_to_take,
                amount_repaid,
                amount_taken,
            })
        }
        default fn _emit_liquidation_stable_event(
            &mut self,
            liquidator: AccountId,
            user: AccountId,
            asset_to_rapay: AccountId,
            asset_to_take: AccountId,
            amount_repaid: Balance,
            amount_taken: Balance,
        ) {
            self.env().emit_event(LiquidationStableEvent {
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
