use ink::{contract_ref, env::DefaultEnvironment, primitives::AccountId};
use pendzl::traits::Balance;

use crate::lending_pool::LendingPoolError;

pub type LendingPoolVTokenInterfaceRef =
    contract_ref!(LendingPoolVTokenInterface, DefaultEnvironment);

/// Trait containing messages that are accessible to **VToken** - the PSP22 Wrapper of debts.
#[ink::trait_definition]
pub trait LendingPoolVTokenInterface {
    /// Returns LendingPool's total debt of accounts in the context of an underlying asset.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up total  debt of.
    ///
    /// # Errors None
    #[ink(message)]
    fn total_debt_of(&self, underlying_asset: AccountId) -> Balance;
    /// Returns the specified `account`'s  debt in the context of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up account's  debt of.
    /// * `account` - AccountId (aka address) of an account to look up  debt for.
    ///
    /// # Errors None
    #[ink(message)]
    fn account_debt_of(
        &self,
        underlying_asset: AccountId,
        account: AccountId,
    ) -> Balance;
    /// Transfers an `amount` of  debt on the behalf of `from` to the account `to` in the context of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to transfer  debt from/to.
    /// * `from` - AccountId (aka address) of an account to transfer from.
    /// * `to` - AccountId (aka address) of an account to transfer to.
    ///
    /// On success a number of PSP22's `Transfer` events are emitted.
    /// The number of events and their type/values depend on the interests that may be accrued both for `from` and `to` accounts.
    ///
    /// # Errors
    /// * `TransfersDisabled` returned if deposit for given `underlying_asset` is disabled.
    /// * `WrongCaller` returned if the caller is not an `underlying_asset`'s VToken contract.
    /// * `InsufficientBalance` returned if there are not enough tokens on the the account Balance of `from`.
    #[ink(message)]
    fn transfer_debt_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolError>;
}
