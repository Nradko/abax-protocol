// TODO::think should we emit events on set_as_collateral

#![allow(unused_variables)]
use checked_math::checked_math;
use ink_prelude::{vec::Vec, *};

use openbrush::{
    contracts::traits::psp22::*,
    traits::{AccountId, Balance, Storage},
};

use crate::{
    impls::{
        constants::{E18, E6, MATH_ERROR_MESSAGE},
        lending_pool::{
            internal::{_accumulate_interest, *},
            storage::{
                lending_pool_storage::LendingPoolStorage,
                structs::{
                    reserve_data::ReserveData, user_config::UserConfig,
                    user_reserve_data::UserReserveData,
                },
            },
        },
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolError, events::*, traits::actions::LendingPoolLiquidate,
        },
    },
};

impl<T: Storage<LendingPoolStorage> + LiquidateInternal> LendingPoolLiquidate for T {
    default fn liquidate(
        &mut self,
        liquidated_user: AccountId,
        asset_to_repay: AccountId,
        asset_to_take: AccountId,
        amount_to_repay: Option<Balance>,
        minimum_recieved_for_one_repaid_token_e18: u128,
        data: Vec<u8>,
    ) -> Result<(Balance, Balance), LendingPoolError> {
        if data.len() == 0 {
            return Err(LendingPoolError::UnspecifiedAction);
        }
        let block_timestamp = BlockTimestampProviderRef::get_block_timestamp(
            &self.data::<LendingPoolStorage>().block_timestamp_provider,
        );
        let (collaterized, _) =
            self._get_user_free_collateral_coefficient_e6(&liquidated_user, block_timestamp);
        if collaterized {
            return Err(LendingPoolError::Collaterized);
        }
        let caller = Self::env().caller();
        let (
            mut user_config,
            mut caller_config,
            mut reserve_data_to_repay,
            mut user_reserve_data_to_repay,
            mut reserve_data_to_take,
            mut user_reserve_data_to_take,
            mut caller_reserve_data_to_take,
        ) = self._pull_data_for_liquidate(
            &liquidated_user,
            &caller,
            &asset_to_repay,
            &asset_to_take,
        )?;
        let asset_to_repay_price_e8 = reserve_data_to_repay.token_price_e8()?;
        let asset_to_take_price_e8 = reserve_data_to_take.token_price_e8()?;
        let penalty_to_repay_e6 = reserve_data_to_repay.penalty_e6;
        let penalty_to_take_e6 = reserve_data_to_take.penalty_e6;
        // Check if asset_to_take is marked as collateral
        if (user_config.collaterals >> reserve_data_to_take.id) & 1_u128 != 1 {
            return Err(LendingPoolError::TakingNotACollateral);
        }
        // Check if there is any debt to repay
        let user_debt = match data[0] {
            0 => user_reserve_data_to_repay.variable_borrowed,
            1 => user_reserve_data_to_repay.stable_borrowed,
            _ => return Err(LendingPoolError::UnspecifiedAction),
        };
        if user_debt == 0 {
            return Err(LendingPoolError::NothingToRepay);
        }
        // Check if there is any supply to take
        if user_reserve_data_to_take.supplied == 0 {
            return Err(LendingPoolError::NothingToCompensateWith);
        }
        // MODIFY PULLED STORAGE
        // accumulate to repay
        let (
            interest_user_supply_to_repay,
            interest_user_variable_borrow_to_repay,
            interest_user_stable_borrow_to_repay,
        ): (Balance, Balance, Balance) = _accumulate_interest(
            &mut reserve_data_to_repay,
            &mut user_reserve_data_to_repay,
            block_timestamp,
        );
        // accumulate to take
        // user's
        let (
            interest_user_supply_to_take,
            interest_user_variable_borrow_to_take,
            interest_user_stable_borrow_to_take,
        ): (Balance, Balance, Balance) = _accumulate_interest(
            &mut reserve_data_to_take,
            &mut user_reserve_data_to_take,
            block_timestamp,
        );
        // caller's
        let (
            interest_caller_supply_to_take,
            interest_caller_variable_borrow_to_take,
            interest_caller_stable_borrow_to_take,
        ): (Balance, Balance, Balance) =
            caller_reserve_data_to_take._accumulate_user_interest(&mut reserve_data_to_take);

        // calculate and check amount to be taken by caller
        let amount_to_repay_value = match amount_to_repay {
            Some(v) => {
                if v > user_debt {
                    user_debt
                } else {
                    v
                }
            }
            None => user_debt,
        };
        if amount_to_repay_value == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero);
        }
        let mut amount_to_take = calculate_amount_to_take(
            amount_to_repay_value,
            asset_to_repay_price_e8,
            asset_to_take_price_e8,
            reserve_data_to_repay.decimals,
            reserve_data_to_take.decimals,
            penalty_to_repay_e6,
            penalty_to_take_e6,
        )?;
        if amount_to_take > user_reserve_data_to_take.supplied {
            amount_to_take = user_reserve_data_to_take.supplied;
        }

        let recieved_for_one_repaid_token_e18 =
            u128::try_from(checked_math!(amount_to_take * E18 / (amount_to_repay_value)).unwrap())
                .expect(MATH_ERROR_MESSAGE);

        if recieved_for_one_repaid_token_e18 < minimum_recieved_for_one_repaid_token_e18 {
            return Err(LendingPoolError::MinimumRecieved);
        }
        // modify configs
        if amount_to_take >= user_reserve_data_to_take.supplied {
            // amount_to_take can be smaller than expected!!! caller should specify minimum_amount_per_token_paid
            amount_to_take = user_reserve_data_to_take.supplied;
            user_config.deposits &= !(1_u128 << reserve_data_to_repay.id);
        }

        if amount_to_repay_value == user_debt {
            match data[0] {
                0 => user_config.borrows_variable &= !(1_u128 << reserve_data_to_repay.id),
                1 => user_config.borrows_stable &= !(1_u128 << reserve_data_to_repay.id),
                _ => (),
            };
        }

        if (caller_config.deposits >> reserve_data_to_take.id) & 1 == 0 {
            caller_config.deposits |= 1_u128 << reserve_data_to_take.id;
        }
        match data[0] {
            0 => {
                _change_state_liquidate_variable(
                    &mut reserve_data_to_repay,
                    &mut user_reserve_data_to_repay,
                    &mut user_reserve_data_to_take,
                    &mut caller_reserve_data_to_take,
                    amount_to_repay_value,
                    amount_to_take,
                );
                //// ABACUS TOKEN EVENTS
                //// to_repay_token
                // ATOKEN
                _emit_abacus_token_transfer_event(
                    &reserve_data_to_repay.a_token_address,
                    &liquidated_user,
                    (interest_user_supply_to_repay) as i128,
                )?;
                // VTOKEN
                _emit_abacus_token_transfer_event(
                    &reserve_data_to_repay.v_token_address,
                    &liquidated_user,
                    interest_user_variable_borrow_to_repay as i128 - amount_to_repay_value as i128,
                )?;
                // STOKEN
                _emit_abacus_token_transfer_event(
                    &reserve_data_to_repay.s_token_address,
                    &liquidated_user,
                    interest_user_stable_borrow_to_repay as i128,
                )?;
                // EVENT
                self._emit_liquidation_variable_event(
                    caller,
                    liquidated_user,
                    asset_to_repay,
                    asset_to_take,
                    amount_to_repay_value,
                    amount_to_take,
                );
            }
            1 => {
                _change_state_liquidate_stable(
                    &mut reserve_data_to_repay,
                    &mut user_reserve_data_to_repay,
                    &mut user_reserve_data_to_take,
                    &mut caller_reserve_data_to_take,
                    amount_to_repay_value,
                    amount_to_take,
                );
                //// ABACUS TOKEN EVENTS
                //// to_repay_token
                // ATOKEN
                _emit_abacus_token_transfer_event(
                    &reserve_data_to_repay.a_token_address,
                    &liquidated_user,
                    interest_user_supply_to_repay as i128,
                )?;
                // VTOKEN
                _emit_abacus_token_transfer_event(
                    &reserve_data_to_repay.v_token_address,
                    &liquidated_user,
                    interest_user_variable_borrow_to_repay as i128,
                )?;
                // STOKEN
                _emit_abacus_token_transfer_event(
                    &reserve_data_to_repay.s_token_address,
                    &liquidated_user,
                    interest_user_stable_borrow_to_repay as i128 - amount_to_repay_value as i128,
                )?;
                ////EVENT
                self._emit_liquidation_stable_event(
                    caller,
                    liquidated_user,
                    asset_to_repay,
                    asset_to_take,
                    amount_to_repay_value,
                    amount_to_take,
                );
            }
            _ => return Err(LendingPoolError::UnspecifiedAction),
        }

        //// to_take_token
        // ATOKEN
        _emit_abacus_token_transfer_events(
            &reserve_data_to_take.a_token_address,
            &vec![
                TransferEventDataSimplified {
                    user: liquidated_user,
                    amount: interest_user_supply_to_take as i128 - amount_to_take as i128,
                },
                TransferEventDataSimplified {
                    user: caller,
                    amount: (interest_caller_supply_to_take + amount_to_take) as i128,
                },
            ],
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_events(
            &reserve_data_to_take.v_token_address,
            &vec![
                TransferEventDataSimplified {
                    user: liquidated_user,
                    amount: interest_user_variable_borrow_to_take as i128,
                },
                TransferEventDataSimplified {
                    user: caller,
                    amount: interest_caller_variable_borrow_to_take as i128,
                },
            ],
        )?;
        // STOKEN
        _emit_abacus_token_transfer_events(
            &reserve_data_to_take.s_token_address,
            &vec![
                TransferEventDataSimplified {
                    user: liquidated_user,
                    amount: interest_user_stable_borrow_to_take as i128,
                },
                TransferEventDataSimplified {
                    user: caller,
                    amount: interest_caller_stable_borrow_to_take as i128,
                },
            ],
        )?;
        // recalculate
        reserve_data_to_repay._recalculate_current_rates()?;
        self._push_data_for_liquidate(
            &&liquidated_user,
            &caller,
            &asset_to_repay,
            &asset_to_take,
            &reserve_data_to_repay,
            &user_reserve_data_to_repay,
            &reserve_data_to_take,
            &user_reserve_data_to_take,
            &caller_reserve_data_to_take,
        );
        //// TOKEN TRANSFERS
        PSP22Ref::transfer_from_builder(
            &asset_to_repay,
            caller,
            Self::env().account_id(),
            amount_to_repay_value,
            Vec::<u8>::new(),
        )
        .call_flags(ink_env::CallFlags::default().set_allow_reentry(true))
        .fire()
        .unwrap()?;
        Ok((amount_to_repay_value, amount_to_take))
    }
}

pub trait LiquidateInternal {
    fn _pull_data_for_liquidate(
        &self,
        liquidated_user: &AccountId,
        caller: &AccountId,
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
    ) -> Result<
        (
            UserConfig,
            UserConfig,
            ReserveData,
            UserReserveData,
            ReserveData,
            UserReserveData,
            UserReserveData,
        ),
        LendingPoolError,
    >;
    fn _push_data_for_liquidate(
        &mut self,
        liquidated_user: &AccountId,
        caller: &AccountId,
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
        reserve_data_to_repay: &ReserveData,
        user_reserve_data_to_repay: &UserReserveData,
        reserve_data_to_take: &ReserveData,
        user_reserve_data_to_take: &UserReserveData,
        caller_reserve_data_to_take: &UserReserveData,
    );
}

impl<T: Storage<LendingPoolStorage> + EmitLiquidateEvents> LiquidateInternal for T {
    fn _pull_data_for_liquidate(
        &self,
        liquidated_user: &AccountId,
        caller: &AccountId,
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
    ) -> Result<
        (
            UserConfig,
            UserConfig,
            ReserveData,
            UserReserveData,
            ReserveData,
            UserReserveData,
            UserReserveData,
        ),
        LendingPoolError,
    > {
        Ok((
            self.data::<LendingPoolStorage>()
                .get_user_config(&liquidated_user)?,
            self.data::<LendingPoolStorage>()
                .get_or_create_user_config(&caller),
            self.data::<LendingPoolStorage>()
                .get_reserve_data(&asset_to_repay)?,
            self.data::<LendingPoolStorage>()
                .get_user_reserve(&asset_to_repay, &liquidated_user)?,
            self.data::<LendingPoolStorage>()
                .get_reserve_data(&asset_to_take)?,
            self.data::<LendingPoolStorage>()
                .get_user_reserve(&asset_to_take, &liquidated_user)?,
            self.data::<LendingPoolStorage>()
                .get_or_create_user_reserve(&asset_to_take, &caller),
        ))
    }
    fn _push_data_for_liquidate(
        &mut self,
        liquidated_user: &AccountId,
        caller: &AccountId,
        asset_to_repay: &AccountId,
        asset_to_take: &AccountId,
        reserve_data_to_repay: &ReserveData,
        user_reserve_data_to_repay: &UserReserveData,
        reserve_data_to_take: &ReserveData,
        user_reserve_data_to_take: &UserReserveData,
        caller_reserve_data_to_take: &UserReserveData,
    ) {
        // asset_to_repay
        // reserveData
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset_to_repay, &reserve_data_to_repay);
        // userReserveData
        self.data::<LendingPoolStorage>().insert_user_reserve(
            &asset_to_repay,
            &liquidated_user,
            &user_reserve_data_to_repay,
        );
        // asset_to_take
        // reserveData
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset_to_take, &reserve_data_to_take);
        // userReserveData
        self.data::<LendingPoolStorage>().insert_user_reserve(
            &asset_to_take,
            &liquidated_user,
            &user_reserve_data_to_take,
        );
        self.data::<LendingPoolStorage>().insert_user_reserve(
            &asset_to_take,
            &caller,
            &caller_reserve_data_to_take,
        );
    }
}

fn calculate_amount_to_take(
    amount_to_repay: u128,
    asset_to_repay_price_e8: u128,
    asset_to_take_price_e8: u128,
    reserve_to_repay_decimals: u128,
    reserve_to_take_decimals: u128,
    penalty_to_repay_e6: u128,
    penalty_to_take_e6: u128,
) -> Result<u128, LendingPoolError> {
    let result = u128::try_from(
        checked_math!(
            amount_to_repay
                * (asset_to_repay_price_e8
                    * reserve_to_take_decimals
                    * (E6 + penalty_to_repay_e6 + penalty_to_take_e6))
                / (asset_to_take_price_e8 * reserve_to_repay_decimals * E6)
        )
        .unwrap(),
    )
    .expect(MATH_ERROR_MESSAGE);
    Ok(result)
}

fn _change_state_liquidate_variable(
    reserve_data_to_repay: &mut ReserveData,
    user_reserve_data_to_repay: &mut UserReserveData,
    user_reserve_data_to_take: &mut UserReserveData,
    caller_reserve_data_to_take: &mut UserReserveData,
    amount_to_repay_value: u128,
    amount_to_take: u128,
) {
    // sub variable debt
    user_reserve_data_to_repay.variable_borrowed =
        user_reserve_data_to_repay.variable_borrowed - amount_to_repay_value;
    reserve_data_to_repay.total_variable_borrowed =
        reserve_data_to_repay.total_variable_borrowed - amount_to_repay_value;
    // sub supplied from user
    user_reserve_data_to_take.supplied = user_reserve_data_to_take.supplied - amount_to_take;
    // add supplied to caller
    caller_reserve_data_to_take.supplied = caller_reserve_data_to_take
        .supplied
        .checked_add(amount_to_take)
        .unwrap();
}

fn _change_state_liquidate_stable(
    reserve_data_to_repay: &mut ReserveData,
    user_reserve_data_to_repay: &mut UserReserveData,
    user_reserve_data_to_take: &mut UserReserveData,
    caller_reserve_data_to_take: &mut UserReserveData,
    amount_to_repay_value: u128,
    amount_to_take: u128,
) {
    // sub stable debt
    // user
    user_reserve_data_to_repay.stable_borrowed = u128::try_from(
        checked_math!(user_reserve_data_to_repay.stable_borrowed - amount_to_repay_value).unwrap(),
    )
    .expect(MATH_ERROR_MESSAGE);
    ink_env::debug_println!(
        " | Liquidate || _change_state_liquidate_stable | user_reserve_data_to_repay.stable_borrowed = {}",
        user_reserve_data_to_repay.stable_borrowed
    );
    // reserve
    ink_env::debug_println!(
        " | Liquidate || _change_state_liquidate_stable | reserve_data_to_repay.avarage_stable_rate_e18"
    );
    reserve_data_to_repay.avarage_stable_rate_e24 = if reserve_data_to_repay.sum_stable_debt
        > amount_to_repay_value
    {
        u128::try_from(
            checked_math!(
                (reserve_data_to_repay.avarage_stable_rate_e24
                    * reserve_data_to_repay.sum_stable_debt
                    - user_reserve_data_to_repay.stable_borrow_rate_e24 * amount_to_repay_value)
                    / (reserve_data_to_repay.sum_stable_debt - amount_to_repay_value)
            )
            .unwrap(),
        )
        .expect(MATH_ERROR_MESSAGE)
    } else {
        0
    };

    reserve_data_to_repay.sum_stable_debt =
        reserve_data_to_repay.sum_stable_debt - amount_to_repay_value;
    // sub supplied from user
    user_reserve_data_to_take.supplied = user_reserve_data_to_take.supplied - amount_to_take;
    // add supplied to caller
    caller_reserve_data_to_take.supplied = caller_reserve_data_to_take.supplied + amount_to_take;
}

impl<T: Storage<LendingPoolStorage>> EmitLiquidateEvents for T {
    default fn _emit_liquidation_variable_event(
        &mut self,
        liquidator: AccountId,
        user: AccountId,
        asset_to_rapay: AccountId,
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    ) {
    }
    default fn _emit_liquidation_stable_event(
        &mut self,
        liquidator: AccountId,
        user: AccountId,
        asset_to_rapay: AccountId,
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    ) {
    }
}
