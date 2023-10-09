use ink::prelude::vec::Vec;
use pendzl::{
    storage::Mapping,
    traits::{AccountId, Balance, Timestamp},
};

use crate::{
    impls::{
        constants::E18_U128,
        lending_pool::storage::structs::{
            reserve_data::{
                ReserveAbacusTokens, ReserveData, ReserveIndexes, ReservePrice,
                ReserveRestrictions,
            },
            user_config::UserConfig,
            user_reserve_data::UserReserveData,
        },
    },
    library::math::{
        calculate_amount_to_take, e8_mul_e6_to_e6_rdown, MathError,
    },
    traits::lending_pool::errors::LendingPoolError,
};

use super::structs::{
    asset_rules::AssetRules, reserve_data::ReserveParameters,
};

pub type MarketRule = Vec<Option<AssetRules>>;
pub type AssetId = u32;
pub type RuleId = u32;

#[derive(Default, Debug)]
#[pendzl::storage_item]
pub struct LendingPoolStorage {
    #[lazy]
    pub block_timestamp_provider: AccountId,

    #[lazy]
    pub next_asset_id: AssetId,
    pub asset_to_id: Mapping<AccountId, AssetId>,
    pub id_to_asset: Mapping<AssetId, AccountId>,

    #[lazy]
    pub next_rule_id: RuleId,
    pub market_rules: Mapping<RuleId, MarketRule>,

    pub reserve_abacus: Mapping<AccountId, ReserveAbacusTokens>,

    pub reserve_restrictions: Mapping<AssetId, ReserveRestrictions>,
    pub reserve_indexes: Mapping<AssetId, ReserveIndexes>,
    pub reserve_prices: Mapping<AssetId, ReservePrice>,
    pub reserve_datas: Mapping<AssetId, ReserveData>,
    pub reserve_parameters: Mapping<AssetId, ReserveParameters>,

    pub user_reserve_datas: Mapping<(AssetId, AccountId), UserReserveData>,
    pub user_configs: Mapping<AccountId, UserConfig>,

    #[lazy]
    /// fee that must be paid while taking flash loan. 10^6 = 100%.
    pub flash_loan_fee_e6: u128,
}

impl LendingPoolStorage {
    // registered_asset
    pub fn account_for_register_asset(
        &mut self,
        asset: &AccountId,
        reserve_data: &ReserveData,
        reserve_parameters: &ReserveParameters,
        reserve_restrictions: &ReserveRestrictions,
        reserve_price: &ReservePrice,
        reserve_abacus: &ReserveAbacusTokens,
    ) -> Result<(), LendingPoolError> {
        if self.asset_to_id.contains(asset) {
            return Err(LendingPoolError::AlreadyRegistered);
        }
        let id = self.next_asset_id.get_or_default();

        self.asset_to_id.insert(asset, &id);
        self.id_to_asset.insert(&id, asset);

        self.reserve_datas.insert(&id, reserve_data);
        self.reserve_parameters.insert(&id, reserve_parameters);
        self.reserve_restrictions.insert(&id, reserve_restrictions);
        self.reserve_prices.insert(&id, reserve_price);
        self.reserve_abacus.insert(&asset, reserve_abacus);
        self.reserve_indexes.insert(
            &id,
            &ReserveIndexes {
                cumulative_supply_index_e18: E18_U128,
                cumulative_debt_index_e18: E18_U128,
            },
        );

        self.next_asset_id.set(&(id + 1));
        Ok(())
    }

    pub fn account_for_register_stablecoin(
        &mut self,
        asset: &AccountId,
        reserve_data: &ReserveData,
        reserve_restrictions: &ReserveRestrictions,
        reserve_price: &ReservePrice,
        reserve_abacus: &ReserveAbacusTokens,
    ) -> Result<(), LendingPoolError> {
        if self.asset_to_id.contains(asset) {
            return Err(LendingPoolError::AlreadyRegistered);
        }
        let id = self.next_asset_id.get_or_default();

        self.asset_to_id.insert(asset, &id);
        self.id_to_asset.insert(&id, asset);

        self.reserve_datas.insert(&id, reserve_data);
        self.reserve_restrictions.insert(&id, reserve_restrictions);
        self.reserve_prices.insert(&id, reserve_price);
        self.reserve_abacus.insert(&asset, reserve_abacus);
        self.reserve_indexes.insert(
            &id,
            &ReserveIndexes {
                cumulative_supply_index_e18: E18_U128,
                cumulative_debt_index_e18: E18_U128,
            },
        );

        self.next_asset_id.set(&(id + 1));
        Ok(())
    }

    pub fn get_all_registered_assets(&self) -> Vec<AccountId> {
        let mut assets: Vec<AccountId> = Vec::new();
        ink::env::debug_println!(
            "get_registered_assets; next_asset_id: {} ",
            self.next_asset_id.get_or_default()
        );
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
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let reserve_parameters = self.reserve_parameters.get(&asset_id);
        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        reserve_data.accumulate_interest(&mut reserve_indexes, timestamp)?;
        let (user_accumulated_supply_interest, user_accumulated_debt_interest): (Balance, Balance) =
        user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

        user_reserve_data.increase_user_deposit(
            &asset_id,
            &mut user_config,
            amount,
        )?;
        reserve_data.increase_total_deposit(amount)?;

        reserve_data.check_max_total_deposit(&reserve_restrictions)?;

        match reserve_parameters {
            Some(params) => reserve_data.recalculate_current_rates(&params)?,
            None => (),
        };

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_supply_interest,
            user_accumulated_debt_interest,
        ))
    }

    pub fn account_for_withdraw(
        &mut self,
        asset: &AccountId,
        account: &AccountId,
        amount: &mut Balance,
        timestamp: &Timestamp,
    ) -> Result<(u128, u128), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;

        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.check_activeness()?;
        reserve_data.check_is_freezed()?;
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let reserve_parameters = self.reserve_parameters.get(&asset_id);

        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        reserve_data.accumulate_interest(&mut reserve_indexes, timestamp)?;
        let (user_accumulated_supply_interest, user_accumulated_debt_interest): (Balance, Balance) =
            user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

        if *amount > user_reserve_data.deposit {
            *amount = user_reserve_data.deposit;
        }
        user_reserve_data.decrease_user_deposit(
            &asset_id,
            &mut user_config,
            &reserve_restrictions,
            &amount,
        )?;
        reserve_data.decrease_total_deposit(&amount)?;

        match reserve_parameters {
            Some(params) => reserve_data.recalculate_current_rates(&params)?,
            None => (),
        };

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_supply_interest,
            user_accumulated_debt_interest,
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
        ink::env::debug_println!(
            "account_for_Set_as_coollateral, asset_id {}",
            asset_id
        );
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        ink::env::debug_println!(
            "user_rule: {}, next_rule {}",
            user_config.market_rule_id,
            self.next_rule_id.get().unwrap()
        );
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

        if use_as_collateral_to_set
            && user_reserve_data.deposit
                < reserve_restrictions.minimal_collateral
        {
            return Err(LendingPoolError::MinimalCollateralDeposit);
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

        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let reserve_parameters = self.reserve_parameters.get(&asset_id);

        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        reserve_data.accumulate_interest(&mut reserve_indexes, timestamp)?;
        let (user_accumulated_supply_interest, user_accumulated_debt_interest): (Balance, Balance) =
            user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

        user_reserve_data.increase_user_debt(
            &asset_id,
            &mut user_config,
            &amount,
        )?;
        user_reserve_data.check_debt_restrictions(&reserve_restrictions)?;
        reserve_data.increase_total_debt(&amount)?;
        reserve_data.check_max_total_debt(&reserve_restrictions)?;

        match reserve_parameters {
            Some(params) => reserve_data.recalculate_current_rates(&params)?,
            None => (),
        };

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_supply_interest,
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

        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let reserve_parameters = self.reserve_parameters.get(&asset_id);

        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *account))
            .unwrap_or_default();
        let mut user_config =
            self.user_configs.get(account).unwrap_or_default();

        reserve_data.accumulate_interest(&mut reserve_indexes, timestamp)?;
        let (user_accumulated_supply_interest, user_accumulated_debt_interest): (Balance, Balance) =
            user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

        if *amount > user_reserve_data.debt {
            *amount = user_reserve_data.debt;
        }

        user_reserve_data.decrease_user_debt(
            &asset_id,
            &mut user_config,
            &amount,
        )?;
        user_reserve_data.check_debt_restrictions(&reserve_restrictions)?;

        reserve_data.decrease_total_debt(&amount);

        match reserve_parameters {
            Some(params) => reserve_data.recalculate_current_rates(&params)?,
            None => (),
        };

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);
        self.user_reserve_datas
            .insert(&(asset_id, *account), &user_reserve_data);
        self.user_configs.insert(account, &user_config);

        Ok((
            user_accumulated_supply_interest,
            user_accumulated_debt_interest,
        ))
    }

    pub fn calculate_user_lending_power_e6(
        &self,
        user: &AccountId,
    ) -> Result<(bool, u128), LendingPoolError> {
        let mut total_collateral_power_e6: u128 = 0;
        let mut total_debt_power_e6: u128 = 0;

        let user_config = self.user_configs.get(user).unwrap();
        let market_rule =
            self.market_rules.get(&user_config.market_rule_id).unwrap();

        let collaterals = user_config.deposits & user_config.collaterals;
        let debts = user_config.borrows;
        let active_user_assets = collaterals | debts;
        ink::env::debug_println!(
            "lending power| colalterals: {}, debts: {}",
            collaterals,
            debts
        );

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
            let reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
            let mut user_reserve_data =
                self.user_reserve_datas.get(&(asset_id, *user)).unwrap();
            let reserve_price = self.reserve_prices.get(&asset_id).unwrap();
            user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

            if ((collaterals >> asset_id) & 1) == 1 {
                let collateral_value_e8 = reserve_price
                    .amount_to_value_e8(&user_reserve_data.deposit)?;

                let collateral_coefficient_e6 = market_rule
                    .get(asset_id as usize)
                    .ok_or(LendingPoolError::RuleCollateralDisable)?
                    .ok_or(LendingPoolError::RuleCollateralDisable)?
                    .collateral_coefficient_e6
                    .ok_or(LendingPoolError::RuleCollateralDisable)?;

                ink::env::debug_println!(
                    "col_calue {} | col coef {}",
                    collateral_value_e8,
                    collateral_coefficient_e6,
                );

                ink::env::debug_println!(
                    "tot_col {} plus {}",
                    total_collateral_power_e6,
                    e8_mul_e6_to_e6_rdown(
                        collateral_value_e8,
                        collateral_coefficient_e6,
                    )
                    .unwrap()
                );
                total_collateral_power_e6 = total_collateral_power_e6
                    .checked_add(e8_mul_e6_to_e6_rdown(
                        collateral_value_e8,
                        collateral_coefficient_e6,
                    )?)
                    .ok_or(MathError::Overflow)?;
            }

            if ((debts >> asset_id) & 1) == 1 {
                let debt_value_e8 = reserve_price
                    .amount_to_value_e8(&user_reserve_data.debt)?;
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
    ) -> Result<(), LendingPoolError> {
        if !self.calculate_user_lending_power_e6(user)?.0 {
            return Err(LendingPoolError::InsufficientCollateral);
        }
        Ok(())
    }

    pub fn calculate_liquidated_amount_and_check_if_collateral(
        &self,
        user: &AccountId,
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
        amount_to_repay: &Balance,
    ) -> Result<Balance, LendingPoolError> {
        let asset_to_repay_id = self.asset_id(asset_to_repay)?;
        let asset_to_take_id = self.asset_id(asset_to_take)?;

        let reserve_prices_to_repay = self
            .reserve_prices
            .get(&asset_to_repay_id)
            .ok_or(LendingPoolError::PriceMissing)?;
        let reserve_prices_to_take = self
            .reserve_prices
            .get(&asset_to_take_id)
            .ok_or(LendingPoolError::PriceMissing)?;

        let user_config = &self
            .user_configs
            .get(user)
            .ok_or(LendingPoolError::NothingToRepay)?;
        if (user_config.collaterals >> asset_to_take_id) & 1_u128 != 1 {
            return Err(LendingPoolError::TakingNotACollateral);
        }

        let market_rule =
            self.market_rules.get(&user_config.market_rule_id).unwrap();
        let penalty_to_repay_e6 = market_rule
            .get(asset_to_repay_id as usize)
            .ok_or(LendingPoolError::MarketRuleInvalidAssetId)?
            .ok_or(LendingPoolError::MarketRuleInvalidAssetId)?
            .penalty_e6
            .ok_or(LendingPoolError::MarketRulePenaltyNotSet)?;
        let penalty_to_take_e6 = market_rule
            .get(asset_to_take_id as usize)
            .ok_or(LendingPoolError::MarketRuleInvalidAssetId)?
            .ok_or(LendingPoolError::MarketRuleInvalidAssetId)?
            .penalty_e6
            .ok_or(LendingPoolError::MarketRulePenaltyNotSet)?;

        let amount_to_take = calculate_amount_to_take(
            amount_to_repay,
            &reserve_prices_to_repay
                .token_price_e8
                .ok_or(LendingPoolError::PriceMissing)?,
            &reserve_prices_to_take
                .token_price_e8
                .ok_or(LendingPoolError::PriceMissing)?,
            &reserve_prices_to_repay.decimals,
            &reserve_prices_to_take.decimals,
            &penalty_to_repay_e6,
            &penalty_to_take_e6,
        )?;
        Ok(amount_to_take)
    }

    pub fn account_for_liquidate(
        &mut self,
        caller: &AccountId,
        liquidated_user: &AccountId,
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
        amount_to_repay: &mut Balance,
        timestamp: &Timestamp,
    ) -> Result<(u128, u128, u128, u128, u128, u128, u128), LendingPoolError>
    {
        let asset_to_repay_id = self.asset_id(&asset_to_repay)?;
        let asset_to_take_id = self.asset_id(&asset_to_take)?;
        let mut reserve_data_to_repay =
            self.reserve_datas.get(&asset_to_repay_id).unwrap();
        let mut reserve_indexes_to_repay =
            self.reserve_indexes.get(&asset_to_repay_id).unwrap();
        let mut reserve_data_to_take =
            self.reserve_datas.get(&asset_to_take_id).unwrap();
        let mut reserve_indexes_to_take =
            self.reserve_indexes.get(&asset_to_take_id).unwrap();
        let mut user_config = self
            .user_configs
            .get(&liquidated_user)
            .ok_or(LendingPoolError::NothingToRepay)?;
        let mut user_reserve_data_to_repay = self
            .user_reserve_datas
            .get(&(asset_to_repay_id, *liquidated_user))
            .ok_or(LendingPoolError::NothingToRepay)?;
        let mut user_reserve_data_to_take = self
            .user_reserve_datas
            .get(&(asset_to_take_id, *liquidated_user))
            .ok_or(LendingPoolError::NothingToCompensateWith)?;
        let mut caller_config =
            self.user_configs.get(caller).unwrap_or_default();
        let mut caller_reserve_data_to_take = self
            .user_reserve_datas
            .get(&(asset_to_take_id, *caller))
            .unwrap_or_default();

        let reserve_parameters_to_repay =
            self.reserve_parameters.get(&asset_to_repay_id);
        let reserve_parameters_to_take =
            self.reserve_parameters.get(&asset_to_take_id);

        if (caller_config.collaterals >> asset_to_take_id) & 1_u128 == 1 {
            return Err(LendingPoolError::RepayingWithACollateral);
        }

        if user_reserve_data_to_repay.debt == 0 {
            return Err(LendingPoolError::NothingToRepay);
        }

        // accumulate to repay
        reserve_data_to_repay
            .accumulate_interest(&mut reserve_indexes_to_repay, &timestamp)?;
        let (
            user_accumulated_supply_interest_to_repay,
            user_accumulated_debt_interest_to_repay,
        ) = user_reserve_data_to_repay
            .accumulate_user_interest(&reserve_indexes_to_repay)?;

        // accumulate to take
        // accumulate to repay

        reserve_data_to_take
            .accumulate_interest(&mut reserve_indexes_to_take, &timestamp)?;

        let (
            user_accumulated_supply_interest_to_take,
            user_accumulated_debt_interest_to_take,
        ): (Balance, Balance) = user_reserve_data_to_take
            .accumulate_user_interest(&reserve_indexes_to_take)?;
        // caller's

        let (
            caller_accumulated_supply_interest_to_take,
            caller_accumulated_debt_interest_to_take,
        ): (Balance, Balance) = caller_reserve_data_to_take
            .accumulate_user_interest(&reserve_indexes_to_take)?;

        if *amount_to_repay > user_reserve_data_to_repay.debt {
            *amount_to_repay = user_reserve_data_to_repay.debt;
        }

        let amount_to_take = self
            .calculate_liquidated_amount_and_check_if_collateral(
                &liquidated_user,
                asset_to_repay,
                asset_to_take,
                &amount_to_repay,
            )?;

        if amount_to_take > user_reserve_data_to_take.deposit {
            return Err(LendingPoolError::InsufficientDeposit);
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
        caller_reserve_data_to_take
            .increase_user_deposit(
                &asset_to_take_id,
                &mut caller_config,
                &amount_to_take,
            )
            .unwrap();

        match reserve_parameters_to_repay {
            Some(params) => {
                reserve_data_to_repay.recalculate_current_rates(&params)?
            }
            None => (),
        };
        match reserve_parameters_to_take {
            Some(params) => {
                reserve_data_to_take.recalculate_current_rates(&params)?
            }
            None => (),
        };

        self.reserve_datas
            .insert(&asset_to_repay_id, &reserve_data_to_repay);
        self.reserve_indexes
            .insert(&asset_to_repay_id, &reserve_indexes_to_repay);
        self.reserve_datas
            .insert(&asset_to_take_id, &reserve_data_to_take);
        self.reserve_indexes
            .insert(&asset_to_take_id, &reserve_indexes_to_take);

        self.user_configs.insert(liquidated_user, &user_config);
        self.user_reserve_datas.insert(
            &(asset_to_repay_id, *liquidated_user),
            &user_reserve_data_to_repay,
        );
        self.user_reserve_datas.insert(
            &(asset_to_take_id, *liquidated_user),
            &user_reserve_data_to_take,
        );
        self.user_configs.insert(caller, &caller_config);
        self.user_reserve_datas
            .insert(&(asset_to_take_id, *caller), &caller_reserve_data_to_take);

        Ok((
            amount_to_take,
            user_accumulated_supply_interest_to_repay,
            user_accumulated_debt_interest_to_repay,
            user_accumulated_supply_interest_to_take,
            user_accumulated_debt_interest_to_take,
            caller_accumulated_supply_interest_to_take,
            caller_accumulated_debt_interest_to_take,
        ))
    }

    pub fn account_for_token_price_change(
        &mut self,
        asset: &AccountId,
        new_price_e8: &u128,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_price = self.reserve_prices.get(&asset_id).unwrap();
        reserve_price.token_price_e8 = Some(*new_price_e8);
        self.reserve_prices.insert(&asset_id, &reserve_price);
        Ok(())
    }

    pub fn account_for_accumulate_interest(
        &mut self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let reserve_parameters = self.reserve_parameters.get(&asset_id);

        if reserve_data.indexes_update_timestamp <= *timestamp {
            return Err(LendingPoolError::AccumulatedAlready);
        }

        reserve_data.accumulate_interest(&mut reserve_indexes, &timestamp)?;
        match reserve_parameters {
            Some(params) => reserve_data.recalculate_current_rates(&params)?,
            None => (),
        };

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);

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

    pub fn account_for_reserve_data_parameters_change(
        &mut self,
        asset: &AccountId,
        reserve_parameters: &ReserveParameters,
        timestamp: &Timestamp,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if !self.reserve_parameters.contains(&asset_id) {
            return Err(LendingPoolError::AssetIsProtocolStablecoin);
        }
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        reserve_data.accumulate_interest(&mut reserve_indexes, &timestamp)?;
        reserve_data.recalculate_current_rates(&reserve_parameters)?;

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_parameters
            .insert(&asset_id, &reserve_parameters);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);
        Ok(())
    }

    pub fn total_deposit_of(
        &self,
        asset: &AccountId,
        timestamp: &Timestamp,
    ) -> Result<Balance, LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        reserve_data.accumulate_interest(&mut reserve_indexes, &timestamp)?;

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
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *user))
            .unwrap_or_default();
        reserve_data.accumulate_interest(&mut reserve_indexes, &timestamp)?;
        user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

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

        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let reserve_parameters = self.reserve_parameters.get(&asset_id);
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

        reserve_data.accumulate_interest(&mut reserve_indexes, timestamp)?;
        let (from_accumulated_deposit_interest, from_accumulated_debt_interest) =
            from_user_reserve_data.accumulate_user_interest(&reserve_indexes)?;
        let (to_accumulated_deposit_interest, to_accumulated_debt_interest) =
            to_user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

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

        match reserve_parameters {
            Some(params) => reserve_data.recalculate_current_rates(&params)?,
            None => (),
        };

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);
        self.user_configs.insert(&from, &from_config);
        self.user_reserve_datas
            .insert(&(asset_id, *from), &from_user_reserve_data);
        self.user_configs.insert(&to, &to_config);
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
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        reserve_data.accumulate_interest(&mut reserve_indexes, &timestamp)?;

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
        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let mut user_reserve_data = self
            .user_reserve_datas
            .get(&(asset_id, *user))
            .unwrap_or_default();
        reserve_data.accumulate_interest(&mut reserve_indexes, &timestamp)?;
        user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

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
        ink::env::debug_println!(
            "DEBT TRANSFER ACCOUNT| reserve_data.timestamp {}, timestamp {}",
            reserve_data.indexes_update_timestamp,
            *timestamp
        );

        let mut reserve_indexes = self.reserve_indexes.get(&asset_id).unwrap();
        let reserve_restrictions =
            self.reserve_restrictions.get(&asset_id).unwrap();
        let reserve_parameters = self.reserve_parameters.get(&asset_id);

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
        ink::env::debug_println!(
            "reserve indexes before {:?}",
            reserve_indexes
        );
        reserve_data.accumulate_interest(&mut reserve_indexes, timestamp)?;

        let (from_accumulated_deposit_interest, from_accumulated_debt_interest) =
            from_user_reserve_data.accumulate_user_interest(&reserve_indexes)?;
        let (to_accumulated_deposit_interest, to_accumulated_debt_interest) =
            to_user_reserve_data.accumulate_user_interest(&reserve_indexes)?;

        ink::env::debug_println!(
                "DEBT TRANSFER ACCOUNT| from_accumulated_debt_interest {}, to_accumulated_debt_interest {}",
                from_accumulated_debt_interest,
                to_accumulated_debt_interest
            );

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

        match reserve_parameters {
            Some(params) => reserve_data.recalculate_current_rates(&params)?,
            None => (),
        };

        self.reserve_datas.insert(&asset_id, &reserve_data);
        self.reserve_indexes.insert(&asset_id, &reserve_indexes);
        self.user_configs.insert(&from, &from_config);
        self.user_reserve_datas
            .insert(&(asset_id, *from), &from_user_reserve_data);
        self.user_configs.insert(&to, &to_config);
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
    ) -> Result<u32, LendingPoolError> {
        let rule_id = self.next_rule_id.get().unwrap_or(0);
        self.market_rules.insert(&rule_id, market_rule);
        self.next_rule_id.set(&(rule_id + 1));
        Ok(rule_id)
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
        self.market_rules.insert(market_rule_id, &market_rule);
        Ok(())
    }

    pub fn account_for_stablecoin_debt_rate_e24_change(
        &mut self,
        asset: &AccountId,
        debt_rate_e24: &u128,
    ) -> Result<(), LendingPoolError> {
        let asset_id = self.asset_id(asset)?;
        if self.reserve_parameters.contains(&asset_id) {
            return Err(LendingPoolError::AssetIsProtocolStablecoin);
        }
        let mut reserve_data = self.reserve_datas.get(&asset_id).unwrap();
        reserve_data.current_debt_rate_e24 = *debt_rate_e24;
        self.reserve_datas.insert(&asset_id, &reserve_data);
        Ok(())
    }
}
