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
        // #[storage_field]
        // /// storage used by openbrush's `Ownable` trait
        // ownable: ownable::Data,
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
        stable_rate: u128,
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
    pub struct ChoseRule {
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        chosen_rule: u64,
    }
    #[ink(event)]
    pub struct AssetRegistered {
        #[ink(topic)]
        asset: AccountId,
    }

    #[ink(event)]
    pub struct RuleAdded {
        #[ink(topic)]
        rule_id: u64,
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
            stable_rate: u128,
        ) {
            self.env().emit_event(BorrowStable {
                asset,
                caller,
                on_behalf_of,
                amount,
                stable_rate,
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

    impl EmitConfigureEvents for LendingPool {
        default fn _emit_choose_rule_event(&mut self, caller: AccountId, chosen_rule: u64) {
            self.env().emit_event(ChoseRule { caller, chosen_rule });
        }
    }

    impl EmitManageEvents for LendingPool {
        default fn _emit_asset_registered_event(&mut self, asset: AccountId) {
            self.env().emit_event(AssetRegistered { asset });
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
}
