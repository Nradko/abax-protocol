//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod lending_pool {
    use ink::codegen::{
        EmitEvent,
        Env,
    };

    use lending_project::{
        impls::lending_pool::{
            manage::GLOBAL_ADMIN,
            storage::lending_pool_storage::LendingPoolStorage,
        },
        traits::lending_pool::traits::{
            a_token_interface::*,
            actions::*,
            manage::*,
            s_token_interface::*,
            v_token_interface::*,
            view::*,
        },
    };
    // use openbrush::storage::Mapping;
    use lending_project::traits::lending_pool::events::*;
    use openbrush::{
        contracts::access_control::{
            self,
            members::MembersManager,
            *,
        },
        traits::Storage,
    };
    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct LendingPool {
        #[storage_field]
        /// storage used by openbrush's `AccesControl` trait
        access: access_control::Data,
        #[storage_field]
        /// reserve and user datas
        lending_pool: LendingPoolStorage,
    }

    /// Implements openbrushh::ownable
    impl AccessControl for LendingPool {}

    /// Implements core lending methods
    impl LendingPoolDeposit for LendingPool {}
    impl LendingPoolBorrow for LendingPool {}
    impl LendingPoolFlash for LendingPool {}
    impl LendingPoolLiquidate for LendingPool {}
    impl LendingPoolMaintain for LendingPool {}

    /// Implements only_owner action
    impl LendingPoolManage for LendingPool {}

    /// Implements view functions
    impl LendingPoolView for LendingPool {}

    /// Implements interface for Abacus Supply/Deposit token - AToken
    impl LendingPoolATokenInterface for LendingPool {}

    /// Implements interface for Abacus Stable Debt token - SToken
    impl LendingPoolVTokenInterface for LendingPool {}

    /// Implements interface for Abacus Variable Debt token - VToken
    impl LendingPoolSTokenInterface for LendingPool {}

    impl LendingPool {
        #[ink(constructor)]
        pub fn new() -> Self {
            let mut instance = Self::default();
            let caller = instance.env().caller();
            instance._init_with_admin(caller);
            instance.access.members.add(GLOBAL_ADMIN, &caller);
            instance
        }
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
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct RepayVariable {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct BorrowStable {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink(event)]
    pub struct RepayStable {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct FlashLoan {
        #[ink(topic)]
        receiver_address: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        asset: AccountId,
        amount: u128,
        fee: u128,
    }

    #[ink(event)]
    pub struct LiquidateVariable {
        #[ink(topic)]
        liquidator: AccountId,
        #[ink(topic)]
        user: AccountId,
        #[ink(topic)]
        asset_to_rapay: AccountId,
        #[ink(topic)]
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    }

    #[ink(event)]
    pub struct LiquidateStable {
        #[ink(topic)]
        liquidator: AccountId,
        #[ink(topic)]
        user: AccountId,
        #[ink(topic)]
        asset_to_rapay: AccountId,
        #[ink(topic)]
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    }

    #[ink(event)]
    pub struct InterestsAccumulated {
        #[ink(topic)]
        asset: AccountId,
    }

    #[ink(event)]
    pub struct UserInterestsAccumulated {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        user: AccountId,
    }

    #[ink(event)]
    pub struct RateRebalanced {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        user: AccountId,
    }

    #[ink(event)]
    pub struct AssetRegistered {
        #[ink(topic)]
        asset: AccountId,
        decimals: u128,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        stable_rate_base_e24: Option<u128>,
        maximal_total_supply: Option<Balance>,
        maximal_total_debt: Option<Balance>,
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
        maximal_total_supply: Option<Balance>,
        maximal_total_debt: Option<Balance>,
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

    impl EmitDepositEvents for LendingPool {
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

    impl EmitBorrowEvents for LendingPool {
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

        fn _emit_borrow_stable_event(
            &mut self,
            asset: AccountId,
            caller: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
        ) {
            self.env().emit_event(BorrowStable {
                asset,
                caller,
                on_behalf_of,
                amount,
            });
        }

        fn _emit_repay_stable_event(
            &mut self,
            asset: AccountId,
            caller: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
        ) {
            self.env().emit_event(RepayStable {
                asset,
                caller,
                on_behalf_of,
                amount,
            });
        }
    }

    impl EmitFlashEvents for LendingPool {
        fn _emit_flash_loan_event(
            &mut self,
            receiver_address: AccountId,
            caller: AccountId,
            asset: AccountId,
            amount: u128,
            fee: u128,
        ) {
            self.env().emit_event(FlashLoan {
                receiver_address,
                caller,
                asset,
                amount,
                fee,
            });
        }
    }

    impl EmitMaintainEvents for LendingPool {
        fn _emit_accumulate_interest_event(&mut self, asset: &AccountId) {
            self.env().emit_event(InterestsAccumulated { asset: *asset });
        }
        fn _emit_accumulate_user_interest_event(&mut self, asset: &AccountId, user: &AccountId) {
            self.env().emit_event(UserInterestsAccumulated {
                asset: *asset,
                user: *user,
            });
        }
        fn _emit_rebalance_rate_event(&mut self, asset: &AccountId, user: &AccountId) {
            self.env().emit_event(RateRebalanced {
                asset: *asset,
                user: *user,
            })
        }
    }

    impl EmitManageEvents for LendingPool {
        fn _emit_asset_registered_event(
            &mut self,
            asset: &AccountId,
            decimals: u128,
            collateral_coefficient_e6: Option<u128>,
            borrow_coefficient_e6: Option<u128>,
            stable_rate_base_e24: Option<u128>,
            maximal_total_supply: Option<Balance>,
            maximal_total_debt: Option<Balance>,
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
                maximal_total_supply,
                maximal_total_debt,
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

        fn _emit_reserve_parameters_changed_event(
            &mut self,
            asset: &AccountId,
            interest_rate_model: &[u128; 7],
            collateral_coefficient_e6: Option<u128>,
            borrow_coefficient_e6: Option<u128>,
            stable_rate_base_e24: Option<u128>,
            maximal_total_supply: Option<Balance>,
            maximal_total_debt: Option<Balance>,
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
                maximal_total_supply,
                maximal_total_debt,
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
