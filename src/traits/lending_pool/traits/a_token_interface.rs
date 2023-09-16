use crate::traits::lending_pool::errors::LendingPoolTokenInterfaceError;
use ink::{contract_ref, env::DefaultEnvironment};
use pendzl::traits::{AccountId, Balance};

// #[pendzl::wrapper]
// pub type LendingPoolATokenInterfaceRef = dyn LendingPoolATokenInterface;

pub type LendingPoolATokenInterfaceRef =
    contract_ref!(LendingPoolATokenInterface, DefaultEnvironment);

#[ink::trait_definition]
pub trait LendingPoolATokenInterface {
    /// Returns LendingPool's total supply of an underlying asset.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up total supply of.
    #[ink(message)]
    fn total_supply_of(&self, underlying_asset: AccountId) -> Balance;

    /// Returns the specified `user`'s account Balance of an `underlying_asset`.
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to look up supply of.
    /// * `user` - AccountId (aka address) of an user to look up supply of.
    #[ink(message)]
    fn user_supply_of(
        &self,
        underlying_asset: AccountId,
        user: AccountId,
    ) -> Balance;

    /// Transfers an `amount` of `underlying_asset` supply on the behalf of `from` to the account `to`
    ///
    /// * `underlying_asset` - AccountId (aka address) of an asset to transfer tokens from/to.
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
    /// Returns `WrongCaller` error if the caller is not an `underlying_asset`'s AToken contract.
    ///
    /// Returns `InsufficientBalance` error if there are not enough tokens on
    /// the the account Balance of `from`.
    #[ink(message)]
    fn transfer_supply_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError>;
}
