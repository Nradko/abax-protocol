use checked_math::checked_math;
use openbrush::{
    contracts::psp22::{
        PSP22Error,
        PSP22Ref,
    },
    traits::{
        AccountId,
        Balance,
        Storage,
        Timestamp,
    },
};

use crate::{
    impls::{
        constants::{
            E8,
            MATH_ERROR_MESSAGE,
        },
        lending_pool::storage::{
            lending_pool_storage::LendingPoolStorage,
            structs::{
                reserve_data::ReserveData,
                user_reserve_data::UserReserveData,
            },
        },
    },
    traits::{
        abacus_token::traits::abacus_token::*,
        lending_pool::errors::LendingPoolError,
    },
};
use ink::prelude::{
    vec::Vec,
    *,
};

use super::storage::structs::user_config::UserConfig;

pub fn _accumulate_interest(
    reserve_data: &mut ReserveData,
    user_reserve_data: &mut UserReserveData,
    block_timestamp: Timestamp,
) -> (Balance, Balance) {
    // TODO:: should this line be here?  reserve_data._recalculate_current_rates();
    reserve_data._accumulate_interest(block_timestamp);
    user_reserve_data._accumulate_user_interest(reserve_data)
}

pub fn _value_e8(amount: Balance, decimals: u128, price_e8: u128) -> u128 {
    amount * price_e8 / decimals
}

pub fn _check_deposit_enabled(reserve_data: &ReserveData) -> Result<(), LendingPoolError> {
    if !reserve_data.activated {
        return Err(LendingPoolError::Inactive)
    }
    if reserve_data.freezed {
        return Err(LendingPoolError::Freezed)
    }
    Ok(())
}

pub fn _check_activeness(reserve_data: &ReserveData) -> Result<(), LendingPoolError> {
    if !reserve_data.activated {
        return Err(LendingPoolError::Inactive)
    }
    Ok(())
}

pub fn _check_borrowing_enabled(reserve_data: &ReserveData) -> Result<(), LendingPoolError> {
    if !reserve_data.activated {
        return Err(LendingPoolError::Inactive)
    }
    if reserve_data.freezed {
        return Err(LendingPoolError::Freezed)
    }
    if reserve_data.borrow_coefficient_e6.is_none() {
        return Err(LendingPoolError::AssetBorrowDisabled)
    }
    if reserve_data.token_price_e8.is_none() {
        return Err(LendingPoolError::AssetPriceNotInitialized)
    }
    Ok(())
}

pub fn _check_enough_supply_to_be_collateral(
    reserve_data: &ReserveData,
    user_reserve_data: &UserReserveData,
) -> Result<(), LendingPoolError> {
    if user_reserve_data.supplied <= reserve_data.minimal_collateral {
        return Err(LendingPoolError::InsufficientSupply)
    }
    Ok(())
}

pub fn _check_enough_variable_debt(
    reserve_data: &ReserveData,
    user_reserve_data: &UserReserveData,
) -> Result<(), LendingPoolError> {
    if user_reserve_data.variable_borrowed <= reserve_data.minimal_debt && user_reserve_data.variable_borrowed != 0 {
        return Err(LendingPoolError::InsufficientDebt)
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
    user_config.borrows_variable |= 1_u128 << reserve_data.id;

    user_reserve_data.variable_borrowed = user_reserve_data
        .variable_borrowed
        .checked_add(amount)
        .expect(MATH_ERROR_MESSAGE);
}

pub fn _increase_total_variable_debt(reserve_data: &mut ReserveData, amount: u128) {
    reserve_data.total_variable_borrowed = reserve_data
        .total_variable_borrowed
        .checked_add(amount)
        .expect(MATH_ERROR_MESSAGE);
}

pub fn _decrease_user_variable_debt(
    reserve_data: &ReserveData,
    user_reserve_data: &mut UserReserveData,
    user_config: &mut UserConfig,
    amount: u128,
) {
    if amount >= user_reserve_data.variable_borrowed {
        user_config.borrows_variable &= !(1_u128 << reserve_data.id);
    }
    user_reserve_data.variable_borrowed = user_reserve_data.variable_borrowed.saturating_sub(amount);
}

pub fn _decrease_total_variable_debt(reserve_data: &mut ReserveData, amount: u128) {
    reserve_data.total_variable_borrowed = reserve_data.total_variable_borrowed.saturating_sub(amount);
}

pub fn _emit_all_abacus_token_transfer_events(
    reserve_data: &ReserveData,
    user: &AccountId,
    a_token_amount_transferred: i128,
    v_token_amount_transferred: i128,
) -> Result<(), PSP22Error> {
    _emit_abacus_token_transfer_event(&reserve_data.a_token_address, user, a_token_amount_transferred)?;
    _emit_abacus_token_transfer_event(&reserve_data.v_token_address, user, v_token_amount_transferred)?;
    Ok(())
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
    fn _get_user_free_collateral_coefficient_e6(&self, user: &AccountId, block_timestamp: Timestamp) -> (bool, u128);

    fn _check_user_free_collateral(&self, user: &AccountId, block_timestamp: Timestamp)
        -> Result<(), LendingPoolError>;
}

impl<T: Storage<LendingPoolStorage>> Internal for T {
    #[allow(clippy::needless_range_loop)]
    default fn _get_user_free_collateral_coefficient_e6(
        &self,
        user: &AccountId,
        block_timestamp: Timestamp,
    ) -> (bool, u128) {
        let mut total_collateral_coefficient_e6: u128 = 0;
        let mut total_debt_coefficient_e6: u128 = 0;
        let registered_assets = self.data::<LendingPoolStorage>().get_all_registered_assets();

        let user_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(user)
            .unwrap_or_default();
        let collaterals = user_config.deposits & user_config.collaterals;
        let borrows = user_config.borrows_variable;
        let active = collaterals | borrows;
        for i in 0..registered_assets.len() {
            if ((active >> i) & 1) == 0 {
                continue
            }
            let asset = registered_assets[i];
            // below errors should never occure. we use unwrap in last case as default would be very dangerous...
            let mut reserve_data = self
                .data::<LendingPoolStorage>()
                .get_reserve_data(&asset)
                .unwrap_or_default();
            let mut user_reserve = self
                .data::<LendingPoolStorage>()
                .get_user_reserve(&asset, user)
                .unwrap_or_default();
            let asset_price_e8 = reserve_data.token_price_e8.unwrap();
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
                    checked_math!(collateral * collateral_asset_price_e8 / reserve_data.decimals).unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                let collateral_coefficient_e6 = reserve_data.collateral_coefficient_e6.unwrap_or(0);
                let value_to_add =
                    u128::try_from(checked_math!(asset_supplied_value_e8 * collateral_coefficient_e6 / E8).unwrap())
                        .expect(MATH_ERROR_MESSAGE);
                total_collateral_coefficient_e6 = total_collateral_coefficient_e6
                    .checked_add(value_to_add)
                    .expect(MATH_ERROR_MESSAGE);
            }

            if ((borrows >> i) & 1) == 1 {
                let debt = user_reserve.variable_borrowed;
                let asset_debt_value_e8 =
                    u128::try_from(checked_math!(debt * asset_price_e8 / reserve_data.decimals).unwrap())
                        .expect(MATH_ERROR_MESSAGE);
                let borrow_coefficient_e6 = reserve_data.borrow_coefficient_e6.unwrap();
                let value_to_add =
                    u128::try_from(checked_math!(asset_debt_value_e8 * borrow_coefficient_e6 / 100_000_000).unwrap())
                        .expect(MATH_ERROR_MESSAGE);
                total_debt_coefficient_e6 = total_debt_coefficient_e6
                    .checked_add(value_to_add)
                    .expect(MATH_ERROR_MESSAGE);
            }
        }

        if total_collateral_coefficient_e6 >= total_debt_coefficient_e6 {
            (true, total_collateral_coefficient_e6 - total_debt_coefficient_e6)
        } else {
            (false, total_debt_coefficient_e6 - total_collateral_coefficient_e6)
        }
    }

    default fn _check_user_free_collateral(
        &self,
        user: &AccountId,
        block_timestamp: Timestamp,
    ) -> Result<(), LendingPoolError> {
        let (collaterized, _) = self._get_user_free_collateral_coefficient_e6(user, block_timestamp);
        if !collaterized {
            return Err(LendingPoolError::InsufficientCollateral)
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
                    .total_variable_borrowed
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
