//! #LendingPoolContract
//!
//! This is the core contract of Abacus Lending Protocol that provide users the follwoing functionalities:
//!   deposit, redeem, borrow_variable, repay_variable, borrow_stable, repay_stable
//!
//! The remaining contracts are Abacus Tokens that are tokenization of user deposits and debts.

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(AccessControl)]
#[ink::contract]
pub mod lending_pool {
    use abax_impls::lending_pool::{
        a_token_interface::LendingPoolATokenInterfaceImpl,
        borrow::LendingPoolBorrowImpl,
        deposit::LendingPoolDepositImpl,
        flash::LendingPoolFlashImpl,
        liquidate::LendingPoolLiquidateImpl,
        maintain::LendingPoolMaintainImpl,
        manage::{LendingPoolManageImpl, ManageInternal},
        storage::{AccountRegistrar, LendingPoolStorage},
        v_token_interface::LendingPoolVTokenInterfaceImpl,
        view::LendingPoolViewImpl,
    };
    use abax_library::structs::{
        AssetRules, ReserveAbacusTokens, ReserveData, ReserveFees,
        ReserveIndexes, ReserveRestrictions, UserConfig, UserReserveData,
    };
    use abax_traits::lending_pool::{
        AccountRegistrarView, DecimalMultiplier, EmitBorrowEvents,
        EmitDepositEvents, EmitFlashEvents, EmitLiquidateEvents,
        EmitMaintainEvents, EmitManageEvents, InterestRateModel,
        LendingPoolATokenInterface, LendingPoolBorrow, LendingPoolDeposit,
        LendingPoolError, LendingPoolFlash, LendingPoolLiquidate,
        LendingPoolMaintain, LendingPoolManage, LendingPoolVTokenInterface,
        LendingPoolView, MarketRule, RuleId, ROLE_ADMIN,
    };
    use ink::{codegen::Env, env::DefaultEnvironment, prelude::vec::Vec};

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

    /// Implements core lending methods
    impl LendingPoolDepositImpl for LendingPool {}
    impl LendingPoolDeposit for LendingPool {
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
        fn redeem(
            &mut self,
            asset: AccountId,
            on_behalf_of: AccountId,
            amount: Balance,
            data: Vec<u8>,
        ) -> Result<Balance, LendingPoolError> {
            LendingPoolDepositImpl::redeem(
                self,
                asset,
                on_behalf_of,
                amount,
                data,
            )
        }
    }

    impl LendingPoolBorrowImpl for LendingPool {}
    impl LendingPoolBorrow for LendingPool {
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
    impl LendingPoolLiquidateImpl for LendingPool {}
    impl LendingPoolLiquidate for LendingPool {
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
    impl LendingPoolMaintainImpl for LendingPool {}
    impl LendingPoolMaintain for LendingPool {
        #[ink(message)]
        fn accumulate_interest(
            &mut self,
            asset: AccountId,
        ) -> Result<(), LendingPoolError> {
            LendingPoolMaintainImpl::accumulate_interest(self, asset)
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
            reserve_fees: ReserveFees,
            interest_rate_model: Option<InterestRateModel>,
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
        fn set_reserve_is_freezed(
            &mut self,
            asset: AccountId,
            freeze: bool,
        ) -> Result<(), LendingPoolError> {
            LendingPoolManageImpl::set_reserve_is_freezed(self, asset, freeze)
        }

        #[ink(message)]
        fn set_interest_rate_model(
            &mut self,
            asset: AccountId,
            interest_rate_model: InterestRateModel,
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
            reserve_fees: ReserveFees,
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
        ) -> Result<Vec<(AccountId, i128)>, LendingPoolError> {
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
        fn view_unupdated_user_reserve_data(
            &self,
            asset: AccountId,
            account: AccountId,
        ) -> UserReserveData {
            LendingPoolViewImpl::view_unupdated_user_reserve_data(
                self, asset, account,
            )
        }
        #[ink(message)]
        fn view_user_reserve_data(
            &self,
            asset: AccountId,
            account: AccountId,
        ) -> UserReserveData {
            LendingPoolViewImpl::view_user_reserve_data(self, asset, account)
        }
        #[ink(message)]
        fn view_user_config(&self, user: AccountId) -> UserConfig {
            LendingPoolViewImpl::view_user_config(self, user)
        }
        #[ink(message)]
        fn view_market_rule(
            &self,
            market_rule_id: RuleId,
        ) -> Option<MarketRule> {
            LendingPoolViewImpl::view_market_rule(self, market_rule_id)
        }
        #[ink(message)]
        fn get_user_free_collateral_coefficient(
            &self,
            user_address: AccountId,
        ) -> (bool, u128) {
            LendingPoolViewImpl::get_user_free_collateral_coefficient(
                self,
                user_address,
            )
        }

        #[ink(message)]
        fn view_protocol_income(
            &self,
            assets: Option<Vec<AccountId>>,
        ) -> Vec<(AccountId, i128)> {
            LendingPoolViewImpl::view_protocol_income(self, assets)
        }
    }

    impl AccountRegistrarView for LendingPool {
        #[ink(message)]
        fn view_counter_to_user(&self, counter: u128) -> Option<AccountId> {
            self.account_registrar.counter_to_user.get(counter)
        }
        #[ink(message)]
        fn view_user_to_counter(&self, user: AccountId) -> Option<u128> {
            self.account_registrar.user_to_counter.get(user)
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
        fn user_deposit_of(
            &self,
            underlying_asset: AccountId,
            user: AccountId,
        ) -> Balance {
            LendingPoolATokenInterfaceImpl::user_deposit_of(
                self,
                underlying_asset,
                user,
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
        fn user_debt_of(
            &self,
            underlying_asset: AccountId,
            user: AccountId,
        ) -> Balance {
            LendingPoolVTokenInterfaceImpl::user_debt_of(
                self,
                underlying_asset,
                user,
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
            instance._emit_flash_loan_fee_e6_changed_event(&1000);
            instance
                ._grant_role(Self::_default_admin(), Some(caller))
                .expect("caller should become admin");
            instance
        }

        #[ink(message)]
        pub fn set_code(
            &mut self,
            code_hash: [u8; 32],
        ) -> Result<(), LendingPoolError> {
            access_control::AccessControlInternal::_ensure_has_role(
                self,
                ROLE_ADMIN,
                Some(Self::env().caller()),
            )?;
            ink::env::set_code_hash::<DefaultEnvironment>(&code_hash.into())
                .unwrap_or_else(|err| {
                    panic!(
                        "Failed to `set_code_hash` to {:?} due to {:?}",
                        code_hash, err
                    )
                });

            Ok(())
        }
    }

    #[ink::event]
    pub struct Deposit {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink::event]
    pub struct Redeem {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }

    #[ink::event]
    pub struct MarketRuleChosen {
        #[ink(topic)]
        user: AccountId,
        market_rule_id: RuleId,
    }

    #[ink::event]
    pub struct CollateralSet {
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        asset: AccountId,
        set: bool,
    }

    #[ink::event]
    pub struct BorrowVariable {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }
    #[ink::event]
    pub struct RepayVariable {
        #[ink(topic)]
        asset: AccountId,
        caller: AccountId,
        #[ink(topic)]
        on_behalf_of: AccountId,
        amount: Balance,
    }

    #[ink::event]
    pub struct FlashLoan {
        #[ink(topic)]
        receiver: AccountId,
        #[ink(topic)]
        caller: AccountId,
        #[ink(topic)]
        asset: AccountId,
        amount: u128,
        fee: u128,
    }

    #[ink::event]
    pub struct Liquidation {
        liquidator: AccountId,
        #[ink(topic)]
        user: AccountId,
        #[ink(topic)]
        asset_to_repay: AccountId,
        #[ink(topic)]
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    }
    #[ink::event]
    pub struct InterestsAccumulated {
        #[ink(topic)]
        asset: AccountId,
    }

    #[ink::event]
    pub struct UserInterestsAccumulated {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        user: AccountId,
    }

    #[ink::event]
    pub struct RateRebalanced {
        #[ink(topic)]
        asset: AccountId,
        #[ink(topic)]
        user: AccountId,
    }

    #[ink::event]
    pub struct AssetRegistered {
        #[ink(topic)]
        asset: AccountId,
        decimals: u8,
        name: String,
        symbol: String,
        a_token_code_hash: [u8; 32],
        v_token_code_hash: [u8; 32],
        a_token_address: AccountId,
        v_token_address: AccountId,
    }

    #[ink::event]
    pub struct PriceFeedProviderChanged {
        price_feed_provider: AccountId,
    }
    #[ink::event]
    pub struct FlashLoanFeeChanged {
        flash_loan_fee_e6: u128,
    }

    #[ink::event]
    pub struct ReserveActivated {
        #[ink(topic)]
        asset: AccountId,
        active: bool,
    }

    #[ink::event]
    pub struct ReserveFreezed {
        #[ink(topic)]
        asset: AccountId,
        freezed: bool,
    }

    #[ink::event]
    pub struct ReserveInterestRateModelChanged {
        #[ink(topic)]
        asset: AccountId,
        interest_rate_model: InterestRateModel,
    }

    #[ink::event]
    pub struct ReserveRestrictionsChanged {
        #[ink(topic)]
        asset: AccountId,
        reserve_restrictions: ReserveRestrictions,
    }

    #[ink::event]
    pub struct ReserveFeesChanged {
        #[ink(topic)]
        asset: AccountId,
        reserve_fees: ReserveFees,
    }

    #[ink::event]
    pub struct AssetRulesChanged {
        #[ink(topic)]
        market_rule_id: RuleId,
        #[ink(topic)]
        asset: AccountId,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        penalty_e6: Option<u128>,
    }

    #[ink::event]
    pub struct IncomeTaken {
        #[ink(topic)]
        asset: AccountId,
    }

    #[ink::event]
    pub struct StablecoinDebtRateChanged {
        #[ink(topic)]
        asset: AccountId,
        debt_rate_e18: u64,
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
        fn _emit_market_rule_chosen(
            &mut self,
            user: &AccountId,
            market_rule_id: &RuleId,
        ) {
            self.env().emit_event(MarketRuleChosen {
                user: *user,
                market_rule_id: *market_rule_id,
            });
        }
        fn _emit_collateral_set_event(
            &mut self,
            asset: AccountId,
            caller: AccountId,
            set: bool,
        ) {
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

    impl EmitFlashEvents for LendingPool {
        fn _emit_flash_loan_event(
            &mut self,
            receiver: AccountId,
            caller: AccountId,
            asset: AccountId,
            amount: u128,
            fee: u128,
        ) {
            self.env().emit_event(FlashLoan {
                receiver,
                caller,
                asset,
                amount,
                fee,
            });
        }
    }

    impl EmitMaintainEvents for LendingPool {
        fn _emit_accumulate_interest_event(&mut self, asset: &AccountId) {
            self.env()
                .emit_event(InterestsAccumulated { asset: *asset });
        }
        fn _emit_accumulate_user_interest_event(
            &mut self,
            asset: &AccountId,
            user: &AccountId,
        ) {
            self.env().emit_event(UserInterestsAccumulated {
                asset: *asset,
                user: *user,
            });
        }
        fn _emit_rebalance_rate_event(
            &mut self,
            asset: &AccountId,
            user: &AccountId,
        ) {
            self.env().emit_event(RateRebalanced {
                asset: *asset,
                user: *user,
            })
        }
    }

    impl EmitManageEvents for LendingPool {
        fn _emit_price_feed_provider_changed_event(
            &mut self,
            price_feed_provider: &AccountId,
        ) {
            self.env().emit_event(PriceFeedProviderChanged {
                price_feed_provider: *price_feed_provider,
            })
        }
        fn _emit_flash_loan_fee_e6_changed_event(
            &mut self,
            flash_loan_fee_e6: &u128,
        ) {
            self.env().emit_event(FlashLoanFeeChanged {
                flash_loan_fee_e6: *flash_loan_fee_e6,
            })
        }
        fn _emit_asset_registered_event(
            &mut self,
            asset: &AccountId,
            name: String,
            symbol: String,
            decimals: u8,
            a_token_code_hash: &[u8; 32],
            v_token_code_hash: &[u8; 32],
            a_token_address: &AccountId,
            v_token_address: &AccountId,
        ) {
            self.env().emit_event(AssetRegistered {
                asset: *asset,
                name,
                symbol,
                decimals,
                a_token_code_hash: *a_token_code_hash,
                v_token_code_hash: *v_token_code_hash,
                a_token_address: *a_token_address,
                v_token_address: *v_token_address,
            })
        }

        fn _emit_reserve_activated_event(
            &mut self,
            asset: &AccountId,
            active: bool,
        ) {
            self.env().emit_event(ReserveActivated {
                asset: *asset,
                active,
            });
        }
        fn _emit_reserve_freezed_event(
            &mut self,
            asset: &AccountId,
            freezed: bool,
        ) {
            self.env().emit_event(ReserveFreezed {
                asset: *asset,
                freezed,
            })
        }

        fn _emit_interest_rate_model_changed_event(
            &mut self,
            asset: &AccountId,
            interest_rate_model: &InterestRateModel,
        ) {
            self.env().emit_event(ReserveInterestRateModelChanged {
                asset: *asset,
                interest_rate_model: *interest_rate_model,
            })
        }

        fn _emit_reserve_fees_changed_event(
            &mut self,
            asset: &AccountId,
            reserve_fees: &ReserveFees,
        ) {
            self.env().emit_event(ReserveFeesChanged {
                asset: *asset,
                reserve_fees: *reserve_fees,
            })
        }

        fn _emit_reserve_restrictions_changed_event(
            &mut self,
            asset: &AccountId,
            reserve_restrictions: ReserveRestrictions,
        ) {
            self.env().emit_event(ReserveRestrictionsChanged {
                asset: *asset,
                reserve_restrictions,
            })
        }
        fn _emit_asset_rules_changed_event(
            &mut self,
            market_rule_id: &u32,
            asset: &AccountId,
            asset_rules: &AssetRules,
        ) {
            self.env().emit_event(AssetRulesChanged {
                market_rule_id: *market_rule_id,
                asset: *asset,
                collateral_coefficient_e6: asset_rules
                    .collateral_coefficient_e6,
                borrow_coefficient_e6: asset_rules.borrow_coefficient_e6,
                penalty_e6: asset_rules.penalty_e6,
            })
        }

        fn _emit_income_taken(&mut self, asset: &AccountId) {
            self.env().emit_event(IncomeTaken { asset: *asset });
        }

        fn _emit_stablecoin_debt_rate_changed(
            &mut self,
            asset: &AccountId,
            debt_rate_e18: &u64,
        ) {
            self.env().emit_event(StablecoinDebtRateChanged {
                asset: *asset,
                debt_rate_e18: *debt_rate_e18,
            })
        }
    }
    impl EmitLiquidateEvents for LendingPool {
        fn _emit_liquidation_variable_event(
            &mut self,
            liquidator: AccountId,
            user: AccountId,
            asset_to_repay: AccountId,
            asset_to_take: AccountId,
            amount_repaid: Balance,
            amount_taken: Balance,
        ) {
            self.env().emit_event(Liquidation {
                liquidator,
                user,
                asset_to_repay,
                asset_to_take,
                amount_repaid,
                amount_taken,
            });
        }
    }
}
