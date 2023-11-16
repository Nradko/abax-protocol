pub type LendingPoolLiquidateRef =
    contract_ref!(LendingPoolLiquidate, DefaultEnvironment);
/// Trait containing liquidate message. Used by **liquidators**.
#[ink::trait_definition]
pub trait LendingPoolLiquidate {
    /// is used by a liquidator to liquidate the uncollateralized position of another user
    ///
    /// * `liquidated_user` - AccountId (aka address) of a user whose position should be liquidated. liquidated_user must be undercollateralized
    /// * `asset_to_repay` - AccountId (aka address) of PSP22 that liquidated_user has debt in.
    /// * `asset_to_take` - AccountId (aka address) of PSP22 that liquidated_user has supplied and is using as collateral.
    ///     This asset will be a liquidator reward i.e. it will be transferred to his Account.
    /// * `amount_to_repay` - the number of tokens to be repaid. Pass None to repay all debt or Some in absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000).
    /// * `minimum_recieved_for_one_repaid_token_e12` - minimum amount of asset_to_take to be received by liquidator per 1 repaid token multiplied by 10^12.
    ///     Notice!!! In the case of AZERO 1 token is 10^-12 of AZERO and in the case of USDT 1 token is 10^-6 of AZERO. The liquidator must be conscious and use absolute values.
    /// * `data` - additional data currently unused.
    #[ink(message)]
    fn liquidate(
        &mut self,
        liquidated_user: AccountId,
        asset_to_repay: AccountId,
        asset_to_take: AccountId,
        amount_to_repay: Balance,
        minimum_recieved_for_one_repaid_token_e12: u128,
        data: Vec<u8>,
    ) -> Result<(Balance, Balance), LendingPoolError>;
}
