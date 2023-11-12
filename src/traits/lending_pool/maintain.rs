use ink::{contract_ref, env::DefaultEnvironment};
use pendzl::traits::AccountId;

use crate::traits::lending_pool::errors::LendingPoolError;

pub type LendingPoolMaintainRef =
    contract_ref!(LendingPoolMaintain, DefaultEnvironment);

/// contains `accumulate_interest`, `acumulate_user_interest`, `rebalance_stable_borrow_rate` functions
#[ink::trait_definition]
pub trait LendingPoolMaintain {
    /// is used by anyone to accumulate deposit and variable rate interests
    ///
    ///  * `asset` - AccountId (aka address) of asset of which interests should be accumulated
    #[ink(message)]
    fn accumulate_interest(
        &mut self,
        asset: AccountId,
    ) -> Result<(), LendingPoolError>;
}
