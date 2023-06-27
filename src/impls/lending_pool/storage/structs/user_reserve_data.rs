use checked_math::checked_math;
use openbrush::traits::Balance;
use scale::{
    Decode,
    Encode,
};

use crate::impls::{
    constants::{
        E18,
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
    pub debt: Balance,
    /// applied cumulative rate index that is used to accumulate supply interest.
    pub applied_cumulative_supply_rate_index_e18: u128,
    /// applied cumulative rate index that is used to accumulate debt (variable) interest.
    pub applied_cumulative_debt_rate_index_e18: u128,
}

impl UserReserveData {
    pub fn _accumulate_user_interest(&mut self, reserve: &mut ReserveData) -> (Balance, Balance) {
        if self.applied_cumulative_supply_rate_index_e18 >= reserve.cumulative_supply_rate_index_e18
            && self.applied_cumulative_debt_rate_index_e18 >= reserve.cumulative_debt_rate_index_e18
        {
            return (0, 0)
        }

        let (mut delta_user_supply, mut delta_user_varaible_debt): (Balance, Balance) = (0, 0);

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

        if self.debt != 0
            && self.applied_cumulative_debt_rate_index_e18 != 0
            && self.applied_cumulative_debt_rate_index_e18 < reserve.cumulative_debt_rate_index_e18
        {
            let updated_borrow = {
                let updated_borrow_rounded_down = u128::try_from(
                    checked_math!(
                        self.debt * reserve.cumulative_debt_rate_index_e18
                            / self.applied_cumulative_debt_rate_index_e18
                    )
                    .unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                updated_borrow_rounded_down.checked_add(1).expect(MATH_ERROR_MESSAGE)
            };
            delta_user_varaible_debt = updated_borrow - self.debt;
            self.debt = updated_borrow;
        }
        self.applied_cumulative_debt_rate_index_e18 = reserve.cumulative_debt_rate_index_e18;

        return (delta_user_supply, delta_user_varaible_debt)
    }
}

impl UserReserveData {
    pub fn my_default() -> Self {
        Self {
            supplied: 0,
            debt: 0,
            applied_cumulative_supply_rate_index_e18: E18,
            applied_cumulative_debt_rate_index_e18: E18,
        }
    }
}

pub use super::tests::user_reserve_data_tests;
