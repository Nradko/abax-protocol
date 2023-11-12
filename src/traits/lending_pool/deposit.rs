use pendzl::traits::{AccountId, Balance};

use crate::traits::lending_pool::errors::LendingPoolError;
use ink::{contract_ref, env::DefaultEnvironment, prelude::vec::Vec};

pub type LendingPoolDepositRef =
    contract_ref!(LendingPoolDeposit, DefaultEnvironment);

/// contains `deposit` and `redeem` functions
#[ink::trait_definition]
pub trait LendingPoolDeposit {
    /// is used by a user0, to deposit on an account of on_behalf_of an asset to LendingPool.
    /// Then, within the possibilities, a deposit can be marked as collateral and used to back a loan.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user0 is making a deposit.
    /// * `amount` - the number of tokens to be deposited in an absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000).
    /// * `data` - additional data currently unused.
    #[ink(message)]
    fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
    /// is used by a user0, to redeem on an account of on_behalf_of an asset to LendingPool.
    /// Redeem can fail if the user has current debt and redeeming would make the user's position undercollateralized.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user0 is making redeem. If user0 != user1 then the allowance of on appropriate AToken will be decreased.
    /// * `amount` - the number of tokens to be redeemed. if greater then deposit_amount then only deposit_amopunt will be withdrawn.
    /// * `data` - additional data currently unused.
    #[ink(message)]
    fn redeem(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError>;
}
