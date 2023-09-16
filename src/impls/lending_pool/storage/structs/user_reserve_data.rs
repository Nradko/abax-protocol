use checked_math::checked_math;
use pendzl::traits::Balance;
use scale::{Decode, Encode};

use crate::{
    impls::{
        constants::{E18_U128, MATH_ERROR_MESSAGE},
        lending_pool::storage::{
            lending_pool_storage::AssetId,
            structs::reserve_data::ReserveIndexes,
        },
    },
    library::math::MathError,
    traits::lending_pool::errors::LendingPoolError,
};

/// stores all importand data corresponding to some asset for an user.
#[derive(Debug, Default, Encode, Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct UserReserveData {
    /// underlying asset amount of supplied plus accumulated interest.
    pub deposit: Balance,
    /// underlying asset amount of borrowed (variable rate) plus accumulates interest.
    pub debt: Balance,
    /// applied cumulative rate index that is used to accumulate supply interest.
    pub applied_cumulative_supply_index_e18: u128,
    /// applied cumulative rate index that is used to accumulate debt (variable) interest.
    pub applied_cumulative_debt_index_e18: u128,
}

impl UserReserveData {
    pub fn increase_user_deposit(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        amount: &u128,
    ) -> Result<(), MathError> {
        user_config.deposits |= 1_u128 << *asset_id;

        self.deposit = self
            .deposit
            .checked_add(*amount)
            .ok_or(MathError::Overflow)?;
        Ok(())
    }

    pub fn decrease_user_deposit(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        reserve_restrictions: &ReserveRestrictions,
        amount: &u128,
    ) -> Result<(), MathError> {
        if *amount == self.deposit {
            user_config.deposits &= !(1_u128 << asset_id);
        }
        self.deposit = self
            .deposit
            .checked_sub(*amount)
            .ok_or(MathError::Underflow)?;

        if self.deposit < reserve_restrictions.minimal_collateral {
            user_config.collaterals &= !(1_u128 << asset_id);
        }
        Ok(())
    }

    pub fn increase_user_debt(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        amount: &u128,
    ) -> Result<(), MathError> {
        user_config.borrows |= 1_u128 << *asset_id;

        self.debt =
            self.debt.checked_add(*amount).ok_or(MathError::Overflow)?;
        Ok(())
    }

    pub fn decrease_user_debt(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        amount: &u128,
    ) -> Result<(), MathError> {
        if *amount == self.debt {
            user_config.borrows &= !(1_u128 << asset_id);
        }
        self.debt =
            self.debt.checked_sub(*amount).ok_or(MathError::Underflow)?;
        Ok(())
    }

    pub fn check_debt_restrictions(
        &self,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), LendingPoolError> {
        if self.debt < reserve_restrictions.minimal_debt {
            return Err(LendingPoolError::MinimalDebt);
        }
        Ok(())
    }

    pub fn check_collateral_restrictions(
        &self,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), LendingPoolError> {
        if self.deposit < reserve_restrictions.minimal_collateral {
            return Err(LendingPoolError::MinimalCollateralDeposit);
        }
        Ok(())
    }

    pub fn accumulate_user_interest(
        &mut self,
        reserve_indexes: &ReserveIndexes,
    ) -> (Balance, Balance) {
        if self.applied_cumulative_supply_index_e18
            >= reserve_indexes.cumulative_supply_index_e18
            && self.applied_cumulative_debt_index_e18
                >= reserve_indexes.cumulative_debt_index_e18
        {
            return (0, 0);
        }

        let (mut delta_user_supply, mut delta_user_varaible_debt): (
            Balance,
            Balance,
        ) = (0, 0);

        if self.deposit != 0
            && self.applied_cumulative_supply_index_e18 != 0
            && self.applied_cumulative_supply_index_e18
                < reserve_indexes.cumulative_supply_index_e18
        {
            let updated_supply = u128::try_from(
                checked_math!(
                    self.deposit * reserve_indexes.cumulative_supply_index_e18
                        / self.applied_cumulative_supply_index_e18
                )
                .unwrap(),
            )
            .expect(MATH_ERROR_MESSAGE);
            delta_user_supply = updated_supply - self.deposit;
            self.deposit = updated_supply;
        }
        self.applied_cumulative_supply_index_e18 =
            reserve_indexes.cumulative_supply_index_e18;

        if self.debt != 0
            && self.applied_cumulative_debt_index_e18 != 0
            && self.applied_cumulative_debt_index_e18
                < reserve_indexes.cumulative_debt_index_e18
        {
            ink::env::debug_println!(
                "applied_cumulative_debt_index_e18 {}",
                self.applied_cumulative_debt_index_e18
            );
            ink::env::debug_println!(
                "cumulative_debt_index_e18 {}",
                reserve_indexes.cumulative_debt_index_e18
            );
            let updated_borrow = {
                let updated_borrow_rounded_down = u128::try_from(
                    checked_math!(
                        self.debt * reserve_indexes.cumulative_debt_index_e18
                            / self.applied_cumulative_debt_index_e18
                    )
                    .unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                updated_borrow_rounded_down
                    .checked_add(1)
                    .expect(MATH_ERROR_MESSAGE)
            };
            delta_user_varaible_debt = updated_borrow - self.debt;
            ink::env::debug_println!(
                "delta_user_varaible_debt {}",
                delta_user_varaible_debt
            );
            self.debt = updated_borrow;
        }
        self.applied_cumulative_debt_index_e18 =
            reserve_indexes.cumulative_debt_index_e18;
        ink::env::debug_println!("--- accumulate interest ---");
        return (delta_user_supply, delta_user_varaible_debt);
    }
}

impl UserReserveData {
    pub fn my_default() -> Self {
        Self {
            deposit: 0,
            debt: 0,
            applied_cumulative_supply_index_e18: E18_U128,
            applied_cumulative_debt_index_e18: E18_U128,
        }
    }
}
//TODO
// pub use super::tests::user_reserve_data_tests;
use super::{reserve_data::ReserveRestrictions, user_config::UserConfig};
