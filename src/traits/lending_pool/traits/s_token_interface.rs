use crate::traits::lending_pool::errors::LendingPoolTokenInterfaceError;
use openbrush::traits::{
    AccountId,
    Balance,
};

// use crate::traits::lending_pool::errors::LendingPoolError;

#[openbrush::wrapper]
pub type LendingPoolSTokenInterfaceRef = dyn LendingPoolSTokenInterface;

#[openbrush::trait_definition]
pub trait LendingPoolSTokenInterface {
    /// Returns LendingPool's total stable debt of users in the context of an underlying asset.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up total stable debt of.
    #[ink(message)]
    fn total_stable_debt_of(&self, underlying_asset: AccountId) -> Balance;
    /// Returns the specified `user`'s stable debt in the context of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up user's stable debt of.
    /// * `user` - AccountId (aka address) of an user to look up stable debt for.
    #[ink(message)]
    fn user_stable_debt_of(&self, underlying_asset: AccountId, user: AccountId) -> Balance;
    /// Transfers an `amount` of stable debt on the behalf of `from` to the account `to` in the context of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to transfer stable debt from/to.
    /// * `from` - AccountId (aka address) of an user to transfer from.
    /// * `to` - AccountId (aka address) of an user to transfer to.
    ///
    /// On success a number of PSP22's `Transfer` events are emitted.
    /// The number of events and their type/values depend on the interests that may be accrued both for `from` and `to` accounts.
    ///
    /// # Errors
    ///
    /// Returns `TransfersDisabled` error if deposit for given `underlying_asset` is disabled.
    ///
    /// Returns `WrongCaller` error if the caller is not an `underlying_asset`'s SToken contract.
    ///
    /// Returns `InsufficientBalance` error if there are not enough tokens on
    /// the the account Balance of `from`.
    #[ink(message)]
    fn transfer_stable_debt_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError>;
}
