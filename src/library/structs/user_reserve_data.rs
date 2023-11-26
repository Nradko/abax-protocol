/// stores data of user
#[derive(Debug, Default, Encode, Decode, Clone, Copy)]
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

#[derive(Debug, PartialEq, Eq, Encode, Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum UserReserveDataError {
    /// returned if after the action minimal debt restricion would be no satisfied.
    MinimalDebt,
    /// returned if after the action minimal collaetral restricion would be no satisfied.
    MinimalCollateral,
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
    ) -> Result<bool, MathError> {
        if *amount == self.deposit {
            user_config.deposits &= !(1_u128 << asset_id);
        }
        self.deposit = self
            .deposit
            .checked_sub(*amount)
            .ok_or(MathError::Underflow)?;
        let is_asset_a_collateral =
            (user_config.collaterals & (1_u128 << asset_id)) > 0;

        if self.deposit < reserve_restrictions.minimal_collateral {
            user_config.collaterals &= !(1_u128 << asset_id);
        }
        Ok(is_asset_a_collateral)
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
    ) -> Result<(), UserReserveDataError> {
        if self.debt != 0 && self.debt < reserve_restrictions.minimal_debt {
            return Err(UserReserveDataError::MinimalDebt);
        }
        Ok(())
    }

    pub fn check_collateral_restrictions(
        &self,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), UserReserveDataError> {
        if self.deposit < reserve_restrictions.minimal_collateral {
            return Err(UserReserveDataError::MinimalCollateral);
        }
        Ok(())
    }

    /// based on the `reserve_indexes` and Self.applied_cumulative_**_index_e18 accumulates interest
    ///
    /// # Returns
    /// (accumulated_deposit_interest, accumulated_debt_interest)
    pub fn accumulate_user_interest(
        &mut self,
        reserve_indexes: &ReserveIndexes,
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
            let updated_deposit = match u128::try_from({
                let x = U256::try_from(self.deposit).unwrap();
                let y =
                    U256::try_from(reserve_indexes.deposit_index_e18).unwrap();
                let z = U256::try_from(self.applied_deposit_index_e18).unwrap();

                x.checked_mul(y).unwrap().checked_div(z).unwrap()
            }) {
                Ok(v) => Ok(v),
                _ => Err(MathError::Overflow),
            }?;
            delta_user_deposit = updated_deposit - self.deposit;
            self.deposit = updated_deposit;
        }
        self.applied_deposit_index_e18 = reserve_indexes.deposit_index_e18;

        if self.debt != 0
            && self.applied_debt_index_e18 != 0
            && self.applied_debt_index_e18 < reserve_indexes.debt_index_e18
        {
            let updated_borrow = {
                let updated_borrow_rounded_down = match u128::try_from({
                    let x = U256::try_from(self.debt).unwrap();
                    let y =
                        U256::try_from(reserve_indexes.debt_index_e18).unwrap();
                    let z =
                        U256::try_from(self.applied_debt_index_e18).unwrap();

                    x.checked_mul(y).unwrap().checked_div(z).unwrap()
                }) {
                    Ok(v) => Ok(v),
                    _ => Err(MathError::Overflow),
                }?;
                updated_borrow_rounded_down
                    .checked_add(1)
                    .ok_or(MathError::Overflow)?
            };
            delta_user_debt = updated_borrow - self.debt;
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
