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

    /// is used by anyone to adjust rate model
    ///
    /// * `asset` - AccountId (aka address) of asset of which rate should be adjusted
    /// * `apropariate_index` - u32 of apropariate index in the accumulated time-weighted utilization rate storage
    ///
    /// # Errors
    /// * `LendingPoolError::InvalidIndex` returned if the index is invalid  
    #[ink(message)]
    fn adjust_rate_at_target(
        &mut self,
        asset: AccountId,
        apropariate_index: u32,
    ) -> Result<u64, LendingPoolError>;
}
