use crate::traits::lending_pool::{AssetRules, LendingPoolError};

impl AssetRules {
    pub fn verify_new_rule(
        &self,
        old_rule: &Option<AssetRules>,
    ) -> Result<(), LendingPoolError> {
        if let Some(old_rule_unwrapped) = old_rule {
            if old_rule_unwrapped.collateral_coefficient_e6.is_some()
                && self.collateral_coefficient_e6.is_none()
            {
                return Err(LendingPoolError::InvalidAssetRule);
            }
            if old_rule_unwrapped.borrow_coefficient_e6.is_some()
                && self.borrow_coefficient_e6.is_none()
            {
                return Err(LendingPoolError::InvalidAssetRule);
            }
        }
        if (self.collateral_coefficient_e6.is_some()
            || self.borrow_coefficient_e6.is_some())
            && !self.penalty_e6.is_some()
        {
            return Err(LendingPoolError::InvalidAssetRule);
        } else if self.collateral_coefficient_e6.is_none()
            && self.borrow_coefficient_e6.is_none()
            && self.penalty_e6.is_none()
        {
            return Err(LendingPoolError::InvalidAssetRule);
        }

        Ok(())
    }
}
