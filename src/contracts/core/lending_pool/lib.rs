// SPDX-License-Identifier: BUSL-1.1
//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide accounts the follwoing functionalities:
//!   deposit, withdraw, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of account deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(AccessControl, SetCodeHash)]
#[ink::contract]
pub mod lending_pool {
    use abax_contracts::account_registrar::AccountRegistrarView;
    use abax_contracts::lending_pool::SetReserveFeesArgs;
    use abax_contracts::lending_pool::{
        events::FlashLoanFeeChanged, DecimalMultiplier,
        LendingPoolATokenInterface, LendingPoolActions, LendingPoolError,
        LendingPoolFlash, LendingPoolMaintain, LendingPoolManage,
        LendingPoolVTokenInterface, LendingPoolView, MarketRule, RuleId,
    };
    use abax_contracts::{
        account_registrar::implementation::AccountRegistrar,
        lending_pool::implementation::{
            LendingPoolATokenInterfaceImpl, LendingPoolBorrowImpl,
            LendingPoolDepositImpl, LendingPoolFlashImpl,
            LendingPoolLiquidateImpl, LendingPoolMaintainImpl,
            LendingPoolMultiOpImpl, LendingPoolStorage,
            LendingPoolVTokenInterfaceImpl, LendingPoolViewImpl,
            {LendingPoolManageImpl, ManageInternal},
        },
    };
    use abax_library::structs::{
        AccountConfig, AccountReserveData, Action, AssetRules,
        InterestRateModel, InterestRateModelParams, ReserveAbacusTokens,
        ReserveData, ReserveFees, ReserveIndexes, ReserveRestrictions, TwEntry,
        TwIndex,
    };
    use ink::{env::DefaultEnvironment, prelude::vec::Vec};

    use pendzl::{contracts::access_control, traits::String};
    /// storage of the contract
    #[ink(storage)]
    #[derive(Default, pendzl::traits::StorageFieldGetter)]
    pub struct LendingPool {
        #[storage_field]
        access: access_control::AccessControlData,
        #[storage_field]
        lending_pool: LendingPoolStorage,
        #[storage_field]
        account_registrar: AccountRegistrar,
    }

    impl LendingPoolDepositImpl for LendingPool {}
    impl LendingPoolBorrowImpl for LendingPool {}
    impl LendingPoolLiquidateImpl for LendingPool {}
    impl LendingPoolMultiOpImpl for LendingPool {}

    impl LendingPoolActions for LendingPool {
        #[ink(message)]
        fn choose_market_rule(
            &mut self,
            market_rule_id: RuleId,
        ) -> Result<(), LendingPoolError> {
            LendingPoolBorrowImpl::choose_market_rule(self, market_rule_id)
        }
        #[ink(message)]
        fn set_as_collateral(
            &mut self,
            asset: AccountId,
            use_as_collateral: bool,
        ) -> Result<(), LendingPoolError> {
            self.account_registrar
                .ensure_registered(&self.env().caller());
            LendingPoolBorrowImpl::set_as_collateral(
                self,
                asset,
                use_as_collateral,
            )
        }
        #[ink(message)]
        fn deposit(
            &mut self,
            asset: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
            data: Vec<u8>,
        ) -> Result<(), LendingPoolError> {
            LendingPoolDepositImpl::deposit(
                self,
                asset,
                on_behalf_of,
                amount,
                data,
            )
        }
        #[ink(message)]
        fn withdraw(
            &mut self,
            asset: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
            data: Vec<u8>,
        ) -> Result<Balance, LendingPoolError> {
            LendingPoolDepositImpl::withdraw(
                self,
                asset,
                on_behalf_of,
                amount,
                data,
            )
        }

        #[ink(message)]
        fn borrow(
            &mut self,
            asset: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
            data: Vec<u8>,
        ) -> Result<(), LendingPoolError> {
            LendingPoolBorrowImpl::borrow(
                self,
                asset,
                on_behalf_of,
                amount,
                data,
            )
        }
        #[ink(message)]
        fn repay(
            &mut self,
            asset: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
            data: Vec<u8>,
        ) -> Result<Balance, LendingPoolError> {
            LendingPoolBorrowImpl::repay(
                self,
                asset,
                on_behalf_of,
                amount,
                data,
            )
        }

        #[ink(message)]
        fn multi_op(
            &mut self,
            actions: Vec<Action>,
            on_behalf_of: AccountId,
            data: Vec<u8>,
        ) -> Result<(), LendingPoolError> {
            LendingPoolMultiOpImpl::multi_op(self, actions, on_behalf_of, data)
        }

        #[ink(message)]
        fn liquidate(
            &mut self,
            liquidated_account: AccountId,
            asset_to_repay: AccountId,
            asset_to_take: AccountId,
            amount_to_repay: Balance,
            minimum_recieved_for_one_repaid_token_e18: u128,
            #[allow(unused_variables)] data: Vec<u8>,
        ) -> Result<(Balance, Balance), LendingPoolError> {
            let res = LendingPoolLiquidateImpl::liquidate(
                self,
                liquidated_account,
                asset_to_repay,
                asset_to_take,
                amount_to_repay,
                minimum_recieved_for_one_repaid_token_e18,
                data,
            )?;

            Ok(res)
        }
    }

    impl LendingPoolFlashImpl for LendingPool {}
    impl LendingPoolFlash for LendingPool {
        #[ink(message)]
        fn flash_loan(
            &mut self,
            receiver: AccountId,
            assets: Vec<AccountId>,
            amounts: Vec<Balance>,
            receiver_params: Vec<u8>,
        ) -> Result<(), LendingPoolError> {
            LendingPoolFlashImpl::flash_loan(
                self,
                receiver,
                assets,
                amounts,
                receiver_params,
            )
        }
    }

    impl LendingPoolMaintainImpl for LendingPool {}
    impl LendingPoolMaintain for LendingPool {
        #[ink(message)]
        fn accumulate_interest(
            &mut self,
            asset: AccountId,
        ) -> Result<(), LendingPoolError> {
            LendingPoolMaintainImpl::accumulate_interest(self, asset)
        }

        #[ink(message)]
        fn adjust_rate_at_target(
            &mut self,
            asset: AccountId,
            guessed_index: u32,
        ) -> Result<u64, LendingPoolError> {
            LendingPoolMaintainImpl::adjust_rate_at_target(
                self,
                asset,
                guessed_index,
            )
        }
    }
    impl ManageInternal for LendingPool {}
    impl LendingPoolManageImpl for LendingPool {}
    impl LendingPoolManage for LendingPool {
        #[ink(message)]
        fn set_price_feed_provider(
            &mut self,
            price_feed_provider: AccountId,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_price_feed_provider(
                self,
                price_feed_provider,
            )
        }

        #[ink(message)]
        fn set_fee_reduction_provider(
            &mut self,
            fee_reduction_provider: AccountId,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_fee_reduction_provider(
                self,
                fee_reduction_provider,
            )
        }

        #[ink(message)]
        fn set_flash_loan_fee_e6(
            &mut self,
            flash_loan_fee_e6: u128,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_flash_loan_fee_e6(
                self,
                flash_loan_fee_e6,
            )
        }

        #[ink(message)]
        fn register_asset(
            &mut self,
            asset: AccountId,
            a_token_code_hash: [u8; 32],
            v_token_code_hash: [u8; 32],
            name: String,
            symbol: String,
            decimals: u8,
            asset_rules: AssetRules,
            reserve_restrictions: ReserveRestrictions,
            reserve_fees: SetReserveFeesArgs,
            interest_rate_model: Option<InterestRateModelParams>,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::register_asset(
                self,
                asset,
                a_token_code_hash,
                v_token_code_hash,
                name,
                symbol,
                decimals,
                asset_rules,
                reserve_restrictions,
                reserve_fees,
                interest_rate_model,
            )
        }

        #[ink(message)]
        fn set_reserve_is_active(
            &mut self,
            asset: AccountId,
            active: bool,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_reserve_is_active(self, asset, active)
        }

        #[ink(message)]
        fn set_reserve_is_frozen(
            &mut self,
            asset: AccountId,
            freeze: bool,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_reserve_is_frozen(self, asset, freeze)
        }

        #[ink(message)]
        fn set_interest_rate_model(
            &mut self,
            asset: AccountId,
            interest_rate_model: InterestRateModelParams,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_interest_rate_model(
                self,
                asset,
                interest_rate_model,
            )
        }

        #[ink(message)]
        fn set_reserve_restrictions(
            &mut self,
            asset: AccountId,
            reserve_restrictions: ReserveRestrictions,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_reserve_restrictions(
                self,
                asset,
                reserve_restrictions,
            )
        }

        #[ink(message)]
        fn set_reserve_fees(
            &mut self,
            asset: AccountId,
            reserve_fees: SetReserveFeesArgs,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_reserve_fees(self, asset, reserve_fees)
        }

        #[ink(message)]
        fn add_market_rule(
            &mut self,
            market_rule: MarketRule,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::add_market_rule(self, market_rule)
        }

        #[ink(message)]
        fn modify_asset_rule(
            &mut self,
            market_rule_id: RuleId,
            asset: AccountId,
            asset_rules: AssetRules,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::modify_asset_rule(
                self,
                market_rule_id,
                asset,
                asset_rules,
            )
        }

        #[ink(message)]
        fn take_protocol_income(
            &mut self,
            assets: Option<Vec<AccountId>>,
            to: AccountId,
        ) -> Result<Vec<(AccountId, Balance)>, LendingPoolError> {
            LendingPoolManageImpl::take_protocol_income(self, assets, to)
        }

        #[ink(message)]
        fn set_stablecoin_debt_rate_e18(
            &mut self,
            asset: AccountId,
            debt_rate_e18: u64,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_stablecoin_debt_rate_e18(
                self,
                asset,
                debt_rate_e18,
            )
        }
    }
    impl LendingPoolViewImpl for LendingPool {}
    impl LendingPoolView for LendingPool {
        #[ink(message)]
        fn view_flash_loan_fee_e6(&self) -> u128 {
            LendingPoolViewImpl::view_flash_loan_fee_e6(self)
        }
        #[ink(message)]
        fn view_asset_id(&self, account: AccountId) -> Option<RuleId> {
            LendingPoolViewImpl::view_asset_id(self, account)
        }

        #[ink(message)]
        fn view_registered_assets(&self) -> Vec<AccountId> {
            LendingPoolViewImpl::view_registered_assets(self)
        }
        #[ink(message)]
        fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData> {
            LendingPoolViewImpl::view_reserve_data(self, asset)
        }
        #[ink(message)]
        fn view_unupdated_reserve_indexes(
            &self,
            asset: AccountId,
        ) -> Option<ReserveIndexes> {
            LendingPoolViewImpl::view_unupdated_reserve_indexes(self, asset)
        }
        #[ink(message)]
        fn view_interest_rate_model(
            &self,
            asset: AccountId,
        ) -> Option<InterestRateModel> {
            LendingPoolViewImpl::view_interest_rate_model(self, asset)
        }
        #[ink(message)]
        fn view_reserve_restrictions(
            &self,
            asset: AccountId,
        ) -> Option<ReserveRestrictions> {
            LendingPoolViewImpl::view_reserve_restrictions(self, asset)
        }
        #[ink(message)]
        fn view_reserve_tokens(
            &self,
            asset: AccountId,
        ) -> Option<ReserveAbacusTokens> {
            LendingPoolViewImpl::view_reserve_tokens(self, asset)
        }
        #[ink(message)]
        fn view_reserve_decimal_multiplier(
            &self,
            asset: AccountId,
        ) -> Option<DecimalMultiplier> {
            LendingPoolViewImpl::view_reserve_decimal_multiplier(self, asset)
        }
        #[ink(message)]
        fn view_reserve_indexes(
            &self,
            asset: AccountId,
        ) -> Option<ReserveIndexes> {
            LendingPoolViewImpl::view_reserve_indexes(self, asset)
        }

        #[ink(message)]
        fn view_reserve_fees(&self, asset: AccountId) -> Option<ReserveFees> {
            LendingPoolViewImpl::view_reserve_fees(self, asset)
        }

        #[ink(message)]
        fn view_unupdated_account_reserve_data(
            &self,
            asset: AccountId,
            account: AccountId,
        ) -> AccountReserveData {
            LendingPoolViewImpl::view_unupdated_account_reserve_data(
                self, asset, account,
            )
        }
        #[ink(message)]
        fn view_account_reserve_data(
            &self,
            asset: AccountId,
            account: AccountId,
        ) -> AccountReserveData {
            LendingPoolViewImpl::view_account_reserve_data(self, asset, account)
        }
        #[ink(message)]
        fn view_account_config(&self, account: AccountId) -> AccountConfig {
            LendingPoolViewImpl::view_account_config(self, account)
        }
        #[ink(message)]
        fn view_market_rule(
            &self,
            market_rule_id: RuleId,
        ) -> Option<MarketRule> {
            LendingPoolViewImpl::view_market_rule(self, market_rule_id)
        }
        #[ink(message)]
        fn get_account_free_collateral_coefficient(
            &self,
            account_address: AccountId,
        ) -> (bool, u128) {
            LendingPoolViewImpl::get_account_free_collateral_coefficient(
                self,
                account_address,
            )
        }

        #[ink(message)]
        fn view_protocol_income(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, Balance)> {
            LendingPoolViewImpl::view_protocol_income(self, assets)
        }

        #[ink(message)]
        fn view_asset_tw_index(&self, asset: AccountId) -> Option<TwIndex> {
            LendingPoolViewImpl::view_asset_tw_index(self, asset)
        }
        #[ink(message)]
        fn view_asset_tw_entries(
            &self,
            asset: AccountId,
            from: u32,
            to: u32,
        ) -> Vec<Option<TwEntry>> {
            LendingPoolViewImpl::view_asset_tw_entries(self, asset, from, to)
        }

        #[ink(message)]
        fn view_tw_ur_from_period_longer_than(
            &self,
            period: u64,
            asset: AccountId,
            guessed_index: u32,
        ) -> Result<u32, LendingPoolError> {
            LendingPoolViewImpl::view_tw_ur_from_period_longer_than(
                self,
                period,
                asset,
                guessed_index,
            )
        }
    }

    impl AccountRegistrarView for LendingPool {
        #[ink(message)]
        fn view_counter_to_account(&self, counter: u128) -> Option<AccountId> {
            self.account_registrar.counter_to_account.get(counter)
        }
        #[ink(message)]
        fn view_account_to_counter(&self, account: AccountId) -> Option<u128> {
            self.account_registrar.account_to_counter.get(account)
        }
        #[ink(message)]
        fn view_next_counter(&self) -> u128 {
            self.account_registrar.next_counter
        }
    }

    impl LendingPoolATokenInterfaceImpl for LendingPool {}
    impl LendingPoolATokenInterface for LendingPool {
        #[ink(message)]
        fn total_deposit_of(&self, underlying_asset: AccountId) -> Balance {
            LendingPoolATokenInterfaceImpl::total_deposit_of(
                self,
                underlying_asset,
            )
        }
        #[ink(message)]
        fn account_deposit_of(
            &self,
            underlying_asset: AccountId,
            account: AccountId,
        ) -> Balance {
            LendingPoolATokenInterfaceImpl::account_deposit_of(
                self,
                underlying_asset,
                account,
            )
        }
        #[ink(message)]
        fn transfer_deposit_from_to(
            &mut self,
            underlying_asset: AccountId,
            from: AccountId,
            to: AccountId,
            amount: Balance,
        ) -> Result<(Balance, Balance), LendingPoolError> {
            LendingPoolATokenInterfaceImpl::transfer_deposit_from_to(
                self,
                underlying_asset,
                from,
                to,
                amount,
            )
        }
    }

    impl LendingPoolVTokenInterfaceImpl for LendingPool {}
    impl LendingPoolVTokenInterface for LendingPool {
        #[ink(message)]
        fn total_debt_of(&self, underlying_asset: AccountId) -> Balance {
            LendingPoolVTokenInterfaceImpl::total_debt_of(
                self,
                underlying_asset,
            )
        }
        #[ink(message)]
        fn account_debt_of(
            &self,
            underlying_asset: AccountId,
            account: AccountId,
        ) -> Balance {
            LendingPoolVTokenInterfaceImpl::account_debt_of(
                self,
                underlying_asset,
                account,
            )
        }
        #[ink(message)]
        fn transfer_debt_from_to(
            &mut self,
            underlying_asset: AccountId,
            from: AccountId,
            to: AccountId,
            amount: Balance,
        ) -> Result<(Balance, Balance), LendingPoolError> {
            LendingPoolVTokenInterfaceImpl::transfer_debt_from_to(
                self,
                underlying_asset,
                from,
                to,
                amount,
            )
        }
    }

    impl LendingPool {
        #[ink(constructor)]
        pub fn new() -> Self {
            let mut instance = Self::default();
            let caller = instance.env().caller();
            instance.lending_pool.next_asset_id.set(&0);
            instance.lending_pool.next_rule_id.set(&0);
            instance.lending_pool.flash_loan_fee_e6.set(&1000);
            ink::env::emit_event::<DefaultEnvironment, FlashLoanFeeChanged>(
                FlashLoanFeeChanged {
                    flash_loan_fee_e6: 1000,
                },
            );
            instance
                ._grant_role(Self::_default_admin(), Some(caller))
                .expect("caller should become admin");
            instance
        }
    }
}
