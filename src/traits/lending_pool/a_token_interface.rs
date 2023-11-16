pub type LendingPoolATokenInterfaceRef =
    contract_ref!(LendingPoolATokenInterface, DefaultEnvironment);

/// Trait containing messages that are accessible to **AToken** - the PSP22 wrapeer of deposits.
#[ink::trait_definition]
pub trait LendingPoolATokenInterface {
    /// Returns LendingPool's total deposit of an underlying asset.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up total deposit of.
    #[ink(message)]
    fn total_deposit_of(&self, underlying_asset: AccountId) -> Balance;

    /// Returns the specified `user`'s account Balance of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up deposit of.
    /// * `user` - AccountId (aka address) of an user to look up deposit of.
    #[ink(message)]
    fn user_deposit_of(
        &self,
        underlying_asset: AccountId,
        user: AccountId,
    ) -> Balance;

    /// Transfers an `amount` of `underlying_asset` deposit on the behalf of `from` to the account `to`
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to transfer tokens from/to.
    /// * `from` - AccountId (aka address) of an user to transfer from.
    /// * `to` - AccountId (aka address) of an user to transfer to.
    ///
    /// On success a number of PSP22's `Transfer` events are emitted.
    /// The number of events and their type/values depend on the interests that may be accrued both for `from` and `to` accounts.
    ///
    /// # Errors
    /// * `TransfersDisabled` returned if deposit for given `underlying_asset` is disabled.
    /// * `WrongCaller` returned if the caller is not an `underlying_asset`'s AToken contract.
    /// * `InsufficientBalance` returned if tdeposit of an `underlying_asset` of `from` is smaller than `amount`.
    #[ink(message)]
    fn transfer_deposit_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolError>;
}
