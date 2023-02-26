//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod lending_pool_v0_manage_facet {
    use ink::codegen::{
        EmitEvent,
        Env,
    };
    use lending_project::{
        impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
        traits::lending_pool::traits::manage::*,
    };
    // use openbrush::storage::Mapping;
    use lending_project::traits::lending_pool::events::*;
    use openbrush::{
        contracts::{
            access_control::*,
            ownable::*,
        },
        traits::Storage,
    };

    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPoolV0ManageFacet {
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
    impl LendingPoolManage for LendingPoolV0ManageFacet {}
    impl Ownable for LendingPoolV0ManageFacet {}
    impl AccessControl for LendingPoolV0ManageFacet {}

    impl LendingPoolV0ManageFacet {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }
    }

    #[ink(event)]
    pub struct AssetRegistered {
        #[ink(topic)]
        asset: AccountId,
        decimals: u128,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        stable_rate_base_e24: Option<u128>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        penalty_e6: u128,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
        a_token_address: AccountId,
        v_token_address: AccountId,
        s_token_address: AccountId,
    }

    #[ink(event)]
    pub struct ReserveActivated {
        #[ink(topic)]
        asset: AccountId,
        active: bool,
    }

    #[ink(event)]
    pub struct ReserveFreezed {
        #[ink(topic)]
        asset: AccountId,
        freezed: bool,
    }

    #[ink(event)]
    pub struct ParametersChanged {
        #[ink(topic)]
        asset: AccountId,
        interest_rate_model: [u128; 7],
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        stable_rate_base_e24: Option<u128>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        penalty_e6: u128,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
    }

    #[ink(event)]
    pub struct IncomeTaken {
        #[ink(topic)]
        asset: AccountId,
    }

    impl EmitManageEvents for LendingPoolV0ManageFacet {
        fn _emit_asset_registered_event(
            &mut self,
            asset: &AccountId,
            decimals: u128,
            collateral_coefficient_e6: Option<u128>,
            borrow_coefficient_e6: Option<u128>,
            stable_rate_base_e24: Option<u128>,
            minimal_collateral: Balance,
            minimal_debt: Balance,
            penalty_e6: u128,
            income_for_suppliers_part_e6: u128,
            flash_loan_fee_e6: u128,
            a_token_address: &AccountId,
            v_token_address: &AccountId,
            s_token_address: &AccountId,
        ) {
            self.env().emit_event(AssetRegistered {
                asset: *asset,
                decimals,
                collateral_coefficient_e6,
                borrow_coefficient_e6,
                stable_rate_base_e24,
                minimal_collateral,
                minimal_debt,
                penalty_e6,
                income_for_suppliers_part_e6,
                flash_loan_fee_e6,
                a_token_address: *a_token_address,
                v_token_address: *v_token_address,
                s_token_address: *s_token_address,
            })
        }

        fn _emit_reserve_activated_event(&mut self, asset: &AccountId, active: bool) {
            self.env().emit_event(ReserveActivated { asset: *asset, active });
        }
        fn _emit_reserve_freezed_event(&mut self, asset: &AccountId, freezed: bool) {
            self.env().emit_event(ReserveFreezed { asset: *asset, freezed })
        }

        fn _emit_reserve_parameters_changed(
            &mut self,
            asset: &AccountId,
            interest_rate_model: &[u128; 7],
            collateral_coefficient_e6: Option<u128>,
            borrow_coefficient_e6: Option<u128>,
            stable_rate_base_e24: Option<u128>,
            minimal_collateral: Balance,
            minimal_debt: Balance,
            penalty_e6: u128,
            income_for_suppliers_part_e6: u128,
            flash_loan_fee_e6: u128,
        ) {
            self.env().emit_event(ParametersChanged {
                asset: *asset,
                interest_rate_model: *interest_rate_model,
                collateral_coefficient_e6,
                borrow_coefficient_e6,
                stable_rate_base_e24,
                minimal_collateral,
                minimal_debt,
                penalty_e6,
                income_for_suppliers_part_e6,
                flash_loan_fee_e6,
            })
        }

        fn _emit_income_taken(&mut self, asset: &AccountId) {
            self.env().emit_event(IncomeTaken { asset: *asset });
        }
    }
}
