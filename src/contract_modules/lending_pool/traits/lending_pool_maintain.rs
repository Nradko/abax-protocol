use ink::{contract_ref, env::DefaultEnvironment, primitives::AccountId};

use crate::lending_pool::LendingPoolError;

pub type LendingPoolMaintainRef =
    contract_ref!(LendingPoolMaintain, DefaultEnvironment);

/// Trait containing messages that are used to maintain inetrest accumulation. Used by **maintainers**.
#[ink::trait_definition]
pub trait LendingPoolMaintain {
    /// is used by anyone to accumulate deposit and variable rate interests
    ///
    ///  * `asset` - AccountId (aka address) of asset of which interests should be accumulated
    ///
    /// # Errors None
    #[ink(message)]
    fn accumulate_interest(
        &mut self,
        asset: AccountId,
    ) -> Result<(), LendingPoolError>;
}
