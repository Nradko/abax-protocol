/// Contains most often used data of a reserve
#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveData {
    /// are any actions allowed?
    pub activated: bool,
    /// are borrows and deposits frozen?
    pub freezed: bool,

    /// total deposit of underlying asset. It is sum of deposits and  of accumulated interests. Total deposit of aToken.
    pub total_deposit: Balance,
    /// current interest rate for deposited tokens per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_deposit_rate_e18: u64,

    /// total debt. It is sum of debts with accumulated interests. Total supply of vToken.
    pub total_debt: Balance,
    // current interest rate for debt per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_debt_rate_e18: u64,

    /// timestamp of the last update of the rate indexes
    pub indexes_update_timestamp: Timestamp,
}

#[derive(Debug, PartialEq, Eq, Encode, Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum ReserveDataError {
    /// returned if activating, disactivating, freezing, unfreezing action is redundant.
    AlreadySet,
    /// returned if reserve is inactive
    Inactive,
    /// returned if reserve is frozen
    Freezed,
    /// returned if after the action total debt of an asset is freater than the maximal total debt restriocion.
    MaxDebtReached,
    /// returned if after the action total deposit of an asset is grreater then the maximal total deposit restriction.
    MaxDepositReached,
}

impl ReserveData {
    pub fn new(timestamp: &Timestamp) -> Self {
        ReserveData {
            activated: true,
            freezed: false,
            total_deposit: 0,
            current_deposit_rate_e18: 0,
            total_debt: 0,
            current_debt_rate_e18: 0,
            indexes_update_timestamp: *timestamp,
        }
    }

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

    pub fn set_is_freezed(
        &mut self,
        freeze: bool,
    ) -> Result<(), ReserveDataError> {
        if self.freezed == freeze {
            return Err(ReserveDataError::AlreadySet);
        }
        self.activated = freeze;
        Ok(())
    }

    pub fn check_activeness(&self) -> Result<(), ReserveDataError> {
        if !self.activated {
            return Err(ReserveDataError::Inactive);
        }
        Ok(())
    }

    pub fn check_is_freezed(&self) -> Result<(), ReserveDataError> {
        if self.freezed {
            return Err(ReserveDataError::Freezed);
        }
        Ok(())
    }

    pub fn current_utilization_rate_e6(&self) -> Result<u64, MathError> {
        if self.total_deposit == 0 {
            return Ok(E6_U64);
        }
        let total_debt = self.total_debt;
        match u64::try_from({
            let x = U256::try_from(total_debt).unwrap();
            let y = U256::try_from(E6_U128).unwrap();
            let z = U256::try_from(self.total_deposit).unwrap();
            x.checked_mul(y).unwrap().checked_div(z).unwrap()
        }) {
            Ok(v) => Ok(v),
            _ => Err(MathError::Overflow),
        }
    }

    pub fn accumulate_interest(
        &mut self,
        reserve_indexes: &mut ReserveIndexes,
        new_timestamp: &Timestamp,
    ) -> Result<(), MathError> {
        // time that have passed in miliseconds
        let delta_timestamp: u64 =
            *new_timestamp - self.indexes_update_timestamp;
        // variable_borrow
        if delta_timestamp == 0 {
            return Ok(());
        }
        ink::env::debug_println!(" old_timestamp : {},\n new_timestamp: {} \n, delta_timestamp: {} \n \n, ",
            self.indexes_update_timestamp,
            new_timestamp,
            delta_timestamp
        );

        let mut deposit_index_multiplier_e18: u128 = E18_U128;
        let mut debt_index_multiplier_e18: u128 = E18_U128;

        // total_deposit != 0 must be checked because it may happen for stable assets that total_deposit == 0 and deposit_rate !=0
        if self.current_deposit_rate_e18 != 0 && self.total_deposit != 0 {
            deposit_index_multiplier_e18 = deposit_index_multiplier_e18
                .checked_add(e18_mul_e0_to_e18_rdown(
                    self.current_deposit_rate_e18,
                    delta_timestamp,
                ))
                .ok_or(MathError::Overflow)?;
            self.total_deposit = e18_mul_e0_to_e0_rdown(
                deposit_index_multiplier_e18,
                self.total_deposit,
            )?;
        }

        // total_debt != 0 must be checked because it may happen for stable assets that total_debt == 0 and debt_rate !=0
        if self.current_debt_rate_e18 != 0 && self.total_debt != 0 {
            debt_index_multiplier_e18 = debt_index_multiplier_e18
                .checked_add(e18_mul_e0_to_e18_rup(
                    self.current_debt_rate_e18,
                    delta_timestamp,
                )?)
                .ok_or(MathError::Overflow)?;
            ink::env::debug_println!(
                "current_debt_rate_e18: {}",
                self.current_debt_rate_e18
            );
            ink::env::debug_println!(
                "debt_index_multiplier: {}",
                debt_index_multiplier_e18
            );
            self.total_debt = e18_mul_e0_to_e0_rdown(
                debt_index_multiplier_e18,
                self.total_debt,
            )?;
        }
        self.indexes_update_timestamp = *new_timestamp;

        ink::env::debug_println!(
            "debt current rate: {},\ndebt index multiplier: {}, \n ",
            self.current_debt_rate_e18,
            debt_index_multiplier_e18
        );

        reserve_indexes
            .update(deposit_index_multiplier_e18, debt_index_multiplier_e18)?;
        Ok(())
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

    pub fn check_max_total_deposit(
        &self,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), ReserveDataError> {
        match reserve_restrictions.maximal_total_deposit {
            Some(max_total_deposit)
                if self.total_deposit > max_total_deposit =>
            {
                Err(ReserveDataError::MaxDepositReached)
            }
            _ => Ok(()),
        }
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

    pub fn decrease_total_debt(&mut self, amount: &Balance) {
        self.total_debt = self.total_debt.saturating_sub(*amount);
    }

    pub fn check_max_total_debt(
        &self,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), ReserveDataError> {
        match reserve_restrictions.maximal_total_debt {
            Some(max_total_debt) if self.total_debt > max_total_debt => {
                Err(ReserveDataError::MaxDebtReached)
            }
            _ => Ok(()),
        }
    }
}
