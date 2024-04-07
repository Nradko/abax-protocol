use crate::{
    fee_reduction::{FeeReduction, FeeReductionRef},
    lending_pool::{
        DecimalMultiplier, InterestRateModel, LendingPoolError, MarketRule,
        RuleId,
    },
    price_feed::{PriceFeed, PriceFeedRef},
};
use abax_library::{
    math::{
        calculate_amount_to_take, calculate_asset_amount_value_e8,
        e8_mul_e6_to_e6_rdown,
    },
    structs::{
        AccountConfig, AccountReserveData, Action, AssetId, AssetRules,
        FeeReductions, Operation, ReserveAbacusTokens, ReserveData,
        ReserveFees, ReserveIndexesAndFees, ReserveRestrictions,
    },
};
use ink::storage::Mapping;
use ink::{env::DefaultEnvironment, prelude::vec, prelude::vec::Vec};
use pendzl::{
    math::errors::MathError,
    traits::{AccountId, Balance, Timestamp},
};

#[derive(Debug)]
pub enum ReserveAction<'a> {
    Deposit(u32, &'a Balance),
    Withdraw(u32, &'a mut Balance, bool),
    Borrow(u32, &'a Balance),
    Repay(u32, &'a mut Balance),
    DepositTransfer(u32, u32, &'a mut Balance, bool),
    DebtTransfer(u32, u32, &'a mut Balance, bool),
}

#[derive(Default, Debug)]
#[pendzl::storage_item]
pub struct LendingPoolStorage {
    #[lazy]
    pub price_feed_provider: AccountId,
    #[lazy]
    pub fee_reduction_provider: AccountId,

    #[lazy]
    pub next_asset_id: AssetId,
    pub asset_to_id: Mapping<AccountId, AssetId>,
    pub id_to_asset: Mapping<AssetId, AccountId>,

    #[lazy]
    pub next_rule_id: RuleId,
    pub market_rules: Mapping<RuleId, MarketRule>,

    pub reserve_abacus_tokens: Mapping<AccountId, ReserveAbacusTokens>,

    pub reserve_restrictions: Mapping<AssetId, ReserveRestrictions>,
    pub reserve_indexes_and_fees: Mapping<AssetId, ReserveIndexesAndFees>,
    pub reserve_decimal_multiplier: Mapping<AssetId, DecimalMultiplier>,
    pub reserve_datas: Mapping<AssetId, ReserveData>,
    pub interest_rate_model: Mapping<AssetId, InterestRateModel>,

    /// The AccountReserveData is stored in a vector, where the index is coresponding to the asset_id.
    pub account_reserve_datas:
        Mapping<AccountId, Vec<Option<AccountReserveData>>>,
    pub account_configs: Mapping<AccountId, AccountConfig>,

    #[lazy]
    /// fee that must be paid while taking flash loan. 10^6 = 100%.
    pub flash_loan_fee_e6: u128,
}

/// Holds references to reserve related data used during accounting for actions.
struct ReserveDataContext<'a> {
    asset_id: u32,
    reserve_data: &'a mut ReserveData,
    reserve_indexes_and_fees: &'a mut ReserveIndexesAndFees,
    reserve_restrictions: &'a ReserveRestrictions,
}

/// Used to accumulate interests for each account.
struct InterestsAcc {
    items: Vec<(u128, u128)>,
}

impl InterestsAcc {
    pub fn new(len: usize) -> Self {
        Self {
            items: vec![(0, 0); len],
        }
    }
    pub fn update_at(
        &mut self,
        index: u32,
        interests: (u128, u128),
    ) -> Result<(), MathError> {
        let to_modify = self.items.get_mut(index as usize).unwrap();
        to_modify.0 = to_modify
            .0
            .checked_add(interests.0)
            .ok_or(MathError::Overflow)?;
        to_modify.1 = to_modify
            .1
            .checked_add(interests.1)
            .ok_or(MathError::Overflow)?;
        Ok(())
    }
}

impl LendingPoolStorage {
    /*
    LENDING SECTION - methods responsible for accounting for depositing, withdrawing, borrowing, repaying, liquidating, transferring deposits and debts.
    */

    /// acccount for list of action for one account
    ///
    /// # Note
    /// - This function could be improved to gather acction for the same asset - however many actions on the same asset are rare
    pub fn account_for_account_actions(
        &mut self,
        account: &AccountId,
        actions: &mut [Action],
    ) -> Result<Vec<(u128, u128)>, LendingPoolError> {
        let mut account_datas = self.get_account_datas(account);
        let mut account_config = self.get_account_config(account);
        let fee_reductions = self.get_fee_reductions_of_account(account);

        let timestamp = ink::env::block_timestamp::<DefaultEnvironment>();

        let mut results: Vec<(u128, u128)> = Vec::new();

        let mut must_check_collateralization = false;

        for action in actions.iter_mut() {
            let asset_id = self.asset_id(&action.args.asset)?;
            let account_data =
                get_account_data_entry_mut(&mut account_datas, asset_id);

            match action.op {
                Operation::Deposit => {
                    let res = self.account_for_reserve_action(
                        asset_id,
                        &mut [account_data],
                        &mut [&mut account_config],
                        &[&fee_reductions],
                        &mut [&mut ReserveAction::Deposit(
                            0,
                            &action.args.amount,
                        )],
                        &timestamp,
                    )?;
                    results.push(*res.first().unwrap());
                }
                Operation::Withdraw => {
                    if (account_config.collaterals >> asset_id) & 1 == 1 {
                        must_check_collateralization = true;
                    }
                    let res = self.account_for_reserve_action(
                        asset_id,
                        &mut [account_data],
                        &mut [&mut account_config],
                        &[&fee_reductions],
                        &mut [&mut ReserveAction::Withdraw(
                            0,
                            &mut action.args.amount,
                            true,
                        )],
                        &timestamp,
                    )?;
                    results.push(*res.first().unwrap());
                }
                Operation::Borrow => {
                    must_check_collateralization = true;
                    let res = self.account_for_reserve_action(
                        asset_id,
                        &mut [account_data],
                        &mut [&mut account_config],
                        &[&fee_reductions],
                        &mut [&mut ReserveAction::Borrow(
                            0,
                            &action.args.amount,
                        )],
                        &timestamp,
                    )?;
                    results.push(*res.first().unwrap());
                }
                Operation::Repay => {
                    let res = self.account_for_reserve_action(
                        asset_id,
                        &mut [account_data],
                        &mut [&mut account_config],
                        &[&fee_reductions],
                        &mut [&mut ReserveAction::Repay(
                            0,
                            &mut action.args.amount,
                        )],
                        &timestamp,
                    )?;
                    results.push(*res.first().unwrap());
                }
            }
        }

        // check if there is enought collatera
        if must_check_collateralization {
            self.ensure_collateralized_from_raw(
                &account_datas,
                &account_config,
                &fee_reductions,
            )?;
        }

        self.account_reserve_datas.insert(account, &account_datas);
        self.account_configs.insert(account, &account_config);
        Ok(results)
    }

    /// accounts for one list of ReserveActions
    ///
    /// # Arguments
    /// * `asset_id` - the id of the asset that the actions are acting on.
    /// * `accounts_data` - a list of different accounts' data coresponding to the asset_id.
    /// * `accounts_config` - a list of different accounts' config coresponding to the asset_id, the order (coresponding to accounts) must be the same as in accounts_data
    /// * `actions` - a list of actions that are to be accounted for.
    ///
    /// # Note
    /// - This function does not check collateralization! - it must be done after calling this function on each account that colllateral or debt was changed.
    fn account_for_reserve_action(
        &mut self,
        asset_id: AssetId,
        accounts_data: &mut [&mut AccountReserveData],
        accounts_config: &mut [&mut AccountConfig],
        accounts_fee_reductions: &[&FeeReductions],
        actions: &mut [&mut ReserveAction<'_>],
        timestamp: &Timestamp,
    ) -> Result<Vec<(u128, u128)>, LendingPoolError> {
        if accounts_data.len() != accounts_config.len() {
            panic!();
        }

        let mut reserve_data = self.get_reserve_data(asset_id);
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);
        let reserve_restrictions = self.get_reserve_restrictions(asset_id);

        reserve_indexes_and_fees
            .indexes
            .update(&reserve_data, timestamp)?;

        let mut interests_acc = InterestsAcc::new(accounts_data.len());

        let mut reserve_ctx = ReserveDataContext {
            asset_id,
            reserve_data: &mut reserve_data,
            reserve_indexes_and_fees: &mut reserve_indexes_and_fees,
            reserve_restrictions: &reserve_restrictions,
        };

        for action in actions.iter_mut() {
            match action {
                ReserveAction::Deposit(account_id, amount) => {
                    let interest_res = self.account_for_deposit(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*account_id as usize).unwrap(),
                        accounts_config.get_mut(*account_id as usize).unwrap(),
                        accounts_fee_reductions
                            .get(*account_id as usize)
                            .unwrap(),
                        amount,
                    )?;
                    interests_acc.update_at(*account_id, interest_res)?;
                }
                ReserveAction::Withdraw(
                    account_id,
                    amount,
                    can_mutate_amount,
                ) => {
                    let interest_res = self.account_for_withdraw(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*account_id as usize).unwrap(),
                        accounts_config.get_mut(*account_id as usize).unwrap(),
                        accounts_fee_reductions
                            .get(*account_id as usize)
                            .unwrap(),
                        amount,
                        *can_mutate_amount,
                    )?;
                    interests_acc.update_at(*account_id, interest_res)?;
                }
                ReserveAction::Borrow(account_id, amount) => {
                    let interest_res = self.account_for_borrow(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*account_id as usize).unwrap(),
                        accounts_config.get_mut(*account_id as usize).unwrap(),
                        accounts_fee_reductions
                            .get(*account_id as usize)
                            .unwrap(),
                        amount,
                    )?;
                    interests_acc.update_at(*account_id, interest_res)?;
                }
                ReserveAction::Repay(account_id, amount) => {
                    let interest_res = self.account_for_repay(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*account_id as usize).unwrap(),
                        accounts_config.get_mut(*account_id as usize).unwrap(),
                        accounts_fee_reductions
                            .get(*account_id as usize)
                            .unwrap(),
                        amount,
                        true,
                    )?;
                    interests_acc.update_at(*account_id, interest_res)?;
                }

                ReserveAction::DepositTransfer(
                    from_id,
                    to_id,
                    amount,
                    mutable,
                ) => {
                    let from_interest_res = self.account_for_withdraw(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*from_id as usize).unwrap(),
                        accounts_config.get_mut(*from_id as usize).unwrap(),
                        accounts_fee_reductions.get(*from_id as usize).unwrap(),
                        amount,
                        *mutable,
                    )?;

                    interests_acc.update_at(*from_id, from_interest_res)?;

                    let to_interest_res = self.account_for_deposit(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*to_id as usize).unwrap(),
                        accounts_config.get_mut(*to_id as usize).unwrap(),
                        accounts_fee_reductions.get(*to_id as usize).unwrap(),
                        amount,
                    )?;
                    interests_acc.update_at(*to_id, to_interest_res)?;
                }
                ReserveAction::DebtTransfer(
                    from_id,
                    to_id,
                    amount,
                    mutable,
                ) => {
                    let from_interest_res = self.account_for_repay(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*from_id as usize).unwrap(),
                        accounts_config.get_mut(*from_id as usize).unwrap(),
                        accounts_fee_reductions.get(*from_id as usize).unwrap(),
                        amount,
                        *mutable,
                    )?;
                    interests_acc.update_at(*from_id, from_interest_res)?;

                    let to_interest_res = self.account_for_borrow(
                        &mut reserve_ctx,
                        accounts_data.get_mut(*to_id as usize).unwrap(),
                        accounts_config.get_mut(*to_id as usize).unwrap(),
                        accounts_fee_reductions.get(*to_id as usize).unwrap(),
                        amount,
                    )?;
                    interests_acc.update_at(*to_id, to_interest_res)?;
                }
            }
        }

        if let Some(params) = self.interest_rate_model.get(asset_id) {
            reserve_data.recalculate_current_rates(&params)?
        }

        ink::env::debug_println!(
            "reserve_indexes {:?}",
            reserve_indexes_and_fees
        );

        self.reserve_datas.insert(asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(asset_id, &reserve_indexes_and_fees);

        Ok(interests_acc.items)
    }

    fn account_for_deposit(
        &mut self,
        reserve_ctx: &mut ReserveDataContext,
        account_reserve_data: &mut AccountReserveData,
        account_config: &mut AccountConfig,
        fee_reductions: &FeeReductions,
        amount: &Balance,
    ) -> Result<(u128, u128), LendingPoolError> {
        reserve_ctx.reserve_data.ensure_activated()?;
        reserve_ctx.reserve_data.ensure_not_frozen()?;

        let (
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ): (Balance, Balance) = reserve_ctx.reserve_data.add_interests(
            account_reserve_data.accumulate_account_interest(
                &reserve_ctx.reserve_indexes_and_fees.indexes,
                &mut reserve_ctx.reserve_indexes_and_fees.fees,
                fee_reductions,
            )?,
        )?;
        account_reserve_data.increase_account_deposit(
            &reserve_ctx.asset_id,
            account_config,
            reserve_ctx.reserve_data,
            amount,
        )?;

        reserve_ctx
            .reserve_restrictions
            .ensure_max_total_deposit_not_reached(reserve_ctx.reserve_data)?;

        Ok((
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ))
    }

    fn account_for_withdraw(
        &mut self,
        reserve_ctx: &mut ReserveDataContext,
        account_reserve_data: &mut AccountReserveData,
        account_config: &mut AccountConfig,
        fee_reductions: &FeeReductions,
        amount: &mut Balance,
        can_mutate_amount: bool,
    ) -> Result<(u128, u128), LendingPoolError> {
        reserve_ctx.reserve_data.ensure_activated()?;

        if account_reserve_data.deposit == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero);
        }

        let (
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ): (Balance, Balance) = reserve_ctx.reserve_data.add_interests(
            account_reserve_data.accumulate_account_interest(
                &reserve_ctx.reserve_indexes_and_fees.indexes,
                &mut reserve_ctx.reserve_indexes_and_fees.fees,
                fee_reductions,
            )?,
        )?;

        if *amount > account_reserve_data.deposit && can_mutate_amount {
            *amount = account_reserve_data.deposit;
            // else the decrease_account_deposit will fail
        }

        account_reserve_data.decrease_account_deposit(
            &reserve_ctx.asset_id,
            account_config,
            reserve_ctx.reserve_data,
            reserve_ctx.reserve_restrictions,
            amount,
        )?;

        Ok((
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ))
    }

    fn account_for_borrow(
        &mut self,
        reserve_ctx: &mut ReserveDataContext,
        account_reserve_data: &mut AccountReserveData,
        account_config: &mut AccountConfig,
        fee_reductions: &FeeReductions,
        amount: &Balance,
    ) -> Result<(u128, u128), LendingPoolError> {
        reserve_ctx.reserve_data.ensure_activated()?;
        reserve_ctx.reserve_data.ensure_not_frozen()?;

        let (
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ): (Balance, Balance) = reserve_ctx.reserve_data.add_interests(
            account_reserve_data.accumulate_account_interest(
                &reserve_ctx.reserve_indexes_and_fees.indexes,
                &mut reserve_ctx.reserve_indexes_and_fees.fees,
                fee_reductions,
            )?,
        )?;
        account_reserve_data.increase_account_debt(
            &reserve_ctx.asset_id,
            account_config,
            reserve_ctx.reserve_data,
            amount,
        )?;

        reserve_ctx
            .reserve_restrictions
            .ensure_debt_exceeds_minimum(account_reserve_data)?;
        reserve_ctx
            .reserve_restrictions
            .ensure_max_total_debt_not_reached(reserve_ctx.reserve_data)?;

        Ok((
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ))
    }

    fn account_for_repay(
        &mut self,
        reserve_ctx: &mut ReserveDataContext,
        account_reserve_data: &mut AccountReserveData,
        account_config: &mut AccountConfig,
        fee_reductions: &FeeReductions,
        amount: &mut Balance,
        can_mutate_amount: bool,
    ) -> Result<(u128, u128), LendingPoolError> {
        reserve_ctx.reserve_data.ensure_activated()?;

        let (
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ): (Balance, Balance) = reserve_ctx.reserve_data.add_interests(
            account_reserve_data.accumulate_account_interest(
                &reserve_ctx.reserve_indexes_and_fees.indexes,
                &mut reserve_ctx.reserve_indexes_and_fees.fees,
                fee_reductions,
            )?,
        )?;

        if *amount > account_reserve_data.debt && can_mutate_amount {
            *amount = account_reserve_data.debt;
            // else  the decrease_account_debt will fail
        }

        account_reserve_data.decrease_account_debt(
            &reserve_ctx.asset_id,
            account_config,
            reserve_ctx.reserve_data,
            amount,
        )?;
        reserve_ctx
            .reserve_restrictions
            .ensure_debt_exceeds_minimum(account_reserve_data)?;

        Ok((
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ))
    }

    #[allow(clippy::too_many_arguments)]
    #[allow(clippy::type_complexity)]
    pub fn account_for_liquidate(
        &mut self,
        caller: &AccountId,
        liquidated_account: &AccountId,
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
        amount_to_repay: &mut Balance,
        timestamp: &Timestamp,
    ) -> Result<
        (u128, (u128, u128), (u128, u128), (u128, u128)),
        LendingPoolError,
    > {
        let asset_to_repay_id = self.asset_id(asset_to_repay)?;
        let asset_to_take_id = self.asset_id(asset_to_take)?;

        let mut liquidated_account_datas =
            self.get_account_datas(liquidated_account);
        let mut caller_account_datas = self.get_account_datas(caller);
        let mut liquidated_account_config =
            self.get_account_config(liquidated_account);
        let mut caller_config = self.get_account_config(caller);
        let liquidated_account_fee_reductions =
            self.get_fee_reductions_of_account(liquidated_account);
        let caller_fee_reductions = self.get_fee_reductions_of_account(caller);

        let liquidated_account_data_to_repay = liquidated_account_datas
            .get_mut(asset_to_repay_id as usize)
            .unwrap()
            .as_mut()
            .ok_or(LendingPoolError::NothingToRepay)?;

        if liquidated_account_data_to_repay.debt == 0 {
            return Err(LendingPoolError::NothingToRepay);
        }

        let res = self.account_for_reserve_action(
            asset_to_repay_id,
            &mut [liquidated_account_data_to_repay],
            &mut [&mut liquidated_account_config],
            &[&liquidated_account_fee_reductions],
            &mut [&mut ReserveAction::Repay(0, amount_to_repay)],
            timestamp,
        )?;
        let (
            liquidated_account_accumulated_deposit_interest_to_repay,
            liquidated_account_accumulated_debt_interest_to_repay,
        ) = res.first().unwrap();

        let prices_e18 = self.get_assets_prices_e18()?;
        let mut amount_to_take = self
            .calculate_liquidated_amount_and_ensure_collateralized(
                liquidated_account,
                asset_to_repay_id,
                asset_to_take_id,
                &prices_e18[asset_to_repay_id as usize],
                &prices_e18[asset_to_take_id as usize],
                amount_to_repay,
            )?;

        let liquidated_account_data_to_take = liquidated_account_datas
            .get_mut(asset_to_take_id as usize)
            .unwrap()
            .as_mut()
            .ok_or(LendingPoolError::NothingToCompensateWith)?;

        let callers_data_to_take = get_account_data_entry_mut(
            &mut caller_account_datas,
            asset_to_take_id,
        );

        let res = self.account_for_reserve_action(
            asset_to_take_id,
            &mut [liquidated_account_data_to_take, callers_data_to_take],
            &mut [&mut liquidated_account_config, &mut caller_config],
            &[&liquidated_account_fee_reductions, &caller_fee_reductions],
            &mut [&mut ReserveAction::DepositTransfer(
                0,
                1,
                &mut amount_to_take,
                true,
            )],
            timestamp,
        )?;

        self.account_configs
            .insert(liquidated_account, &liquidated_account_config);
        self.account_reserve_datas
            .insert(liquidated_account, &liquidated_account_datas);

        self.account_configs.insert(caller, &caller_config);
        self.account_reserve_datas
            .insert(caller, &caller_account_datas);

        Ok((
            amount_to_take,
            (
                *liquidated_account_accumulated_deposit_interest_to_repay,
                *liquidated_account_accumulated_debt_interest_to_repay,
            ),
            *res.first().unwrap(),
            *res.get(1).unwrap(),
        ))
    }

    pub fn account_for_deposit_transfer_from_to(
        &mut self,
        asset: &AccountId,
        from: &AccountId,
        to: &AccountId,
        amount: &Balance,
        timestamp: &Timestamp,
    ) -> Result<((Balance, Balance), (Balance, Balance)), LendingPoolError>
    {
        let asset_id = self.asset_id(asset)?;
        let mut from_config = self
            .account_configs
            .get(from)
            .ok_or(LendingPoolError::InsufficientDeposit)?;
        let mut from_datas = self
            .account_reserve_datas
            .get(from)
            .ok_or(LendingPoolError::InsufficientDeposit)?;
        let mut to_config = self.get_account_config(to);
        let (mut to_account_reserve_data, to_account_datas) =
            self.get_account_reserve_data(asset_id, to);
        let from_fee_reductions = self.get_fee_reductions_of_account(from);
        let to_fee_reductions = self.get_fee_reductions_of_account(to);
        let result;
        {
            let mut from_account_reserve_data = from_datas
                .get_mut(asset_id as usize)
                .unwrap()
                .as_mut()
                .ok_or(LendingPoolError::InsufficientDeposit)?;

            let mut amount_tmp = *amount;
            result = self.account_for_reserve_action(
                asset_id,
                &mut [
                    &mut from_account_reserve_data,
                    &mut to_account_reserve_data,
                ],
                &mut [&mut from_config, &mut to_config],
                &[&from_fee_reductions, &to_fee_reductions],
                &mut [&mut ReserveAction::DepositTransfer(
                    0,
                    1,
                    &mut amount_tmp,
                    false,
                )],
                timestamp,
            )?;
        }

        if from_config.collaterals & (1 << asset_id) == 1 {
            self.ensure_collateralized_from_raw(
                &from_datas,
                &from_config,
                &self.get_fee_reductions_of_account(from),
            )?;
        }

        self.insert_account_data(
            to_account_datas,
            asset_id,
            to_account_reserve_data,
            to,
        );
        self.account_reserve_datas.insert(from, &from_datas);
        self.account_configs.insert(from, &from_config);
        self.account_configs.insert(to, &to_config);
        Ok((*result.first().unwrap(), *result.get(1).unwrap()))
    }

    pub fn account_for_debt_transfer_from_to(
        &mut self,
        asset: &AccountId,
        from: &AccountId,
        to: &AccountId,
        amount: &Balance,
        timestamp: &Timestamp,
    ) -> Result<((Balance, Balance), (Balance, Balance)), LendingPoolError>
    {
        let asset_id = self.asset_id(asset)?;
        let mut from_config =
            self.account_configs.get(from).unwrap_or_default();
        let (mut from_account_data, from_account_datas) =
            self.get_account_reserve_data(asset_id, from);
        let mut to_config = self
            .account_configs
            .get(to)
            .ok_or(LendingPoolError::InsufficientCollateral)?;
        let mut to_datas = self
            .account_reserve_datas
            .get(to)
            .ok_or(LendingPoolError::InsufficientCollateral)?;
        let from_fee_reductions = self.get_fee_reductions_of_account(from);
        let to_fee_reductions = self.get_fee_reductions_of_account(to);

        let result;
        {
            let mut to_account_reserve_data =
                get_account_data_entry_mut(&mut to_datas, asset_id);

            let mut amount_tmp = *amount;
            result = self.account_for_reserve_action(
                asset_id,
                &mut [&mut from_account_data, &mut to_account_reserve_data],
                &mut [&mut from_config, &mut to_config],
                &[&from_fee_reductions, &to_fee_reductions],
                &mut [&mut ReserveAction::DebtTransfer(
                    0,
                    1,
                    &mut amount_tmp,
                    false,
                )],
                timestamp,
            )?;
        }
        self.ensure_collateralized_from_raw(
            &to_datas,
            &to_config,
            &self.get_fee_reductions_of_account(to),
        )?;

        self.insert_account_data(
            from_account_datas,
            asset_id,
            from_account_data,
            from,
        );
        self.account_reserve_datas.insert(to, &to_datas);
        self.account_configs.insert(to, &to_config);
        self.account_configs.insert(from, &from_config);
        Ok((*result.first().unwrap(), *result.get(1).unwrap()))
    }

    pub fn account_for_set_as_collateral(
        &mut self,
        account: &AccountId,
        asset: &AccountId,
        use_as_collateral_to_set: bool,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;

        let (account_reserve_data, _) =
            self.get_account_reserve_data(asset_id, account);
        let mut account_config = self.get_account_config(account);
        let reserve_restrictions = self.get_reserve_restrictions(asset_id);
        let market_rule = self.get_market_rule(&account_config);

        let collateral_coefficient_e6 = market_rule
            .get(asset_id as usize)
            .ok_or(LendingPoolError::RuleCollateralDisable)?
            .ok_or(LendingPoolError::RuleCollateralDisable)?
            .collateral_coefficient_e6
            .unwrap_or_default();

        if use_as_collateral_to_set && collateral_coefficient_e6 == 0 {
            return Err(LendingPoolError::RuleCollateralDisable);
        }

        if use_as_collateral_to_set {
            reserve_restrictions
                .ensure_collateral_exceeds_minimum(&account_reserve_data)?
        };

        if use_as_collateral_to_set {
            account_config.collaterals |= 1_u128 << asset_id;
        } else {
            account_config.collaterals &= !(1_u128 << asset_id);
        }

        self.account_configs.insert(account, &account_config);

        Ok(())
    }

    pub fn account_for_accumulate_interest(
        &mut self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.get_reserve_data(asset_id);
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);
        let interest_rate_model = self.interest_rate_model.get(asset_id);

        reserve_indexes_and_fees
            .indexes
            .update(&reserve_data, timestamp)?;
        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        self.reserve_datas.insert(asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(asset_id, &reserve_indexes_and_fees);

        Ok(())
    }
    /*
    CALCUALTION SECTION - calculating and checking lending power, liquidation calculations.
    */

    pub fn calculate_lending_power_e6(
        &self,
        account_reserve_datas: &[Option<AccountReserveData>],
        account_config: &AccountConfig,
        fee_reductions: &FeeReductions,
        prices_e18: &[u128],
    ) -> Result<(bool, u128), LendingPoolError> {
        let mut total_collateral_power_e6: u128 = 0;
        let mut total_debt_power_e6: u128 = 0;

        let market_rule = self.get_market_rule(account_config);

        let collaterals = account_config.deposits & account_config.collaterals;
        let debts = account_config.borrows;
        let active_account_assets = collaterals | debts;

        let next_asset_id = self.next_asset_id.get().unwrap_or(0);

        for asset_id in 0..next_asset_id {
            if (active_account_assets >> asset_id) == 0 {
                break;
            }
            if ((active_account_assets >> asset_id) & 1) == 0 {
                continue;
            }

            let mut account_reserve_data =
                match account_reserve_datas[asset_id as usize] {
                    Some(data) => data,
                    None => continue,
                };

            // Reserve indexes are not updated
            let mut reserve_indexes_and_fees =
                self.get_reserve_indexes_and_fees(asset_id);

            account_reserve_data.accumulate_account_interest(
                &reserve_indexes_and_fees.indexes,
                &mut reserve_indexes_and_fees.fees,
                fee_reductions,
            )?;

            if ((collaterals >> asset_id) & 1) == 1 {
                let collateral_value_e8 = calculate_asset_amount_value_e8(
                    &account_reserve_data.deposit,
                    &prices_e18[asset_id as usize],
                    &self.get_decimal_multiplier(asset_id),
                );

                let collateral_coefficient_e6 = market_rule
                    .get(asset_id as usize)
                    .ok_or(LendingPoolError::RuleCollateralDisable)?
                    .ok_or(LendingPoolError::RuleCollateralDisable)?
                    .collateral_coefficient_e6
                    .ok_or(LendingPoolError::RuleCollateralDisable)?;

                total_collateral_power_e6 = total_collateral_power_e6
                    .checked_add(e8_mul_e6_to_e6_rdown(
                        collateral_value_e8,
                        collateral_coefficient_e6,
                    )?)
                    .ok_or(MathError::Overflow)?;
            }

            if ((debts >> asset_id) & 1) == 1 {
                let debt_value_e8 = calculate_asset_amount_value_e8(
                    &account_reserve_data.debt,
                    &prices_e18[asset_id as usize],
                    &self.get_decimal_multiplier(asset_id),
                );

                let debt_coefficient_e6 = market_rule
                    .get(asset_id as usize)
                    .ok_or(LendingPoolError::RuleBorrowDisable)?
                    .ok_or(LendingPoolError::RuleBorrowDisable)?
                    .borrow_coefficient_e6
                    .ok_or(LendingPoolError::RuleBorrowDisable)?;

                total_debt_power_e6 = total_debt_power_e6
                    .checked_add(e8_mul_e6_to_e6_rdown(
                        debt_value_e8,
                        debt_coefficient_e6,
                    )?)
                    .ok_or(MathError::Overflow)?;
            }
        }

        if total_collateral_power_e6 >= total_debt_power_e6 {
            Ok((
                true,
                total_collateral_power_e6
                    .checked_sub(total_debt_power_e6)
                    .ok_or(MathError::Underflow)?,
            ))
        } else {
            Ok((
                false,
                total_debt_power_e6
                    .checked_sub(total_collateral_power_e6)
                    .ok_or(MathError::Underflow)?,
            ))
        }
    }

    pub fn calculate_lending_power_of_an_account_e6(
        &self,
        account: &AccountId,
    ) -> Result<(bool, u128), LendingPoolError> {
        self.calculate_lending_power_e6(
            &self.get_account_datas(account),
            &self.get_account_config(account),
            &self.get_fee_reductions_of_account(account),
            &self.get_assets_prices_e18()?,
        )
    }

    pub fn ensure_collateralized_by_account(
        &self,
        account: &AccountId,
    ) -> Result<(), LendingPoolError> {
        self.ensure_collateralized_from_raw(
            &self.get_account_datas(account),
            &self.get_account_config(account),
            &self.get_fee_reductions_of_account(account),
        )
    }

    fn ensure_collateralized_from_raw(
        &self,
        account_datas: &[Option<AccountReserveData>],
        account_config: &AccountConfig,
        fee_reductions: &FeeReductions,
    ) -> Result<(), LendingPoolError> {
        self.ensure_collateralized(
            account_datas,
            account_config,
            fee_reductions,
            &self.get_assets_prices_e18()?,
        )?;
        Ok(())
    }

    fn ensure_collateralized(
        &self,
        account_reserve_datas: &[Option<AccountReserveData>],
        account_config: &AccountConfig,
        fee_reductions: &FeeReductions,
        prices_e18: &[u128],
    ) -> Result<(), LendingPoolError> {
        match self.calculate_lending_power_e6(
            account_reserve_datas,
            account_config,
            fee_reductions,
            prices_e18,
        )? {
            (false, _) => Err(LendingPoolError::InsufficientCollateral),
            _ => Ok(()),
        }
    }

    pub fn calculate_liquidated_amount_and_ensure_collateralized(
        &self,
        account: &AccountId,
        asset_to_repay_id: u32,
        asset_to_take_id: u32,
        asset_to_repay_price_e18: &u128,
        asset_to_take_price_e18: &u128,
        amount_to_repay: &Balance,
    ) -> Result<Balance, LendingPoolError> {
        let account_config = &self
            .account_configs
            .get(account)
            .ok_or(LendingPoolError::NothingToRepay)?;
        if (account_config.collaterals >> asset_to_take_id) & 1_u128 != 1 {
            return Err(LendingPoolError::TakingNotACollateral);
        }

        let reserve_to_repay_decimal_multiplier =
            self.get_decimal_multiplier(asset_to_repay_id);

        let reserve_to_take_decimal_multiplier =
            self.get_decimal_multiplier(asset_to_take_id);

        let market_rule = self.get_market_rule(account_config);
        let penalty_to_repay_e6 = get_penalty(&market_rule, asset_to_repay_id);
        let penalty_to_take_e6 = get_penalty(&market_rule, asset_to_take_id);

        let amount_to_take = calculate_amount_to_take(
            amount_to_repay,
            asset_to_repay_price_e18,
            asset_to_take_price_e18,
            &reserve_to_repay_decimal_multiplier,
            &reserve_to_take_decimal_multiplier,
            &penalty_to_repay_e6,
            &penalty_to_take_e6,
        )?;
        Ok(amount_to_take)
    }

    /*
    MANAGEMENT SECTION - methods responsible for changing parameters of the lending pool.
    Registering new assets, chaning the parameters, freezing, activating.
     */
    pub fn account_for_price_feed_provider_change(
        &mut self,
        price_feed_provider: &AccountId,
    ) {
        self.price_feed_provider.set(price_feed_provider);
    }
    pub fn account_for_fee_reduction_provider_change(
        &mut self,
        fee_reduction_provider: &AccountId,
    ) {
        self.fee_reduction_provider.set(fee_reduction_provider);
    }

    #[allow(clippy::too_many_arguments)]
    pub fn account_for_register_asset(
        &mut self,
        asset: &AccountId,
        reserve_data: &ReserveData,
        reserve_restrictions: &ReserveRestrictions,
        decimal_multiplier: &DecimalMultiplier,
        reserve_fees: &ReserveFees,
        interest_rate_model: &Option<InterestRateModel>,
        timestamp: &Timestamp,
    ) -> Result<(), LendingPoolError> {
        if self.asset_to_id.contains(asset) {
            return Err(LendingPoolError::AlreadyRegistered);
        }
        let id = self.next_asset_id.get_or_default();

        self.asset_to_id.insert(asset, &id);
        self.id_to_asset.insert(id, asset);
        self.reserve_datas.insert(id, reserve_data);
        self.reserve_restrictions.insert(id, reserve_restrictions);
        self.reserve_decimal_multiplier
            .insert(id, decimal_multiplier);
        self.reserve_indexes_and_fees
            .insert(id, &ReserveIndexesAndFees::new(timestamp, reserve_fees));
        interest_rate_model.and_then(|value| {
            self.interest_rate_model.insert(id, &value);
            Some(value)
        });

        self.next_asset_id
            .set(&(id.checked_add(1).ok_or(MathError::Overflow)?));
        Ok(())
    }

    pub fn account_for_set_abacus_tokens(
        &mut self,
        asset: &AccountId,
        reserve_abacus_tokens: &ReserveAbacusTokens,
    ) -> Result<(), LendingPoolError> {
        if !self.asset_to_id.contains(asset) {
            return Err(LendingPoolError::AssetNotRegistered);
        }

        self.reserve_abacus_tokens
            .insert(asset, reserve_abacus_tokens);

        Ok(())
    }

    pub fn account_for_market_rule_change(
        &mut self,
        account: &AccountId,
        market_rule_id: RuleId,
    ) -> Result<(), LendingPoolError> {
        self.ensure_market_rule_in_bounds(market_rule_id)?;

        let mut account_config = self.get_account_config(account);

        account_config.market_rule_id = market_rule_id;

        self.account_configs.insert(account, &account_config);

        Ok(())
    }

    pub fn account_for_changing_activity(
        &mut self,
        asset: &AccountId,
        active: bool,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.get_reserve_data(asset_id);
        reserve_data.set_is_active(active)?;
        self.reserve_datas.insert(asset_id, &reserve_data);
        Ok(())
    }

    pub fn account_for_changing_is_frozen(
        &mut self,
        asset: &AccountId,
        new_is_frozen: bool,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.get_reserve_data(asset_id);
        reserve_data.set_is_frozen(new_is_frozen)?;
        self.reserve_datas.insert(asset_id, &reserve_data);
        Ok(())
    }

    pub fn account_for_reserve_restricitions_change(
        &mut self,
        asset: &AccountId,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        self.reserve_restrictions
            .insert(asset_id, reserve_restrictions);
        Ok(())
    }

    pub fn account_for_interest_rate_model_change(
        &mut self,
        asset: &AccountId,
        interest_rate_model: &InterestRateModel,
        timestamp: &Timestamp,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if !self.interest_rate_model.contains(asset_id) {
            return Err(LendingPoolError::AssetIsProtocolStablecoin);
        }
        let mut reserve_data = self.get_reserve_data(asset_id);
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);
        reserve_indexes_and_fees
            .indexes
            .update(&reserve_data, timestamp)?;
        reserve_data.recalculate_current_rates(interest_rate_model)?;

        self.reserve_datas.insert(asset_id, &reserve_data);
        self.interest_rate_model
            .insert(asset_id, interest_rate_model);
        self.reserve_indexes_and_fees
            .insert(asset_id, &reserve_indexes_and_fees);
        Ok(())
    }

    pub fn account_for_reserve_fees_change(
        &mut self,
        asset: &AccountId,
        reserve_fees: &ReserveFees,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if !self.interest_rate_model.contains(asset_id) {
            return Err(LendingPoolError::AssetIsProtocolStablecoin);
        }
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);
        reserve_indexes_and_fees.fees = *reserve_fees;
        self.reserve_indexes_and_fees
            .insert(asset_id, &reserve_indexes_and_fees);
        Ok(())
    }

    pub fn account_for_add_market_rule(
        &mut self,
        market_rule: &MarketRule,
    ) -> u32 {
        let rule_id = self.next_rule_id.get_or_default();
        self.market_rules.insert(rule_id, market_rule);
        self.next_rule_id.set(&(rule_id.checked_add(1).unwrap()));
        rule_id
    }

    pub fn account_for_asset_rule_change(
        &mut self,
        market_rule_id: &RuleId,
        asset: &AccountId,
        asset_rules: &AssetRules,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        self.ensure_market_rule_in_bounds(*market_rule_id)?;
        let mut market_rule = self.market_rules.get(market_rule_id).unwrap();
        while (market_rule.len() as u32) <= asset_id {
            market_rule.push(None);
        }
        market_rule[asset_id as usize] = Some(*asset_rules);
        let old_asset_rule = market_rule[asset_id as usize];
        asset_rules.validate_new_rule(&old_asset_rule)?;
        self.market_rules.insert(market_rule_id, &market_rule);
        Ok(())
    }

    pub fn account_for_stablecoin_debt_rate_e18_change(
        &mut self,
        asset: &AccountId,
        debt_rate_e18: &u64,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if self.interest_rate_model.contains(asset_id) {
            return Err(LendingPoolError::AssetIsNotProtocolStablecoin);
        }
        let mut reserve_data = self.get_reserve_data(asset_id);
        reserve_data.current_debt_rate_e18 = *debt_rate_e18;
        self.reserve_datas.insert(asset_id, &reserve_data);
        Ok(())
    }

    /*
        SECTION REST - getters, setters, ensure methods, etc.
    */

    pub fn total_deposit_of(
        &self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let reserve_data = self.get_reserve_data(asset_id);
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);

        reserve_indexes_and_fees
            .indexes
            .update(&reserve_data, timestamp)?;

        Ok(reserve_data.total_deposit)
    }

    pub fn account_deposit_of(
        &self,
        asset: &AccountId,
        account: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let reserve_data = self.get_reserve_data(asset_id);
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);
        let (mut account_reserve_data, _) =
            self.get_account_reserve_data(asset_id, account);

        reserve_indexes_and_fees
            .indexes
            .update(&reserve_data, timestamp)?;
        account_reserve_data.accumulate_account_interest(
            &reserve_indexes_and_fees.indexes,
            &mut reserve_indexes_and_fees.fees,
            &self.get_fee_reductions_of_account(account),
        )?;

        Ok(account_reserve_data.deposit)
    }

    pub fn total_debt_of(
        &self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let reserve_data = self.get_reserve_data(asset_id);
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);
        reserve_indexes_and_fees
            .indexes
            .update(&reserve_data, timestamp)?;

        Ok(reserve_data.total_debt)
    }

    pub fn account_debt_of(
        &self,
        asset: &AccountId,
        account: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let reserve_data = self.get_reserve_data(asset_id);
        let mut reserve_indexes_and_fees =
            self.get_reserve_indexes_and_fees(asset_id);
        let (mut account_reserve_data, _) =
            self.get_account_reserve_data(asset_id, account);
        reserve_indexes_and_fees
            .indexes
            .update(&reserve_data, timestamp)?;
        account_reserve_data.accumulate_account_interest(
            &reserve_indexes_and_fees.indexes,
            &mut reserve_indexes_and_fees.fees,
            &self.get_fee_reductions_of_account(account),
        )?;

        Ok(account_reserve_data.debt)
    }

    fn insert_account_data(
        &mut self,
        mut account_datas: Vec<Option<AccountReserveData>>,
        asset_id: u32,
        updated_account_data: AccountReserveData,
        of: &AccountId,
    ) {
        account_datas.insert(asset_id as usize, Some(updated_account_data));
        self.account_reserve_datas.insert(of, &account_datas);
    }

    pub fn get_all_registered_assets(&self) -> Vec<AccountId> {
        (0..self.next_asset_id.get().unwrap_or(0))
            .map(|u| self.id_to_asset.get(u).unwrap()) // iterating over all assets => id_to_asset exists
            .collect()
    }

    pub fn asset_id(
        &self,
        asset: &AccountId,
    ) -> Result<AssetId, LendingPoolError> {
        self.asset_to_id
            .get(asset)
            .ok_or(LendingPoolError::AssetNotRegistered)
    }

    fn get_account_reserve_datas_defaults(
        &self,
    ) -> Vec<Option<AccountReserveData>> {
        (0..(self.next_asset_id.get().unwrap_or(0)))
            .map(|_| None)
            .collect()
    }

    fn get_account_datas(
        &self,
        account: &AccountId,
    ) -> Vec<Option<AccountReserveData>> {
        let mut account_datas = self
            .account_reserve_datas
            .get(account)
            .unwrap_or(self.get_account_reserve_datas_defaults());

        let next_id = self.next_asset_id.get().unwrap_or(0) as usize;
        if account_datas.len() < next_id {
            account_datas.resize(next_id, None);
        }

        account_datas
    }

    pub fn get_account_reserve_data(
        &self,
        asset_id: AssetId,
        account: &AccountId,
    ) -> (AccountReserveData, Vec<Option<AccountReserveData>>) {
        let account_reserve_datas = self.get_account_datas(account);

        let account_data = match account_reserve_datas.get(asset_id as usize) {
            Some(data) => *data,
            None => None,
        };
        (account_data.unwrap_or_default(), account_reserve_datas)
    }
    fn ensure_market_rule_in_bounds(
        &mut self,
        market_rule_id: u32,
    ) -> Result<(), LendingPoolError> {
        if market_rule_id >= self.next_rule_id.get_or_default() {
            return Err(LendingPoolError::MarketRuleInvalidId);
        };
        Ok(())
    }

    fn get_market_rule(
        &self,
        account_config: &AccountConfig,
    ) -> Vec<Option<AssetRules>> {
        self.market_rules
            .get(account_config.market_rule_id)
            .unwrap() // account used market rule => market rule exists
    }

    fn get_reserve_restrictions(
        &mut self,
        asset_id: u32,
    ) -> ReserveRestrictions {
        self.reserve_restrictions.get(asset_id).unwrap() // asset_id exists => reserve_restrictions exists
    }

    fn get_reserve_indexes_and_fees(
        &self,
        asset_id: u32,
    ) -> ReserveIndexesAndFees {
        self.reserve_indexes_and_fees.get(asset_id).unwrap() // asset_id exists => reserve_indexes_and_fees exists
    }

    fn get_reserve_data(&self, asset_id: u32) -> ReserveData {
        self.reserve_datas.get(asset_id).unwrap() // asset_id exists => reserve_data exists
    }

    fn get_decimal_multiplier(&self, asset_id: u32) -> u128 {
        self.reserve_decimal_multiplier.get(asset_id).unwrap() // asset_id exists => reserve_decimal_multiplier exists
    }

    fn get_account_config(&self, account: &AccountId) -> AccountConfig {
        self.account_configs.get(account).unwrap_or_default()
    }

    fn get_assets_prices_e18(&self) -> Result<Vec<u128>, LendingPoolError> {
        let all_assets = self.get_all_registered_assets();
        let price_feeder: PriceFeedRef =
            self.price_feed_provider.get().unwrap().into();
        Ok(price_feeder.get_latest_prices(all_assets)?)
    }
    pub fn get_fee_reductions_of_account(
        &self,
        account: &AccountId,
    ) -> FeeReductions {
        match self.fee_reduction_provider.get() {
            None => FeeReductions::default(),
            Some(provider) => {
                FeeReductionRef::from(provider).get_fee_reductions(*account)
            }
        }
    }
}

fn get_account_data_entry_mut(
    account_datas: &mut [Option<AccountReserveData>],
    asset_id: u32,
) -> &mut AccountReserveData {
    let account_data_entry = account_datas.get_mut(asset_id as usize).unwrap(); // retrieving account datas should account for resizing the array
    if account_data_entry.is_none() {
        account_data_entry.replace(AccountReserveData::default());
    }
    let account_data = account_data_entry.as_mut().unwrap(); //checked above
    account_data
}
fn get_penalty(market_rule: &[Option<AssetRules>], asset_id: u32) -> u128 {
    market_rule[asset_id as usize].unwrap().penalty_e6.unwrap() //  asset_id exists => market_rule exists, borrow_coefficient_e6 exists => penalty_e6 exists
}
