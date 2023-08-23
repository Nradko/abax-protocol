use checked_math::checked_math;
use ink::prelude::format;
use openbrush::{
    contracts::psp22::{PSP22Error, PSP22Ref},
    traits::{AccountId, Balance, Storage, Timestamp},
};

use crate::{
    impls::{
        constants::{E8, MATH_ERROR_MESSAGE},
        lending_pool::storage::{
            lending_pool_storage::LendingPoolStorage,
            structs::{reserve_data::ReserveData, user_reserve_data::UserReserveData},
        },
    },
    traits::{abacus_token::traits::abacus_token::*, lending_pool::errors::LendingPoolError},
};
use ink::prelude::{vec::Vec, *};

use super::storage::{lending_pool_storage::MarketRule, structs::user_config::UserConfig};

pub fn _accumulate_interest(
    reserve_data: &mut ReserveData,
    user_reserve_data: &mut UserReserveData,
    block_timestamp: Timestamp,
) -> (Balance, Balance) {
    reserve_data._accumulate_interest(block_timestamp);
    user_reserve_data._accumulate_user_interest(reserve_data)
}

pub fn _check_amount_not_zero(amount: u128) -> Result<(), LendingPoolError> {
    if amount == 0 {
        return Err(LendingPoolError::AmountNotGreaterThanZero);
    }
    Ok(())
}
pub fn _check_deposit_enabled(reserve_data: &ReserveData) -> Result<(), LendingPoolError> {
    if !reserve_data.activated {
        return Err(LendingPoolError::Inactive);
    }
    if reserve_data.freezed {
        return Err(LendingPoolError::Freezed);
    }
    Ok(())
}

pub fn _check_activeness(reserve_data: &ReserveData) -> Result<(), LendingPoolError> {
    if !reserve_data.activated {
        return Err(LendingPoolError::Inactive);
    }
    Ok(())
}

pub fn _check_borrowing_enabled(
    reserve_data: &ReserveData,
    market_rule: &MarketRule,
) -> Result<(), LendingPoolError> {
    if !reserve_data.activated {
        return Err(LendingPoolError::Inactive);
    }
    if reserve_data.freezed {
        return Err(LendingPoolError::Freezed);
    }
    if market_rule
        .get(reserve_data.id as usize)
        .ok_or(LendingPoolError::RuleBorrowDisable)?
        .ok_or(LendingPoolError::RuleBorrowDisable)?
        .borrow_coefficient_e6
        .is_none()
    {
        return Err(LendingPoolError::RuleBorrowDisable);
    }
    if reserve_data.token_price_e8.is_none() {
        return Err(LendingPoolError::AssetPriceNotInitialized);
    }
    Ok(())
}

pub fn _check_enough_supply_to_be_collateral(
    reserve_data: &ReserveData,
    user_reserve_data: &UserReserveData,
) -> Result<(), LendingPoolError> {
    if user_reserve_data.supplied <= reserve_data.minimal_collateral {
        return Err(LendingPoolError::InsufficientSupply);
    }
    Ok(())
}

pub fn _check_enough_variable_debt(
    reserve_data: &ReserveData,
    user_reserve_data: &UserReserveData,
) -> Result<(), LendingPoolError> {
    if user_reserve_data.debt <= reserve_data.minimal_debt && user_reserve_data.debt != 0 {
        return Err(LendingPoolError::InsufficientDebt);
    }
    Ok(())
}

pub fn _check_max_supply(reserve_data: ReserveData) -> Result<(), LendingPoolError> {
    match reserve_data.maximal_total_supply {
        Some(maximal_total_supply) => {
            if reserve_data.total_supplied > maximal_total_supply {
                return Err(LendingPoolError::MaxSupplyReached);
            }
        }
        None => (),
    }
    Ok(())
}

pub fn _check_max_debt(reserve_data: ReserveData) -> Result<(), LendingPoolError> {
    match reserve_data.maximal_total_debt {
        Some(maximal_total_debt) => {
            if reserve_data.total_debt > maximal_total_debt {
                return Err(LendingPoolError::MaxDebtReached);
            }
        }
        None => (),
    }
    Ok(())
}

pub fn _increase_user_deposit(
    reserve_data: &ReserveData,
    user_reserve_data: &mut UserReserveData,
    user_config: &mut UserConfig,
    amount: u128,
) {
    // add variable debt
    user_config.deposits |= 1_u128 << reserve_data.id;

    user_reserve_data.supplied = user_reserve_data
        .supplied
        .checked_add(amount)
        .expect(MATH_ERROR_MESSAGE);
}

pub fn _increase_total_deposit(reserve_data: &mut ReserveData, amount: u128) {
    reserve_data.total_supplied = reserve_data
        .total_supplied
        .checked_add(amount)
        .expect(MATH_ERROR_MESSAGE);
}

pub fn _decrease_user_deposit(
    reserve_data: &ReserveData,
    user_reserve_data: &mut UserReserveData,
    user_config: &mut UserConfig,
    amount: u128,
) {
    if amount >= user_reserve_data.supplied {
        user_config.deposits &= !(1_u128 << reserve_data.id);
    }
    user_reserve_data.supplied = user_reserve_data.supplied.saturating_sub(amount);
}

pub fn _decrease_total_deposit(reserve_data: &mut ReserveData, amount: u128) {
    reserve_data.total_supplied = reserve_data.total_supplied.saturating_sub(amount);
}

pub fn _increase_user_variable_debt(
    reserve_data: &ReserveData,
    user_reserve_data: &mut UserReserveData,
    user_config: &mut UserConfig,
    amount: u128,
) {
    // add variable debt
    user_config.borrows |= 1_u128 << reserve_data.id;

    user_reserve_data.debt = user_reserve_data
        .debt
        .checked_add(amount)
        .expect(MATH_ERROR_MESSAGE);
}

pub fn _increase_total_variable_debt(reserve_data: &mut ReserveData, amount: u128) {
    reserve_data.total_debt = reserve_data
        .total_debt
        .checked_add(amount)
        .expect(MATH_ERROR_MESSAGE);
}

pub fn _decrease_user_variable_debt(
    reserve_data: &ReserveData,
    user_reserve_data: &mut UserReserveData,
    user_config: &mut UserConfig,
    amount: u128,
) {
    if amount >= user_reserve_data.debt {
        user_config.borrows &= !(1_u128 << reserve_data.id);
    }
    user_reserve_data.debt = user_reserve_data.debt.saturating_sub(amount);
}

pub fn _decrease_total_variable_debt(reserve_data: &mut ReserveData, amount: u128) {
    reserve_data.total_debt = reserve_data.total_debt.saturating_sub(amount);
}

pub fn _emit_abacus_token_transfer_event(
    abacus_token: &AccountId,
    user: &AccountId,
    amount_transferred: i128,
) -> Result<(), PSP22Error> {
    if amount_transferred > 0 {
        AbacusTokenRef::emit_transfer_events(
            abacus_token,
            vec![TransferEventData {
                from: None,
                to: Some(*user),
                amount: amount_transferred as u128,
            }],
        )
    } else if amount_transferred < 0 {
        AbacusTokenRef::emit_transfer_events(
            abacus_token,
            vec![TransferEventData {
                from: Some(*user),
                to: None,
                amount: (-amount_transferred) as u128,
            }],
        )
    } else {
        Ok(())
    }
}

pub struct TransferEventDataSimplified {
    pub user: AccountId,
    pub amount: i128,
}

pub fn _emit_abacus_token_transfer_events(
    abacus_token: &AccountId,
    data: &Vec<TransferEventDataSimplified>,
) -> Result<(), PSP22Error> {
    let mut events: Vec<TransferEventData> = vec![];
    for event in data {
        if event.amount > 0 {
            events.push(TransferEventData {
                from: None,
                to: Some(event.user),
                amount: event.amount as u128,
            })
        } else {
            events.push(TransferEventData {
                from: Some(event.user),
                to: None,
                amount: (-event.amount) as u128,
            })
        }
    }
    AbacusTokenRef::emit_transfer_events(abacus_token, events)
}

pub fn _emit_abacus_token_transfer_event_and_decrease_allowance(
    abacus_token: &AccountId,
    user: &AccountId,
    amount_transferred: i128,
    spender: &AccountId,
    decrease_alowance_by: Balance,
) -> Result<(), PSP22Error> {
    if *spender == *user {
        _emit_abacus_token_transfer_event(abacus_token, user, amount_transferred)
    } else {
        let event: TransferEventData;
        if amount_transferred > 0 {
            event = TransferEventData {
                from: None,
                to: Some(*user),
                amount: amount_transferred as u128,
            }
        } else {
            event = TransferEventData {
                from: Some(*user),
                to: None,
                amount: amount_transferred as u128,
            }
        }
        AbacusTokenRef::emit_transfer_event_and_decrease_allowance(
            abacus_token,
            event,
            *user,
            *spender,
            decrease_alowance_by,
        )
    }
}

pub trait Internal {
    fn _get_user_free_collateral_coefficient_e6(
        &self,
        user: &AccountId,
        user_config: &UserConfig,
        market_rule: &MarketRule,
        block_timestamp: Timestamp,
    ) -> Result<(bool, u128), LendingPoolError>;

    fn _check_user_free_collateral(
        &self,
        user: &AccountId,
        user_config: &UserConfig,
        market_rule: &MarketRule,
        block_timestamp: Timestamp,
    ) -> Result<(), LendingPoolError>;
}

impl<T: Storage<LendingPoolStorage>> Internal for T {
    #[allow(clippy::needless_range_loop)] //for readability/performance purposes
    fn _get_user_free_collateral_coefficient_e6(
        &self,
        user: &AccountId,
        user_config: &UserConfig,
        market_rule: &MarketRule,
        block_timestamp: Timestamp,
    ) -> Result<(bool, u128), LendingPoolError> {
        let mut total_collateral_coefficient_e6: u128 = 0;
        let mut total_debt_coefficient_e6: u128 = 0;
        let registered_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();

        let collaterals = user_config.deposits & user_config.collaterals;
        let borrows = user_config.borrows;
        ink::env::debug_println!("user_config.borrows {}", borrows); //PR-->OB this produces 1
        ink::env::debug_println!("registered_assets.len() {}", registered_assets.len());
        let active_user_assets = collaterals | borrows;
        for i in 0..registered_assets.len() {
            if ((active_user_assets >> i) & 1) == 0 {
                ink::env::debug_println!("skipping asset {:X?}", registered_assets[i]);
                continue;
            }
            let asset = registered_assets[i];
            ink::env::debug_println!("asset active {:X?}", asset);
            // below errors should never occure. we use unwrap in last case as default would be very dangerous...
            let mut reserve_data = self
                .data::<LendingPoolStorage>()
                .get_reserve_data(&asset)
                .unwrap_or_default();
            let mut user_reserve = self
                .data::<LendingPoolStorage>()
                .get_user_reserve(&asset, user)
                .unwrap_or_default();
            let asset_price_e8 = reserve_data
                .token_price_e8
                .ok_or(LendingPoolError::PriceMissing)?;
            reserve_data._accumulate_interest(block_timestamp);
            user_reserve._accumulate_user_interest(&mut reserve_data);
            if ((collaterals >> i) & 1) == 1 {
                let collateral_asset_price_e8 = asset_price_e8;
                let collateral = if user_reserve.supplied >= reserve_data.minimal_collateral {
                    user_reserve.supplied
                } else {
                    0
                };
                let asset_supplied_value_e8 = u128::try_from(
                    checked_math!(collateral * collateral_asset_price_e8 / reserve_data.decimals)
                        .unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                let collateral_coefficient_e6 = market_rule
                    .get(i)
                    .ok_or(LendingPoolError::RuleCollateralDisable)?
                    .ok_or(LendingPoolError::RuleCollateralDisable)?
                    .collateral_coefficient_e6
                    .ok_or(LendingPoolError::RuleCollateralDisable)?;
                let value_to_add = u128::try_from(
                    checked_math!(asset_supplied_value_e8 * collateral_coefficient_e6 / E8)
                        .unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                total_collateral_coefficient_e6 = total_collateral_coefficient_e6
                    .checked_add(value_to_add)
                    .expect(MATH_ERROR_MESSAGE);
            }

            if ((borrows >> i) & 1) == 1 {
                let debt = user_reserve.debt;

                ink::env::debug_println!("debt enabled for {:X?} | debt {}", asset, debt); //PR-->OB this code is unreachable
                let asset_debt_value_e8 = u128::try_from(
                    checked_math!(debt * asset_price_e8 / reserve_data.decimals).unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                let borrow_coefficient_e6 = market_rule
                    .get(i)
                    .ok_or(LendingPoolError::RuleBorrowDisable)?
                    .ok_or(LendingPoolError::RuleBorrowDisable)?
                    .borrow_coefficient_e6
                    .ok_or(LendingPoolError::RuleBorrowDisable)?;
                let value_to_add = u128::try_from(
                    checked_math!(asset_debt_value_e8 * borrow_coefficient_e6 / 100_000_000)
                        .unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                total_debt_coefficient_e6 = total_debt_coefficient_e6
                    .checked_add(value_to_add)
                    .expect(MATH_ERROR_MESSAGE);
            }
        }
        ink::env::debug_println!(
            "total_collateral_coefficient_e6 {} | total_debt_coefficient_e6 {}", //PR-->OB this prints 0, 0 when it should print 0 and 1000000000000000000
            total_collateral_coefficient_e6,
            total_debt_coefficient_e6
        );

        if total_collateral_coefficient_e6 >= total_debt_coefficient_e6 {
            Ok((
                true,
                total_collateral_coefficient_e6 - total_debt_coefficient_e6,
            ))
        } else {
            Ok((
                false,
                total_debt_coefficient_e6 - total_collateral_coefficient_e6,
            ))
        }
    }

    fn _check_user_free_collateral(
        &self,
        user: &AccountId,
        user_config: &UserConfig,
        market_rule: &MarketRule,
        block_timestamp: Timestamp,
    ) -> Result<(), LendingPoolError> {
        let (collaterized, free_collateral) = self._get_user_free_collateral_coefficient_e6(
            user,
            user_config,
            market_rule,
            block_timestamp,
        )?;

        ink::env::debug_println!(
            "{}",
            format!(
                "_check_user_free_collateral | check run for {:X?} | collaterized {} | free_collateral {}",
                user, collaterized, free_collateral
            )
        );
        if !collaterized {
            return Err(LendingPoolError::InsufficientCollateral);
        }
        Ok(())
    }
}

pub trait InternalIncome {
    fn _get_protocol_income(&self, assets: &[AccountId]) -> Vec<(AccountId, i128)>;
}

impl<T: Storage<LendingPoolStorage>> InternalIncome for T {
    fn _get_protocol_income(&self, assets: &[AccountId]) -> Vec<(AccountId, i128)> {
        let mut result: Vec<(AccountId, i128)> = vec![];
        for asset in assets.iter() {
            let reserve_data = self
                .data::<LendingPoolStorage>()
                .get_reserve_data(asset)
                .unwrap_or_default();
            let balance = PSP22Ref::balance_of(asset, Self::env().account_id());
            let income = i128::try_from(
                reserve_data
                    .total_debt
                    .checked_add(balance)
                    .expect(MATH_ERROR_MESSAGE),
            )
            .expect(MATH_ERROR_MESSAGE)
                - reserve_data.total_supplied as i128;
            result.push((*asset, income));
        }
        result
    }
}
