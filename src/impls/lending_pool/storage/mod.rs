use abax_library::{
    math::{
        calculate_amount_to_take, calculate_asset_amount_value_e8,
        e8_mul_e6_to_e6_rdown, MathError,
    },
    structs::{
        AssetId, AssetRules, ReserveAbacusTokens, ReserveData, ReserveFees,
        ReserveIndexes, ReserveRestrictions, UserConfig, UserReserveData,
    },
};
use abax_traits::lending_pool::{
    DecimalMultiplier, InterestRateModel, LendingPoolError, MarketRule, RuleId,
};
use ink::prelude::vec::Vec;
use pendzl::{
    storage::Mapping,
    traits::{AccountId, Balance, Timestamp},
};

/// Stores data used to accumulate deposit and debt interest rates.
#[derive(Debug, scale::Encode, scale::Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveIndexesAndFees {
    pub indexes: ReserveIndexes,
    /// fee is used to accumulate users debt interest. The real rate is the current_borrow_rate * (1+fee). 10^6 =100%
    pub fees: ReserveFees,
}

impl ReserveIndexesAndFees {
    pub fn new(fees: &ReserveFees) -> Self {
        ReserveIndexesAndFees {
            indexes: ReserveIndexes::default(),
            fees: *fees,
        }
    }
}

#[derive(Default, Debug)]
#[pendzl::storage_item]
pub struct LendingPoolStorage {
    #[lazy]
    pub price_feed_provider: AccountId,

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

    pub user_reserve_datas: Mapping<(AssetId, AccountId), UserReserveData>,
    pub user_configs: Mapping<AccountId, UserConfig>,

    #[lazy]
    /// fee that must be paid while taking flash loan. 10^6 = 100%.
    pub flash_loan_fee_e6: u128,
}

impl LendingPoolStorage {
    pub fn account_for_price_feed_provider_change(
        &mut self,
        price_feed_provider: &AccountId,
    ) {
        self.price_feed_provider.set(price_feed_provider);
    }

    // registered_asset
    pub fn account_for_register_asset(
        &mut self,
        asset: &AccountId,
        reserve_data: &ReserveData,
        reserve_restrictions: &ReserveRestrictions,
        decimal_multiplier: &DecimalMultiplier,
        reserve_fees: &ReserveFees,
        interest_rate_model: &Option<InterestRateModel>,
    ) -> Result<(), LendingPoolError> {
        if self.asset_to_id.contains(asset) {
            return Err(LendingPoolError::AlreadyRegistered);
        }
        let id = self.next_asset_id.get_or_default();

        self.asset_to_id.insert(asset, &id);
        self.id_to_asset.insert(&id, asset);

        self.reserve_datas.insert(&id, reserve_data);
        self.reserve_restrictions.insert(&id, reserve_restrictions);
        self.reserve_decimal_multiplier
            .insert(&id, decimal_multiplier);
        self.reserve_indexes_and_fees
            .insert(&id, &ReserveIndexesAndFees::new(reserve_fees));

        interest_rate_model.and_then(|value| {
            self.interest_rate_model.insert(&id, &value);
            Some(value)
        });

        self.next_asset_id.set(&(id + 1));
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

    pub fn get_all_registered_assets(&self) -> Vec<AccountId> {
        let mut assets: Vec<AccountId> = Vec::new();
        for u in 0..self.next_asset_id.get().unwrap_or(0) {
            assets.push(self.id_to_asset.get(&u).unwrap())
        }
        assets
    }

    pub fn register_rule(
        &mut self,
        market_rule: &MarketRule,
    ) -> Result<(), LendingPoolError> {
        let id = self.next_rule_id.get_or_default();

        self.market_rules.insert(&id, market_rule);
        self.next_rule_id.set(&(id + 1));
        Ok(())
    }

    pub fn asset_id(
        &self,
        asset: &AccountId,
    ) -> Result<AssetId, LendingPoolError> {
        self.asset_to_id
            .get(asset)
            .ok_or(LendingPoolError::AssetNotRegistered)
    }

    pub fn account_for_deposit(
        &mut self,
        asset: &AccountId,
        account: &AccountId,
        amount: &Balance,
        timestamp: &Timestamp,
    ) -> Result<(u128, u128), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.check_activeness()?;
        reserve_data.check_is_freezed()?;
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let interest_rate_model = self.interest_rate_model.get(&asset_id);
        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        let (user_accumulated_deposit_interest, user_accumulated_debt_interest): (Balance, Balance) =
        user_reserve_data.accumulate_user_interest(&reserve_indexes_and_fees.indexes, &reserve_indexes_and_fees.fees)?;

        user_reserve_data.increase_user_deposit(
            &asset_id,
            &mut user_config,
            amount,
        )?;
        reserve_data.increase_total_deposit(amount)?;

        reserve_data.check_max_total_deposit(&reserve_restrictions)?;

        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_deposit_interest,
            user_accumulated_debt_interest,
        ))
    }

    pub fn account_for_withdraw(
        &mut self,
        asset: &AccountId,
        account: &AccountId,
        amount: &mut Balance,
        timestamp: &Timestamp,
    ) -> Result<(u128, u128, bool), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        ink::env::debug_println!("amount_before: {}", amount);

        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.check_activeness()?;
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let interest_rate_model = self.interest_rate_model.get(&asset_id);

        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        if user_reserve_data.deposit == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero);
        }

        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        let (user_accumulated_deposit_interest, user_accumulated_debt_interest): (Balance, Balance) =
            user_reserve_data.accumulate_user_interest(&reserve_indexes_and_fees.indexes, &reserve_indexes_and_fees.fees)?;

        if *amount > user_reserve_data.deposit {
            *amount = user_reserve_data.deposit;
        }
        ink::env::debug_println!("amount_middle: {}", amount);

        let was_asset_a_collateral = user_reserve_data.decrease_user_deposit(
            &asset_id,
            &mut user_config,
            &reserve_restrictions,
            amount,
        )?;

        ink::env::debug_println!("amount_after: {}", amount);
        reserve_data.decrease_total_deposit(amount)?;

        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_deposit_interest,
            user_accumulated_debt_interest,
            was_asset_a_collateral,
        ))
    }

    pub fn account_for_market_rule_change(
        &mut self,
        user: &AccountId,
        market_rule_id: RuleId,
    ) -> Result<(), LendingPoolError> {
        if market_rule_id >= self.next_rule_id.get().unwrap() {
            return Err(LendingPoolError::MarketRuleInvalidId);
        }
        let mut user_config = self.user_configs.get(user).unwrap_or_default();
        user_config.market_rule_id = market_rule_id;
        self.user_configs.insert(user, &user_config);

        Ok(())
    }

    pub fn account_for_set_as_collateral(
        &mut self,
        user: &AccountId,
        asset: &AccountId,
        use_as_collateral_to_set: bool,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;

        let user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *user))
            .unwrap_or_default();
        let mut user_config = self.user_configs.get(user).unwrap_or_default();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let market_rule =
            self.market_rules.get(&user_config.market_rule_id).unwrap();

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
            user_reserve_data
                .check_collateral_restrictions(&reserve_restrictions)?
        };

        if use_as_collateral_to_set {
            user_config.collaterals |= 1_u128 << asset_id;
        } else {
            user_config.collaterals &= !(1_u128 << asset_id);
        }

        self.user_configs.insert(user, &user_config);

        Ok(())
    }

    pub fn account_for_borrow(
        &mut self,
        asset: &AccountId,
        account: &AccountId,
        amount: &Balance,
        timestamp: &Timestamp,
    ) -> Result<(u128, u128), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;

        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.check_activeness()?;
        reserve_data.check_is_freezed()?;

        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let interest_rate_model = self.interest_rate_model.get(&asset_id);

        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        ink::env::debug_println!(
            "user_reserve_data_before_borrow: {:?}",
            user_reserve_data
        );

        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        let (user_accumulated_deposit_interest, user_accumulated_debt_interest): (Balance, Balance) =
            user_reserve_data.accumulate_user_interest(&reserve_indexes_and_fees.indexes, &reserve_indexes_and_fees.fees)?;

        user_reserve_data.increase_user_debt(
            &asset_id,
            &mut user_config,
            amount,
        )?;
        user_reserve_data.check_debt_restrictions(&reserve_restrictions)?;
        reserve_data.increase_total_debt(amount)?;
        reserve_data.check_max_total_debt(&reserve_restrictions)?;

        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        ink::env::debug_println!(
            "user_reserve_data_after_borrow: {:?}",
            user_reserve_data
        );

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_deposit_interest,
            user_accumulated_debt_interest,
        ))
    }

    pub fn account_for_repay(
        &mut self,
        asset: &AccountId,
        account: &AccountId,
        amount: &mut Balance,
        timestamp: &Timestamp,
    ) -> Result<(u128, u128), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;

        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.check_activeness()?;

        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let interest_rate_model = self.interest_rate_model.get(&asset_id);

        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        ink::env::debug_println!(
            "reserve_indexes_and_fees before: {:?}",
            reserve_indexes_and_fees
        );
        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        ink::env::debug_println!(
            "reserve_indexes_and_fees after: {:?}",
            reserve_indexes_and_fees
        );

        ink::env::debug_println!(
            "user_reserve_data_before_repay: {:?}",
            user_reserve_data
        );

        let (user_accumulated_deposit_interest, user_accumulated_debt_interest): (Balance, Balance) =
            user_reserve_data.accumulate_user_interest(&reserve_indexes_and_fees.indexes, &reserve_indexes_and_fees.fees)?;

        if *amount > user_reserve_data.debt {
            *amount = user_reserve_data.debt;
        }

        user_reserve_data.decrease_user_debt(
            &asset_id,
            &mut user_config,
            amount,
        )?;
        user_reserve_data.check_debt_restrictions(&reserve_restrictions)?;

        reserve_data.decrease_total_debt(amount);

        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        ink::env::debug_println!(
            "user_reserve_data_after_repay: {:?}",
            user_reserve_data
        );

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_deposit_interest,
            user_accumulated_debt_interest,
        ))
    }

    pub fn calculate_user_lending_power_e6(
        &self,
        user: &AccountId,
        prices_e18: &[u128],
    ) -> Result<(bool, u128), LendingPoolError> {
        let mut total_collateral_power_e6: u128 = 0;
        let mut total_debt_power_e6: u128 = 0;

        let user_config = self.user_configs.get(user).unwrap();
        let market_rule =
            self.market_rules.get(&user_config.market_rule_id).unwrap();

        let collaterals = user_config.deposits & user_config.collaterals;
        let debts = user_config.borrows;
        let active_user_assets = collaterals | debts;

        let mut asset_id = 0;
        loop {
            if (active_user_assets >> asset_id) == 0 {
                break;
            }
            if ((active_user_assets >> asset_id) & 1) == 0 {
                asset_id += 1;
                continue;
            }

            // THE LOGIC IS CHANGED, RESERVEDATA IS NOT UPDATED!!!!!!!
            let reserve_indexes_and_fees =
                self.reserve_indexes_and_fees.get(&asset_id).unwrap();
            let mut user_reserve_data =
                self.user_reserve_datas.get(&(asset_id, *user)).unwrap();

            user_reserve_data.accumulate_user_interest(
                &reserve_indexes_and_fees.indexes,
                &reserve_indexes_and_fees.fees,
            )?;

            if ((collaterals >> asset_id) & 1) == 1 {
                let collateral_value_e8 = calculate_asset_amount_value_e8(
                    &user_reserve_data.deposit,
                    &prices_e18[asset_id as usize],
                    &self.reserve_decimal_multiplier.get(&asset_id).unwrap(),
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
                    &user_reserve_data.debt,
                    &prices_e18[asset_id as usize],
                    &self.reserve_decimal_multiplier.get(&asset_id).unwrap(),
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
            asset_id += 1;
        }

        if total_collateral_power_e6 >= total_debt_power_e6 {
            Ok((true, total_collateral_power_e6 - total_debt_power_e6))
        } else {
            Ok((false, total_debt_power_e6 - total_collateral_power_e6))
        }
    }

    pub fn check_lending_power(
        &self,
        user: &AccountId,
        prices_e18: &[u128],
    ) -> Result<(), LendingPoolError> {
        if !self.calculate_user_lending_power_e6(user, prices_e18)?.0 {
            return Err(LendingPoolError::InsufficientCollateral);
        }
        Ok(())
    }

    pub fn calculate_liquidated_amount_and_check_if_collateral(
        &self,
        user: &AccountId,
        asset_to_repay_id: u32,
        asset_to_take_id: u32,
        asset_to_repay_price_e18: &u128,
        asset_to_take_price_e18: &u128,
        amount_to_repay: &Balance,
    ) -> Result<Balance, LendingPoolError> {
        let user_config = &self
            .user_configs
            .get(user)
            .ok_or(LendingPoolError::NothingToRepay)?;
        if (user_config.collaterals >> asset_to_take_id) & 1_u128 != 1 {
            return Err(LendingPoolError::TakingNotACollateral);
        }

        let reserve_to_repay_decimal_multiplier = self
            .reserve_decimal_multiplier
            .get(&asset_to_repay_id)
            .unwrap();

        let reserve_to_take_decimal_multiplier = self
            .reserve_decimal_multiplier
            .get(&asset_to_take_id)
            .unwrap();

        let market_rule =
            self.market_rules.get(&user_config.market_rule_id).unwrap();
        let penalty_to_repay_e6 = market_rule
            .get(asset_to_repay_id as usize)
            .unwrap()
            .unwrap()
            .penalty_e6
            .unwrap();
        let penalty_to_take_e6 = market_rule
            .get(asset_to_take_id as usize)
            .unwrap()
            .unwrap()
            .penalty_e6
            .unwrap();

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

    pub fn account_for_liquidate(
        &mut self,
        caller: &AccountId,
        liquidated_account: &AccountId,
        prices_e18: &[u128],
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
        amount_to_repay: &mut Balance,
        timestamp: &Timestamp,
    ) -> Result<(u128, u128, u128, u128, u128, u128, u128), LendingPoolError>
    {
        let asset_to_repay_id = self.asset_id(asset_to_repay)?;
        let asset_to_take_id = self.asset_id(asset_to_take)?;
        let mut reserve_data_to_repay =
            self.reserve_datas.get(&asset_to_repay_id).unwrap();
        let mut reserve_indexes_to_repay = self
            .reserve_indexes_and_fees
            .get(&asset_to_repay_id)
            .unwrap();
        let mut reserve_data_to_take =
            self.reserve_datas.get(&asset_to_take_id).unwrap();
        let mut reserve_indexes_to_take = self
            .reserve_indexes_and_fees
            .get(&asset_to_take_id)
            .unwrap();
        let mut user_config = self
            .user_configs
            .get(liquidated_account)
            .ok_or(LendingPoolError::NothingToRepay)?;
        let mut user_reserve_data_to_repay = self
            .user_reserve_datas
            .get(&(asset_to_repay_id, *liquidated_account))
            .ok_or(LendingPoolError::NothingToRepay)?;
        let mut user_reserve_data_to_take = self
            .user_reserve_datas
            .get(&(asset_to_take_id, *liquidated_account))
            .ok_or(LendingPoolError::NothingToCompensateWith)?;
        let mut caller_config =
            self.user_configs.get(caller).unwrap_or_default();
        let mut caller_reserve_data_to_take = self
            .user_reserve_datas
            .get(&(asset_to_take_id, *caller))
            .unwrap_or_default();

        let interest_rate_model_to_repay =
            self.interest_rate_model.get(&asset_to_repay_id);
        let interest_rate_model_to_take =
            self.interest_rate_model.get(&asset_to_take_id);

        if user_reserve_data_to_repay.debt == 0 {
            return Err(LendingPoolError::NothingToRepay);
        }

        // accumulate to repay
        reserve_data_to_repay.accumulate_interest(
            &mut reserve_indexes_to_repay.indexes,
            timestamp,
        )?;
        let (
            user_accumulated_deposit_interest_to_repay,
            user_accumulated_debt_interest_to_repay,
        ) = user_reserve_data_to_repay.accumulate_user_interest(
            &reserve_indexes_to_repay.indexes,
            &reserve_indexes_to_repay.fees,
        )?;

        // accumulate to take
        reserve_data_to_take.accumulate_interest(
            &mut reserve_indexes_to_take.indexes,
            timestamp,
        )?;
        // accumulate to take
        let (
            user_accumulated_deposit_interest_to_take,
            user_accumulated_debt_interest_to_take,
        ): (Balance, Balance) = user_reserve_data_to_take
            .accumulate_user_interest(
                &reserve_indexes_to_take.indexes,
                &reserve_indexes_to_take.fees,
            )?;
        // caller's
        let (
            caller_accumulated_deposit_interest_to_take,
            caller_accumulated_debt_interest_to_take,
        ): (Balance, Balance) = caller_reserve_data_to_take
            .accumulate_user_interest(
                &reserve_indexes_to_take.indexes,
                &reserve_indexes_to_take.fees,
            )?;

        if *amount_to_repay > user_reserve_data_to_repay.debt {
            *amount_to_repay = user_reserve_data_to_repay.debt;
        }

        let mut amount_to_take = self
            .calculate_liquidated_amount_and_check_if_collateral(
                liquidated_account,
                asset_to_repay_id,
                asset_to_take_id,
                &prices_e18[asset_to_repay_id as usize],
                &prices_e18[asset_to_take_id as usize],
                amount_to_repay,
            )?;

        if amount_to_take > user_reserve_data_to_take.deposit {
            amount_to_take = user_reserve_data_to_take.deposit;
        }

        user_reserve_data_to_repay.decrease_user_debt(
            &asset_to_repay_id,
            &mut user_config,
            amount_to_repay,
        )?;

        reserve_data_to_repay.decrease_total_debt(amount_to_repay);

        user_reserve_data_to_take.decrease_user_deposit(
            &asset_to_take_id,
            &mut user_config,
            &self.reserve_restrictions.get(&asset_to_take_id).unwrap(),
            &amount_to_take,
        )?;
        caller_reserve_data_to_take.increase_user_deposit(
            &asset_to_take_id,
            &mut caller_config,
            &amount_to_take,
        )?;

        if let Some(params) = interest_rate_model_to_repay {
            reserve_data_to_repay.recalculate_current_rates(&params)?
        };
        if let Some(params) = interest_rate_model_to_take {
            reserve_data_to_take.recalculate_current_rates(&params)?
        };

        self.reserve_datas
            .insert(&asset_to_repay_id, &reserve_data_to_repay);
        self.reserve_indexes_and_fees
            .insert(&asset_to_repay_id, &reserve_indexes_to_repay);
        self.reserve_datas
            .insert(&asset_to_take_id, &reserve_data_to_take);
        self.reserve_indexes_and_fees
            .insert(&asset_to_take_id, &reserve_indexes_to_take);

        self.user_configs.insert(liquidated_account, &user_config);
        self.user_reserve_datas.insert(
            &(asset_to_repay_id, *liquidated_account),
            &user_reserve_data_to_repay,
        );
        self.user_reserve_datas.insert(
            &(asset_to_take_id, *liquidated_account),
            &user_reserve_data_to_take,
        );
        self.user_configs.insert(caller, &caller_config);
        self.user_reserve_datas
            .insert(&(asset_to_take_id, *caller), &caller_reserve_data_to_take);

        Ok((
            amount_to_take,
            user_accumulated_deposit_interest_to_repay,
            user_accumulated_debt_interest_to_repay,
            user_accumulated_deposit_interest_to_take,
            user_accumulated_debt_interest_to_take,
            caller_accumulated_deposit_interest_to_take,
            caller_accumulated_debt_interest_to_take,
        ))
    }

    pub fn account_for_accumulate_interest(
        &mut self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let interest_rate_model = self.interest_rate_model.get(&asset_id);

        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);

        Ok(())
    }

    pub fn account_for_changing_activity(
        &mut self,
        asset: &AccountId,
        active: bool,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.set_is_active(active)?;
        self.reserve_datas.insert(&asset_id, &reserve_data);
        Ok(())
    }

    pub fn account_for_changing_is_freezed(
        &mut self,
        asset: &AccountId,
        freeze: bool,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.set_is_freezed(freeze)?;
        self.reserve_datas.insert(&asset_id, &reserve_data);
        Ok(())
    }

    pub fn account_for_reserve_restricitions_change(
        &mut self,
        asset: &AccountId,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        self.reserve_restrictions
            .insert(&asset_id, reserve_restrictions);
        Ok(())
    }

    pub fn account_for_interest_rate_model_change(
        &mut self,
        asset: &AccountId,
        interest_rate_model: &InterestRateModel,
        timestamp: &Timestamp,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if !self.interest_rate_model.contains(&asset_id) {
            return Err(LendingPoolError::AssetIsProtocolStablecoin);
        }
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        reserve_data.recalculate_current_rates(interest_rate_model)?;

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.interest_rate_model
            .insert(&asset_id, interest_rate_model);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        Ok(())
    }

    pub fn account_for_reserve_fees_change(
        &mut self,
        asset: &AccountId,
        reserve_fees: &ReserveFees,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if !self.interest_rate_model.contains(&asset_id) {
            return Err(LendingPoolError::AssetIsProtocolStablecoin);
        }
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        reserve_indexes_and_fees.fees = *reserve_fees;
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        Ok(())
    }

    pub fn total_deposit_of(
        &self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;

        Ok(reserve_data.total_deposit)
    }

    pub fn user_deposit_of(
        &self,
        asset: &AccountId,
        user: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *user))
            .unwrap_or_default();
        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        user_reserve_data.accumulate_user_interest(
            &reserve_indexes_and_fees.indexes,
            &reserve_indexes_and_fees.fees,
        )?;

        Ok(user_reserve_data.deposit)
    }

    pub fn account_for_deposit_transfer_from_to(
        &mut self,
        asset: &AccountId,
        from: &AccountId,
        to: &AccountId,
        amount: &Balance,
        timestamp: &Timestamp,
    ) -> Result<(Balance, Balance, Balance, Balance), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.check_activeness()?;
        reserve_data.check_is_freezed()?;

        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let interest_rate_model = self.interest_rate_model.get(&asset_id);
        let mut from_config = self
            .user_configs
            .get(from)
            .ok_or(LendingPoolError::InsufficientDeposit)?;
        let mut from_user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *from))
            .ok_or(LendingPoolError::InsufficientDeposit)?;
        let mut to_config = self.user_configs.get(to).unwrap_or_default();
        let mut to_user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *to))
            .unwrap_or_default();

        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        let (from_accumulated_deposit_interest, from_accumulated_debt_interest) =
            from_user_reserve_data.accumulate_user_interest(
                &reserve_indexes_and_fees.indexes,
                &reserve_indexes_and_fees.fees,
            )?;
        let (to_accumulated_deposit_interest, to_accumulated_debt_interest) =
            to_user_reserve_data.accumulate_user_interest(
                &reserve_indexes_and_fees.indexes,
                &reserve_indexes_and_fees.fees,
            )?;

        from_user_reserve_data.decrease_user_deposit(
            &asset_id,
            &mut from_config,
            &reserve_restrictions,
            amount,
        )?;

        to_user_reserve_data.increase_user_deposit(
            &asset_id,
            &mut to_config,
            amount,
        )?;

        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        self.user_configs.insert(from, &from_config);
        self.user_reserve_datas
            .insert(&(asset_id, *from), &from_user_reserve_data);
        self.user_configs.insert(to, &to_config);
        self.user_reserve_datas
            .insert(&(asset_id, *to), &to_user_reserve_data);
        Ok((
            from_accumulated_deposit_interest,
            from_accumulated_debt_interest,
            to_accumulated_deposit_interest,
            to_accumulated_debt_interest,
        ))
    }

    pub fn total_debt_of(
        &self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;

        Ok(reserve_data.total_debt)
    }

    pub fn user_debt_of(
        &self,
        asset: &AccountId,
        user: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *user))
            .unwrap_or_default();
        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;
        user_reserve_data.accumulate_user_interest(
            &reserve_indexes_and_fees.indexes,
            &reserve_indexes_and_fees.fees,
        )?;

        Ok(user_reserve_data.debt)
    }

    pub fn account_for_debt_transfer_from_to(
        &mut self,
        asset: &AccountId,
        from: &AccountId,
        to: &AccountId,
        amount: &Balance,
        timestamp: &Timestamp,
    ) -> Result<(Balance, Balance, Balance, Balance), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.check_activeness()?;
        reserve_data.check_is_freezed()?;

        let mut reserve_indexes_and_fees =
            self.reserve_indexes_and_fees.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let interest_rate_model = self.interest_rate_model.get(&asset_id);

        let mut from_config = self
            .user_configs
            .get(from)
            .ok_or(LendingPoolError::InsufficientDebt)?;
        let mut from_user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *from))
            .ok_or(LendingPoolError::InsufficientDebt)?;
        let mut to_config = self
            .user_configs
            .get(to)
            .ok_or(LendingPoolError::InsufficientCollateral)?;
        let mut to_user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *to))
            .unwrap_or_default();

        reserve_data.accumulate_interest(
            &mut reserve_indexes_and_fees.indexes,
            timestamp,
        )?;

        let (from_accumulated_deposit_interest, from_accumulated_debt_interest) =
            from_user_reserve_data.accumulate_user_interest(
                &reserve_indexes_and_fees.indexes,
                &reserve_indexes_and_fees.fees,
            )?;
        let (to_accumulated_deposit_interest, to_accumulated_debt_interest) =
            to_user_reserve_data.accumulate_user_interest(
                &reserve_indexes_and_fees.indexes,
                &reserve_indexes_and_fees.fees,
            )?;

        from_user_reserve_data.decrease_user_debt(
            &asset_id,
            &mut from_config,
            amount,
        )?;

        to_user_reserve_data.increase_user_debt(
            &asset_id,
            &mut to_config,
            amount,
        )?;
        from_user_reserve_data
            .check_debt_restrictions(&reserve_restrictions)?;
        to_user_reserve_data.check_debt_restrictions(&reserve_restrictions)?;

        if let Some(params) = interest_rate_model {
            reserve_data.recalculate_current_rates(&params)?
        }

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes_and_fees
            .insert(&asset_id, &reserve_indexes_and_fees);
        self.user_configs.insert(from, &from_config);
        self.user_reserve_datas
            .insert(&(asset_id, *from), &from_user_reserve_data);
        self.user_configs.insert(to, &to_config);
        self.user_reserve_datas
            .insert(&(asset_id, *to), &to_user_reserve_data);
        Ok((
            from_accumulated_deposit_interest,
            from_accumulated_debt_interest,
            to_accumulated_deposit_interest,
            to_accumulated_debt_interest,
        ))
    }

    pub fn account_for_add_market_rule(
        &mut self,
        market_rule: &MarketRule,
    ) -> u32 {
        let rule_id = self.next_rule_id.get().unwrap_or(0);
        self.market_rules.insert(&rule_id, market_rule);
        self.next_rule_id.set(&(rule_id + 1));
        rule_id
    }

    pub fn account_for_asset_rule_change(
        &mut self,
        market_rule_id: &RuleId,
        asset: &AccountId,
        asset_rules: &AssetRules,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if *market_rule_id >= self.next_rule_id.get_or_default() {
            return Err(LendingPoolError::MarketRuleInvalidId);
        }
        let mut market_rule = self.market_rules.get(market_rule_id).unwrap();
        while (market_rule.len() as u32) <= asset_id {
            market_rule.push(None);
        }
        market_rule[asset_id as usize] = Some(*asset_rules);
        let old_asset_rule = market_rule.get(asset_id as usize).unwrap();
        asset_rules.verify_new_rule(&old_asset_rule)?;
        self.market_rules.insert(market_rule_id, &market_rule);
        Ok(())
    }

    pub fn account_for_stablecoin_debt_rate_e18_change(
        &mut self,
        asset: &AccountId,
        debt_rate_e18: &u64,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if self.interest_rate_model.contains(&asset_id) {
            return Err(LendingPoolError::AssetIsNotProtocolStablecoin);
        }
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.current_debt_rate_e18 = *debt_rate_e18;
        self.reserve_datas.insert(&asset_id, &reserve_data);
        Ok(())
    }
}
