pub type LendingPoolLiquidateRef =
    contract_ref!(LendingPoolLiquidate, DefaultEnvironment);
/// Trait containing liquidate message. Used by **liquidators**.
#[ink::trait_definition]
pub trait LendingPoolLiquidate {
    /// is used by a liquidator to liquidate the uncollateralized position of another user
    ///
    /// * `liquidated_account` - AccountId (aka address) whose position should be liquidated. liquidated_account must be undercollateralized.
    /// * `asset_to_repay` - AccountId (aka address) of PSP22 that liquidated_account has debt in.
    /// * `asset_to_take` - AccountId (aka address) of PSP22 that liquidated_account has supplied and is using as collateral. This asset will be a liquidator reward i.e. liquidator will receive aTokens corresponding to this asset.
    /// * `amount_to_repay` - the number of tokens to be repaid in absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000). The minimum of amount_to_repay and `liquidated_account` debt will be repaid.
    /// * `minimum_recieved_for_one_repaid_token_e12` - minimum amount of asset_to_take to be received by liquidator per 1 repaid token multiplied by 10^12. !Notice! In the case of AZERO 1 token is 10^-12 of AZERO and in the case of USDT 1 token is 10^-6 of USDT. The liquidator must be conscious and use absolute values.
    /// * `data` - additional data, currently unused.
    ///
    /// # Errors
    /// * `NoPriceFeed` returned if there is problem wirg oracle.
    /// * `Collaterized` returned if the `liaudiated_account` is collaterized.
    /// * `AssetNotRegistered` returned if the `asset_to_take` or `asset_to_repay` were not registered.
    /// * `NothingToRepay` returned if the `liquidated_account` has no `asset_to_repay` debt.
    /// * `NothingToCompensateWith` returned if the `liquidated_account` has no `asset_to_take` deposit.
    /// * `TakingNotACollateral` returned if the `asset_to_take` is not used as collateral by `liqudiated_account`.
    #[ink(message)]
    fn liquidate(
        &mut self,
        liquidated_account: AccountId,
        asset_to_repay: AccountId,
        asset_to_take: AccountId,
        amount_to_repay: Balance,
        minimum_recieved_for_one_repaid_token_e12: u128,
        data: Vec<u8>,
    ) -> Result<(Balance, Balance), LendingPoolError>;
}
