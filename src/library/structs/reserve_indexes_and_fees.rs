/// Stores data used to accumulate deposit and debt interest rates.
#[derive(Debug, scale::Encode, scale::Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveIndexesAndFees {
    pub indexes: ReserveIndexes,
    /// fee is used to accumulate users debt interest. The real rate is the current_borrow_rate * (1+fee). 10^6 =100%
    pub fees: ReserveFees,
}

impl ReserveIndexesAndFees {
    pub fn new(timestamp: &Timestamp, fees: &ReserveFees) -> Self {
        ReserveIndexesAndFees {
            indexes: ReserveIndexes::new(timestamp),
            fees: *fees,
        }
    }
}

/// reserve fees
#[derive(Debug, Encode, Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveFees {
    /// fee is used to accumulate users debt interest. The real rate is the current_borrow_rate * (1+fee). 10^6 =100%
    pub debt_fee_e6: u32,
    /// fee is used to accumulate users deposit interest. The real rate is the current_deposit_rate * (1-fee). 10^6 =100%
    pub deposit_fee_e6: u32,
}

impl ReserveFees {
    pub fn new(&mut self, debt_fee_e6: u32, deposit_fee_e6: u32) -> Self {
        ReserveFees {
            debt_fee_e6,
            deposit_fee_e6,
        }
    }
}

/// Stores data used to accumulate deposit and debt interest rates.
#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveIndexes {
    /// index used to calculate deposit accumulated interest
    pub deposit_index_e18: u128,
    /// index used to calculate debt accumulated interest
    pub debt_index_e18: u128,
    /// timestamp of the last update of the rate indexes
    pub update_timestamp: Timestamp,
}

impl ReserveIndexes {
    pub fn new(timestamp: &Timestamp) -> Self {
        ReserveIndexes {
            deposit_index_e18: E18_U128,
            debt_index_e18: E18_U128,
            update_timestamp: *timestamp,
        }
    }

    pub fn update(
        &mut self,
        reserve_data: &ReserveData,
        timestamp: &Timestamp,
    ) -> Result<(), MathError> {
        let delta_timestamp = timestamp
            .checked_sub(self.update_timestamp)
            .ok_or(MathError::Underflow)?;
        if delta_timestamp == 0 {
            return Ok(());
        }
        let mut deposit_index_multiplier_e18: u128 = E18_U128;
        let mut debt_index_multiplier_e18: u128 = E18_U128;

        // total deposit can be 0 while rate isn't 0 for aabx stable token
        if reserve_data.current_deposit_rate_e18 != 0
            && reserve_data.total_deposit != 0
        {
            deposit_index_multiplier_e18 = deposit_index_multiplier_e18
                .checked_add(e18_mul_e0_to_e18_rdown(
                    reserve_data.current_deposit_rate_e18,
                    delta_timestamp,
                ))
                .ok_or(MathError::Overflow)?;

            self.deposit_index_e18 = e18_mul_e18_to_e18_rdown(
                self.deposit_index_e18,
                deposit_index_multiplier_e18,
            )?;
        }

        // total debt can be 0 while rate isn't 0 for aabx stable token
        if reserve_data.current_debt_rate_e18 != 0
            && reserve_data.total_debt != 0
        {
            debt_index_multiplier_e18 = debt_index_multiplier_e18
                .checked_add(e18_mul_e0_to_e18_rup(
                    reserve_data.current_debt_rate_e18,
                    delta_timestamp,
                )?)
                .ok_or(MathError::Overflow)?;
            self.debt_index_e18 = e18_mul_e18_to_e18_rup(
                self.debt_index_e18,
                debt_index_multiplier_e18,
            )?;
        }
        self.update_timestamp = *timestamp;
        Ok(())
    }
}
