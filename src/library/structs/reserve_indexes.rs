/// Stores data used to accumulate deposit and debt interest rates.
#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveIndexes {
    /// index used to calculate deposit accumulated interest
    pub deposit_index_e18: u128,
    // index used to calculate debt accumulated interest
    pub debt_index_e18: u128,
}
#[allow(clippy::new_without_default)]
impl ReserveIndexes {
    pub fn new() -> Self {
        ReserveIndexes {
            deposit_index_e18: E18_U128,
            debt_index_e18: E18_U128,
        }
    }

    pub fn update_indexes(
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
