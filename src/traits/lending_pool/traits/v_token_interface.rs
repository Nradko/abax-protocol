use crate::traits::lending_pool::errors::LendingPoolTokenInterfaceError;
use ink::{contract_ref, env::DefaultEnvironment};
use pendzl::traits::{AccountId, Balance};

pub type LendingPoolVTokenInterfaceRef =
    contract_ref!(LendingPoolVTokenInterface, DefaultEnvironment);

#[ink::trait_definition]
pub trait LendingPoolVTokenInterface {
    /// Returns LendingPool's total variable debt of users in the context of an underlying asset.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up total variable debt of.
    #[ink(message)]
    fn total_variable_debt_of(&self, underlying_asset: AccountId) -> Balance;
    /// Returns the specified `user`'s variable debt in the context of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up user's variable debt of.
    /// * `user` - AccountId (aka address) of an user to look up variable debt for.
    #[ink(message)]
    fn user_variable_debt_of(
        &self,
        underlying_asset: AccountId,
        user: AccountId,
    ) -> Balance;
    /// Transfers an `amount` of variable debt on the behalf of `from` to the account `to` in the context of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to transfer variable debt from/to.
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
    /// Returns `WrongCaller` error if the caller is not an `underlying_asset`'s VToken contract.
    ///
    /// Returns `InsufficientBalance` error if there are not enough tokens on
    /// the the account Balance of `from`.
    #[ink(message)]
    fn transfer_variable_debt_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError>;
}
