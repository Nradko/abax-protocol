use crate::{
    impls::constants::E18_U128,
    library::math::{
        e18_mul_e18_to_e18_rdown, e18_mul_e18_to_e18_rup, MathError,
    },
    traits::lending_pool::ReserveIndexes,
};

#[allow(clippy::new_without_default)]
impl ReserveIndexes {
    pub fn new() -> Self {
        ReserveIndexes {
            cumulative_deposit_index_e18: E18_U128,
            cumulative_debt_index_e18: E18_U128,
        }
    }

    pub fn update_indexes(
        &mut self,
        deposit_index_multiplier_e18: u128,
        debt_index_multiplier_e18: u128,
    ) -> Result<(), MathError> {
        self.cumulative_deposit_index_e18 = e18_mul_e18_to_e18_rdown(
            self.cumulative_deposit_index_e18,
            deposit_index_multiplier_e18,
        )?;

        self.cumulative_debt_index_e18 = e18_mul_e18_to_e18_rup(
            self.cumulative_debt_index_e18,
            debt_index_multiplier_e18,
        )?;

        Ok(())
    }
}
