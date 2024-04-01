use pendzl::{math::errors::MathError, traits::Balance};

use crate::math::{
    e0_mul_e18_div_e18_to_e0_rdown, e0_mul_e18_div_e18_to_e0_rup,
    e0_mul_e6_to_e0_rup, E18_U128, E6_U32,
};

use super::{
    FeeReductions, ReserveData, ReserveFees, ReserveIndexes,
    ReserveRestrictions, UserConfig,
};

/// stores data of user
#[derive(Debug, Default, scale::Encode, scale::Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct UserReserveData {
    /// underlying asset amount of deposit plus accumulated interest.
    pub deposit: Balance,
    /// underlying asset amount of debt plus accumulated interest.
    pub debt: Balance,
    /// index that is used to accumulate deposit interest.
    pub applied_deposit_index_e18: u128,
    /// index that is used to accumulate debt interest.
    pub applied_debt_index_e18: u128,
}

/// type used to identify asset
pub type AssetId = u32;

impl UserReserveData {
    pub fn increase_user_deposit(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        reserve_data: &mut ReserveData,
        amount: &u128,
    ) -> Result<(), MathError> {
        user_config.deposits |= 1_u128 << *asset_id;

        self.deposit = self
            .deposit
            .checked_add(*amount)
            .ok_or(MathError::Overflow)?;

        reserve_data.increase_total_deposit(amount)?;

        Ok(())
    }

    pub fn decrease_user_deposit(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        reserve_data: &mut ReserveData,
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

        reserve_data.decrease_total_deposit(amount)?;

        if self.deposit < reserve_restrictions.minimal_collateral {
            user_config.collaterals &= !(1_u128 << asset_id);
        }
        Ok(())
    }

    pub fn increase_user_debt(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        reserve_data: &mut ReserveData,
        amount: &u128,
    ) -> Result<(), MathError> {
        user_config.borrows |= 1_u128 << *asset_id;

        self.debt =
            self.debt.checked_add(*amount).ok_or(MathError::Overflow)?;

        reserve_data.increase_total_debt(amount)?;

        Ok(())
    }

    pub fn decrease_user_debt(
        &mut self,
        asset_id: &AssetId,
        user_config: &mut UserConfig,
        reserve_data: &mut ReserveData,
        amount: &u128,
    ) -> Result<(), MathError> {
        if *amount == self.debt {
            user_config.borrows &= !(1_u128 << asset_id);
        }
        self.debt =
            self.debt.checked_sub(*amount).ok_or(MathError::Underflow)?;

        reserve_data.decrease_total_debt(amount)?;

        Ok(())
    }

    /// based on the `reserve_indexes_and_fees` and Self.applied_cumulative_**_index_e18 accumulates interest
    ///
    /// # Returns
    /// (accumulated_deposit_interest, accumulated_debt_interest)
    pub fn accumulate_user_interest(
        &mut self,
        reserve_indexes: &ReserveIndexes,
        reserve_fees: &ReserveFees,
        (deposit_fee_reduction_e6, debt_fee_reduction_e6): &FeeReductions,
    ) -> Result<(Balance, Balance), MathError> {
        if self.applied_deposit_index_e18 >= reserve_indexes.deposit_index_e18
            && self.applied_debt_index_e18 >= reserve_indexes.debt_index_e18
        {
            return Ok((0, 0));
        }

        let (mut delta_user_deposit, mut delta_user_debt): (Balance, Balance) =
            (0, 0);

        if self.deposit != 0
            && self.applied_deposit_index_e18 != 0
            && self.applied_deposit_index_e18
                < reserve_indexes.deposit_index_e18
        {
            let updated_deposit_with_fee = e0_mul_e18_div_e18_to_e0_rdown(
                self.deposit,
                reserve_indexes.deposit_index_e18,
                self.applied_deposit_index_e18,
            )?;

            let interest_with_fee = updated_deposit_with_fee
                .checked_sub(self.deposit)
                .ok_or(MathError::Underflow)?;

            let pre_fee = e0_mul_e6_to_e0_rup(
                interest_with_fee,
                reserve_fees.deposit_fee_e6,
            )?;
            let fee_part_e6 =
                E6_U32.checked_sub(*deposit_fee_reduction_e6).unwrap();

            let fee = e0_mul_e6_to_e0_rup(pre_fee, fee_part_e6)?;

            let updated_deposit = updated_deposit_with_fee
                .checked_sub(fee)
                .ok_or(MathError::Underflow)?;

            delta_user_deposit = updated_deposit
                .checked_sub(self.deposit)
                .ok_or(MathError::Underflow)?;
            self.deposit = updated_deposit;
        }
        self.applied_deposit_index_e18 = reserve_indexes.deposit_index_e18;

        if self.debt != 0
            && self.applied_debt_index_e18 != 0
            && self.applied_debt_index_e18 < reserve_indexes.debt_index_e18
        {
            let updated_borrow_with_no_fee = e0_mul_e18_div_e18_to_e0_rup(
                self.debt,
                reserve_indexes.debt_index_e18,
                self.applied_debt_index_e18,
            )?;

            let interest_with_no_fee = updated_borrow_with_no_fee
                .checked_sub(self.debt)
                .ok_or(MathError::Underflow)?;

            let pre_fee = e0_mul_e6_to_e0_rup(
                interest_with_no_fee,
                reserve_fees.debt_fee_e6,
            )?;

            let fee_part_e6 =
                E6_U32.checked_sub(*debt_fee_reduction_e6).unwrap();

            let fee = e0_mul_e6_to_e0_rup(pre_fee, fee_part_e6)?;

            let updated_borrow = updated_borrow_with_no_fee
                .checked_add(fee)
                .ok_or(MathError::Overflow)?;

            delta_user_debt = updated_borrow
                .checked_sub(self.debt)
                .ok_or(MathError::Underflow)?;
            self.debt = updated_borrow;
        }
        self.applied_debt_index_e18 = reserve_indexes.debt_index_e18;

        Ok((delta_user_deposit, delta_user_debt))
    }
}

impl UserReserveData {
    pub fn my_default() -> Self {
        Self {
            deposit: 0,
            debt: 0,
            applied_deposit_index_e18: E18_U128,
            applied_debt_index_e18: E18_U128,
        }
    }
}
