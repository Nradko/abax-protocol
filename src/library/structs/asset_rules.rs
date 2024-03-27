/// Defines rules on which asset can be borrowed and used as collateral.
#[derive(Debug, Default, scale::Encode, scale::Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct AssetRules {
    /// used while veryfing collateralization. If None then can not be used as collateral.
    pub collateral_coefficient_e6: Option<u128>,
    /// used while veryfing collateralization. If None then can not be borrowed.
    pub borrow_coefficient_e6: Option<u128>,
    /// penalty when liquidated, 1e6 == 100%.
    pub penalty_e6: Option<u128>,
}

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum AssetRulesError {
    /// returned if the asset_rule to be set is invalid.
    InvalidAssetRule,
}

impl AssetRules {
    /// verifies that:
    /// 1) the rule is not empty
    /// 2) that Some is not overriten by None
    /// 3) that penalty is Some
    ///
    /// * `old_rule` - rule that is overwritten by Self
    pub fn verify_new_rule(
        &self,
        old_rule: &Option<AssetRules>,
    ) -> Result<(), AssetRulesError> {
        if let Some(old_rule_unwrapped) = old_rule {
            if old_rule_unwrapped.collateral_coefficient_e6.is_some()
                && self.collateral_coefficient_e6.is_none()
            {
                return Err(AssetRulesError::InvalidAssetRule);
            }
            if old_rule_unwrapped.borrow_coefficient_e6.is_some()
                && self.borrow_coefficient_e6.is_none()
            {
                return Err(AssetRulesError::InvalidAssetRule);
            }
        }
        if ((self.collateral_coefficient_e6.is_some()
            || self.borrow_coefficient_e6.is_some())
            && self.penalty_e6.is_none())
            || (self.collateral_coefficient_e6.is_none()
                && self.borrow_coefficient_e6.is_none()
                && self.penalty_e6.is_none())
        {
            return Err(AssetRulesError::InvalidAssetRule);
        }

        Ok(())
    }
}
