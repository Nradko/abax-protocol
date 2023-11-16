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
