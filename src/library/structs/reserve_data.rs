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
    pub current_deposit_rate_e24: u128,

    /// total debt. It is sum of debts with accumulated interests. Total supply of vToken.
    pub total_debt: Balance,
    // current interest rate for debt per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_debt_rate_e24: u128,

    /// timestamp of the last update of the rate indexes
    pub indexes_update_timestamp: Timestamp,
}

#[derive(Debug, PartialEq, Eq, Encode, Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum ReserveDataError {
    AlreadySet,
    Inactive,
    Freezed,
    MaxDebtReached,
    MaxDepositReached,
}

impl ReserveData {
    pub fn new(timestamp: &Timestamp) -> Self {
        ReserveData {
            activated: true,
            freezed: false,
            total_deposit: 0,
            current_deposit_rate_e24: 0,
            total_debt: 0,
            current_debt_rate_e24: 0,
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

    pub fn utilization_rate_to_interest_rate_e24(
        &self,
        utilization_rate_e6: u128,
        reserve_parameters: &ReserveParameters,
    ) -> u128 {
        let [t68, t84, t92, t96, t98, t99, t100]: [u128; 7] =
            reserve_parameters.interest_rate_model;
        match utilization_rate_e6 {
            0 => 0,
            1..=680_000 => t68 * utilization_rate_e6 / 680_000 + 1,
            680_001..=840_000 => {
                t68 + (t84 - t68) * (utilization_rate_e6 - 680_000) / 160_000
                    + 1
            }
            840_001..=920_000 => {
                t84 + (t92 - t84) * (utilization_rate_e6 - 840_000) / 80_000 + 1
            }
            920_001..=960_000 => {
                t92 + (t96 - t92) * (utilization_rate_e6 - 920_000) / 40_000 + 1
            }
            960_001..=980_000 => {
                t96 + (t98 - t96) * (utilization_rate_e6 - 960_000) / 20_000 + 1
            }
            980_001..=990_000 => {
                t98 + (t99 - t98) * (utilization_rate_e6 - 980_000) / 10_000 + 1
            }
            990_001..=1_000_000 => {
                t99 + (t100 - t99) * (utilization_rate_e6 - 990_000) / 10_000
                    + 1
            }
            _ => t100 * utilization_rate_e6 / E6_U128 + 1,
        }
    }
    //// VIEW
    pub fn current_utilization_rate_e6(&self) -> Result<u128, MathError> {
        if self.total_deposit == 0 {
            return Ok(E6_U128);
        }
        let total_debt = self.total_debt;
        match u128::try_from({
            let x = U256::try_from(total_debt).unwrap();
            let y = U256::try_from(E6_U128).unwrap();
            let z = U256::try_from(self.total_deposit).unwrap();
            x.checked_mul(y).unwrap().checked_div(z).unwrap()
        }) {
            Ok(v) => Ok(v),
            _ => Err(MathError::Overflow),
        }
    }

    //// MUT
    pub fn accumulate_interest(
        &mut self,
        reserve_indexes: &mut ReserveIndexes,
        new_timestamp: &Timestamp,
    ) -> Result<(), MathError> {
        // time that have passed in miliseconds
        let delta_timestamp: u128 =
            (*new_timestamp - self.indexes_update_timestamp) as u128;
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
        if self.current_deposit_rate_e24 != 0 && self.total_deposit != 0 {
            deposit_index_multiplier_e18 = deposit_index_multiplier_e18
                .checked_add(e24_mul_e0_to_e18_rdown(
                    self.current_deposit_rate_e24,
                    delta_timestamp,
                )?)
                .ok_or(MathError::Overflow)?;
            self.total_deposit = e18_mul_e0_to_e0_rdown(
                deposit_index_multiplier_e18,
                self.total_deposit,
            )?;
        }

        // total_debt != 0 must be checked because it may happen for stable assets that total_debt == 0 and debt_rate !=0
        if self.current_debt_rate_e24 != 0 && self.total_debt != 0 {
            debt_index_multiplier_e18 = debt_index_multiplier_e18
                .checked_add(e24_mul_e0_to_e18_rup(
                    self.current_debt_rate_e24,
                    delta_timestamp,
                )?)
                .ok_or(MathError::Overflow)?;
            self.total_debt = e18_mul_e0_to_e0_rdown(
                debt_index_multiplier_e18,
                self.total_debt,
            )?;
        }
        self.indexes_update_timestamp = *new_timestamp;

        ink::env::debug_println!(
            "debt current rate: {},\ndebt index multiplier: {}, \n ",
            self.current_debt_rate_e24,
            debt_index_multiplier_e18
        );

        reserve_indexes.update_indexes(
            deposit_index_multiplier_e18,
            debt_index_multiplier_e18,
        )?;
        Ok(())
    }

    pub fn recalculate_current_rates(
        &mut self,
        reserve_parameters: &ReserveParameters,
    ) -> Result<(), MathError> {
        if self.total_debt == 0 {
            self.current_debt_rate_e24 = 0;
            self.current_deposit_rate_e24 = 0;
            return Ok(());
        }
        let utilization_rate_e6 = self.current_utilization_rate_e6()?;
        self.current_debt_rate_e24 = self
            .utilization_rate_to_interest_rate_e24(
                utilization_rate_e6,
                reserve_parameters,
            );

        if self.total_deposit != 0 {
            let current_income_per_milisecond_e24: U256 = {
                let x = U256::try_from(self.total_debt).unwrap();
                let y = U256::try_from(self.current_debt_rate_e24).unwrap();
                x.checked_mul(y).unwrap()
            };
            self.current_deposit_rate_e24 = e24_mul_e6_div_e0_to_e24_rdown(
                current_income_per_milisecond_e24,
                reserve_parameters.income_for_suppliers_part_e6,
                self.total_deposit,
            )?;
        } else {
            self.current_deposit_rate_e24 = 0;
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
//TODO
// pub use super::tests::reserve_data_tests;
