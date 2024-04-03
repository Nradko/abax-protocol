use pendzl::{
    math::{errors::MathError, operations::mul_div},
    traits::Balance,
};

use crate::math::{
    e18_mul_e18_div_e18_to_e18_rdown,
    interest_rate_math::utilization_rate_to_interest_rate_e18, E6_U128, E6_U64,
};

/// Contains most often used data of a reserve
#[derive(Debug, scale::Encode, scale::Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveData {
    /// are any actions allowed?
    pub activated: bool,
    /// are borrows and deposits frozen?
    pub frozen: bool,

    /// total deposit of underlying asset. It is sum of deposits and  of accumulated interests. Total deposit of aToken.
    pub total_deposit: Balance,
    /// current interest rate for deposited tokens per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_deposit_rate_e18: u64,

    /// total debt. It is sum of debts with accumulated interests. Total supply of vToken.
    pub total_debt: Balance,
    // current interest rate for debt per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_debt_rate_e18: u64,
}

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum ReserveDataError {
    /// returned if activating, disactivating, freezing, unfreezing action is redundant.
    AlreadySet,
    /// returned if reserve is inactive
    Inactive,
    /// returned if reserve is frozen
    Frozen,
}

impl Default for ReserveData {
    fn default() -> Self {
        ReserveData {
            activated: true,
            frozen: false,
            total_deposit: 0,
            current_deposit_rate_e18: 0,
            total_debt: 0,
            current_debt_rate_e18: 0,
        }
    }
}

impl ReserveData {
    pub fn set_is_active(
        &mut self,
        active: bool,
    ) -> Result<(), ReserveDataError> {
        if self.activated == active {
            return Err(ReserveDataError::AlreadySet);
        }
        self.activated = active;
        Ok(())
    }

    pub fn ensure_activated(&self) -> Result<(), ReserveDataError> {
        if !self.activated {
            return Err(ReserveDataError::Inactive);
        }
        Ok(())
    }

    pub fn set_is_frozen(
        &mut self,
        freeze: bool,
    ) -> Result<(), ReserveDataError> {
        if self.frozen == freeze {
            return Err(ReserveDataError::AlreadySet);
        }
        self.activated = freeze;
        Ok(())
    }

    pub fn ensure_not_frozen(&self) -> Result<(), ReserveDataError> {
        if self.frozen {
            return Err(ReserveDataError::Frozen);
        }
        Ok(())
    }

    pub fn increase_total_deposit(
        &mut self,
        amount: &Balance,
    ) -> Result<(), MathError> {
        self.total_deposit = self
            .total_deposit
            .checked_add(*amount)
            .ok_or(MathError::Overflow)?;
        Ok(())
    }

    // total deposit can not underflow because it is a sum of account deposits which are already checked for underflow.
    pub fn decrease_total_deposit(
        &mut self,
        amount: &Balance,
    ) -> Result<(), MathError> {
        self.total_deposit = self
            .total_deposit
            .checked_sub(*amount)
            .ok_or(MathError::Underflow)?;
        Ok(())
    }

    pub fn increase_total_debt(
        &mut self,
        amount: &Balance,
    ) -> Result<(), MathError> {
        self.total_debt = self
            .total_debt
            .checked_add(*amount)
            .ok_or(MathError::Overflow)?;
        Ok(())
    }

    // total debt can not underflow because it is a sum of account debts which are already checked for underflow.
    pub fn decrease_total_debt(
        &mut self,
        amount: &Balance,
    ) -> Result<(), MathError> {
        self.total_debt = self
            .total_debt
            .checked_sub(*amount)
            .ok_or(MathError::Underflow)?;
        Ok(())
    }

    pub fn add_interests(
        &mut self,
        interests: (Balance, Balance),
    ) -> Result<(Balance, Balance), MathError> {
        self.increase_total_deposit(&interests.0)?;
        self.increase_total_debt(&interests.1)?;
        Ok(interests)
    }

    pub fn current_utilization_rate_e6(&self) -> Result<u64, MathError> {
        if self.total_deposit == 0 {
            return Ok(E6_U64);
        }
        let total_debt = self.total_debt;
        match u64::try_from(mul_div(
            total_debt,
            E6_U128,
            self.total_deposit,
            pendzl::math::operations::Rounding::Down,
        )?) {
            Ok(v) => Ok(v),
            _ => Err(MathError::Overflow),
        }
    }

    pub fn recalculate_current_rates(
        &mut self,
        interest_rate_model: &[u64; 7],
    ) -> Result<(), MathError> {
        if self.total_debt == 0 {
            self.current_debt_rate_e18 = 0;
            self.current_deposit_rate_e18 = 0;
            return Ok(());
        }
        let utilization_rate_e6 = self.current_utilization_rate_e6()?;
        self.current_debt_rate_e18 = utilization_rate_to_interest_rate_e18(
            utilization_rate_e6,
            interest_rate_model,
        )?;

        if self.total_deposit != 0 {
            self.current_deposit_rate_e18 = e18_mul_e18_div_e18_to_e18_rdown(
                self.total_debt,
                self.current_debt_rate_e18,
                self.total_deposit,
            )?;
        } else {
            self.current_deposit_rate_e18 = 0;
        }
        Ok(())
    }
}
