use checked_math::checked_math;
use openbrush::traits::{
    Balance,
    Timestamp,
};
use scale::{
    Decode,
    Encode,
};

use crate::impls::{
    constants::{
        E18,
        E24,
        MATH_ERROR_MESSAGE,
    },
    lending_pool::storage::structs::reserve_data::ReserveData,
};

/// stores all importand data corresponding to some asset for an user.
#[derive(Debug, Default, Encode, Decode, Clone, Copy)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
pub struct UserReserveData {
    /// underlying asset amount of supplied plus accumulated interest.
    pub supplied: Balance,
    /// underlying asset amount of borrowed (variable rate) plus accumulates interest.
    pub variable_borrowed: Balance,
    /// underlying asset amount of borrowed (stable rate) plus accumulates interest.
    pub stable_borrowed: Balance,
    /// applied cumulative rate index that is used to accumulate supply interest.
    pub applied_cumulative_supply_rate_index_e18: u128,
    /// applied cumulative rate index that is used to accumulate debt (variable) interest.
    pub applied_cumulative_variable_borrow_rate_index_e18: u128,
    /// user's stabe debt interest rate. 10^24 = 100%  Milisecond Percentage Rate.
    pub stable_borrow_rate_e24: u128,
    /// timestamp of UserReserveData update
    pub update_timestamp: Timestamp,
}

impl UserReserveData {
    // TODO:: make it easier to read!!!
    pub fn _accumulate_user_interest(&mut self, reserve: &mut ReserveData) -> (Balance, Balance, Balance) {
        if self.update_timestamp >= reserve.indexes_update_timestamp {
            ink::env::debug_println!("USER | UPDATE_TIMESTAMP GREATER THAN RESREVE's");
            return (0, 0, 0)
        }

        let (mut delta_user_supply, mut delta_user_varaible_borrow, mut delta_user_stable_borrow): (
            Balance,
            Balance,
            Balance,
        ) = (0, 0, 0);

        if self.supplied != 0
            && self.applied_cumulative_supply_rate_index_e18 != 0
            && self.applied_cumulative_supply_rate_index_e18 < reserve.cumulative_supply_rate_index_e18
        {
            let updated_supply = u128::try_from(
                checked_math!(
                    self.supplied * reserve.cumulative_supply_rate_index_e18
                        / self.applied_cumulative_supply_rate_index_e18
                )
                .unwrap(),
            )
            .expect(MATH_ERROR_MESSAGE);
            delta_user_supply = updated_supply - self.supplied;
            self.supplied = updated_supply;
        }
        self.applied_cumulative_supply_rate_index_e18 = reserve.cumulative_supply_rate_index_e18;

        if self.variable_borrowed != 0
            && self.applied_cumulative_variable_borrow_rate_index_e18 != 0
            && self.applied_cumulative_variable_borrow_rate_index_e18
                < reserve.cumulative_variable_borrow_rate_index_e18
        {
            let updated_borrow = {
                let updated_borrow_rounded_down = u128::try_from(
                    checked_math!(
                        self.variable_borrowed * reserve.cumulative_variable_borrow_rate_index_e18
                            / self.applied_cumulative_variable_borrow_rate_index_e18
                    )
                    .unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                updated_borrow_rounded_down.checked_add(1).expect(MATH_ERROR_MESSAGE)
            };
            delta_user_varaible_borrow = updated_borrow - self.variable_borrowed;
            self.variable_borrowed = updated_borrow;
        }
        self.applied_cumulative_variable_borrow_rate_index_e18 = reserve.cumulative_variable_borrow_rate_index_e18;

        if self.stable_borrowed != 0 {
            delta_user_stable_borrow = {
                let delta_user_stable_borrow_rounded_down = u128::try_from(
                    checked_math!(
                        self.stable_borrowed
                            * self.stable_borrow_rate_e24
                            * (reserve.indexes_update_timestamp - self.update_timestamp).into()
                            / E24
                    )
                    .unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                delta_user_stable_borrow_rounded_down
                    .checked_add(1)
                    .expect(MATH_ERROR_MESSAGE)
            };
            self.stable_borrowed = self
                .stable_borrowed
                .checked_add(delta_user_stable_borrow)
                .expect(MATH_ERROR_MESSAGE);
            reserve.avarage_stable_rate_e24 = u128::try_from(
                checked_math!(
                    (reserve.sum_stable_debt * reserve.avarage_stable_rate_e24
                        + delta_user_stable_borrow * self.stable_borrow_rate_e24)
                        / (reserve.sum_stable_debt + delta_user_stable_borrow)
                )
                .unwrap(),
            )
            .expect(MATH_ERROR_MESSAGE);
            reserve.sum_stable_debt = reserve
                .sum_stable_debt
                .checked_add(delta_user_stable_borrow)
                .expect(MATH_ERROR_MESSAGE);

            reserve.accumulated_stable_borrow = reserve
                .accumulated_stable_borrow
                .saturating_sub(delta_user_stable_borrow);
        }
        self.update_timestamp = reserve.indexes_update_timestamp;

        return (delta_user_supply, delta_user_varaible_borrow, delta_user_stable_borrow)
    }
}

impl UserReserveData {
    pub fn my_default() -> Self {
        Self {
            supplied: 0,
            variable_borrowed: 0,
            stable_borrowed: 0,
            applied_cumulative_supply_rate_index_e18: E18,
            applied_cumulative_variable_borrow_rate_index_e18: E18,
            stable_borrow_rate_e24: 0,
            update_timestamp: 0,
        }
    }
}

pub use super::tests::user_reserve_data_tests;
