pub type LendingPoolBorrowRef =
    contract_ref!(LendingPoolBorrow, DefaultEnvironment);

/// Trait containing messges that are used by **borrowers**.
#[ink::trait_definition]
pub trait LendingPoolBorrow {
    /// Callers choses a market rule caller want to use.
    ///
    /// * `market_rule_id` - the id of the market_rule to use.
    ///
    /// # Errors
    /// * `MarketRuleInvalidId` returned if the rule with `market_rule_id` doesn't exist.
    /// * `PriceFeedError` returned  if there is a problem with Price Oracle.
    /// * `InsufficientCollateral` returned if there is insufficient collateral after choosing rule with `market_rule_id` returned .
    #[ink(message)]
    fn choose_market_rule(
        &mut self,
        market_rule_id: RuleId,
    ) -> Result<(), LendingPoolError>;

    /// Caller chooses to `use_as_colalteral` an `asset`.
    /// i.e. if the callers's deposit of the `asset` should back caller's debt and be vulnerable to liquidation.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that should be allowed as collateral.
    /// * `use_as_collateral` - true if the user wants to use the asset as collateral, false in the opposite case.
    ///
    /// # Errors
    /// * `RuleCollateralDisable` returned if the `market_rule` chosen by caller doesn't support `asset` returned  as collateral.
    /// * `MinimalCollateralDeposit` returned if the caller's deposit of an `asset` is smaller than `minimal_collateral` returned .
    /// * `PriceFeedError` returned  if there is a problem with Price Oracle.
    /// * `InsufficientCollateral` returned if `use_as_collateral` ==false and insufficient collateralafter disabling `asset` returned  as a collateral.
    #[ink(message)]
    fn set_as_collateral(
        &mut self,
        asset: AccountId,
        use_as_collateral: bool,
    ) -> Result<(), LendingPoolError>;
    /// Caller takes `amount` of an `asset` as a debt that is accounted `on_bahalf_of`.
    /// Tokens are transferred to the `caller`.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that is borrowed.
    /// * `on_behalf_of` - AccountId (aka address) on behalf of who caller is taking debt. If `caller` != `on_behalf_of` then tje allowance of appropariate VToken will be decerased.
    /// * `amount` - the number of tokens to be borrowed in absolute value (1 USDT = 1_000_000, 1 AZERO = 1_000_000_000_000).
    /// * `data` - additional data that is unused.
    ///
    /// # Errors
    /// * `AmountNotGreaterThanZero` returned  if `amount` returned  == 0.
    /// * `AssetNotRegistered` returned if the `asset` is not registered in the `LendingPool` returned .
    /// * `Inactive` returned if the reserve coresponding to the `asset` returned  is inactive.
    /// * `Frozen` returned if the reserve coresponding to the `asset` returned  is frozen.
    /// * `MinimalDebt` returned if after taking the loan the debt of `on_bahalf_of` returned  is smaller than minimal_debt.
    /// * `MaxDebtReached` returned if after borrowig the total_debt is greated than maximal_total_debt.
    /// * `PriceFeedError` returned if there is a problem with Price Oracle.
    /// * `InsufficientCollateral` returned if `use_as_collateral` ==false and insufficient collateralafter disabling `asset` returned  as a collateral.
    /// * `PSP22Error` returned if transfer of `asset` fails (also in the case if the `caller` != `on_behalf_of` returned  and the caller has not enough allowance).
    #[ink(message)]
    fn borrow(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
    /// Caller repays `amount` of `asset` `on_behalf_of`'s debt. Tokens are transferred from the `caller`.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that is repayed.
    /// * `on_behalf_of` - AccountId (aka address) on behalf of who caller is repaying the debt.
    /// * `amount` - the number of tokens to be repaid. If it is greater then debt_amount only debt_amount will be repaid.
    /// * `data` - additional data currently unused.
    ///
    /// # Errors
    /// * `AmountNotGreaterThanZero` returned if `amount` returned  == 0.
    /// * `AssetNotRegistered` returned if the `asset` is not registered in the `LendingPool` returned .
    /// * `Inactive` returned if the reserve coresponding to the `asset` returned  is inactive.
    /// * `MinimalDebt` returned if after repaying the loan the debt of `on_bahalf_of` returned  is smaller than minimal_debt and != 0.
    /// * `PSP22Error` returned if transfer of `asset`  fails.
    #[ink(message)]
    fn repay(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError>;
}
