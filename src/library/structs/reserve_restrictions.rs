/// Stores restrictions made on the reserve
#[derive(Debug, Encode, Decode, Default)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveRestrictions {
    /// maximal allowed total deposit
    pub maximal_total_deposit: Option<Balance>,
    /// maximal allowad total debt
    pub maximal_total_debt: Option<Balance>,
    /// minimal collateral that can be used by each user.
    /// if user's collateral drops below this value (during redeem) then it will be automatically turned off (as collateral).
    /// it may happen during liquidation that users collateral will drop below this value.
    pub minimal_collateral: Balance,
    /// minimal debt that can be taken and maintained by each user.
    /// At any time user's debt can not bee smaller than minimal debt.
    pub minimal_debt: Balance,
}

impl ReserveRestrictions {
    pub fn new(
        maximal_total_deposit: &Option<Balance>,
        maximal_total_debt: &Option<Balance>,
        minimal_collateral: &Balance,
        minimal_debt: &Balance,
    ) -> Self {
        ReserveRestrictions {
            maximal_total_deposit: *maximal_total_deposit,
            maximal_total_debt: *maximal_total_debt,
            minimal_collateral: *minimal_collateral,
            minimal_debt: *minimal_debt,
        }
    }
}

#[derive(Debug, PartialEq, Eq, Encode, Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum ReserveRestrictionsError {
    /// returned if after the action total debt of an asset is freater than the maximal total debt restriocion.
    MaxDebtReached,
    /// returned if after the action total deposit of an asset is grreater then the maximal total deposit restriction.
    MaxDepositReached,
    /// returned if after the action minimal debt restricion would be no satisfied.
    MinimalDebt,
    /// returned if after the action minimal collaetral restricion would be no satisfied.
    MinimalCollateral,
}

impl ReserveRestrictions {
    pub fn check_max_total_deposit(
        &self,
        reserve_data: &ReserveData,
    ) -> Result<(), ReserveRestrictionsError> {
        match self.maximal_total_deposit {
            Some(max_total_deposit)
                if reserve_data.total_deposit > max_total_deposit =>
            {
                Err(ReserveRestrictionsError::MaxDepositReached)
            }
            _ => Ok(()),
        }
    }

    pub fn check_max_total_debt(
        &self,
        reserve_data: &ReserveData,
    ) -> Result<(), ReserveRestrictionsError> {
        match self.maximal_total_debt {
            Some(max_total_debt)
                if reserve_data.total_debt > max_total_debt =>
            {
                Err(ReserveRestrictionsError::MaxDebtReached)
            }
            _ => Ok(()),
        }
    }

    pub fn check_debt_restrictions(
        &self,
        user_reserve_data: &UserReserveData,
    ) -> Result<(), ReserveRestrictionsError> {
        if user_reserve_data.debt != 0
            && user_reserve_data.debt < self.minimal_debt
        {
            return Err(ReserveRestrictionsError::MinimalDebt);
        }
        Ok(())
    }

    pub fn check_collateral_restrictions(
        &self,
        user_reserve_data: &UserReserveData,
    ) -> Result<(), ReserveRestrictionsError> {
        if user_reserve_data.deposit < self.minimal_collateral {
            return Err(ReserveRestrictionsError::MinimalCollateral);
        }
        Ok(())
    }
}
