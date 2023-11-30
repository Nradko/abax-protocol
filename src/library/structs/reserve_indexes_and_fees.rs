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
}

impl Default for ReserveIndexes {
    fn default() -> Self {
        ReserveIndexes {
            deposit_index_e18: E18_U128,
            debt_index_e18: E18_U128,
        }
    }
}

impl ReserveIndexes {
    pub fn update(
        &mut self,
        deposit_index_multiplier_e18: u128,
        debt_index_multiplier_e18: u128,
    ) -> Result<(), MathError> {
        self.deposit_index_e18 = e18_mul_e18_to_e18_rdown(
            self.deposit_index_e18,
            deposit_index_multiplier_e18,
        )?;

        self.debt_index_e18 = e18_mul_e18_to_e18_rup(
            self.debt_index_e18,
            debt_index_multiplier_e18,
        )?;

        Ok(())
    }
}
