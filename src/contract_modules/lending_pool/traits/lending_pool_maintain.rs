// SPDX-License-Identifier: BUSL-1.1
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

    /// is used by anyone to adjust interest's rate at the target utilization rate
    ///
    /// * `asset` - AccountId (aka address) of asset of which rate should be adjusted
    /// * `guessed_index` - u32 of an index in the accumulated time-weighted utilization rate storage
    /// that is guessed to be the one that should be used to adjust the rate (or is the closest one to the one supposed to be used)
    ///  It must be index of entry that timestamp is at least smaller by interest_rate_model.minimal_time_between_adjustments from the last entry.
    ///
    /// # Errors
    /// * `LendingPoolError::TwEntryInvalidIndex` returned if the index is invalid - points to a non existing entry or the entry's value is too recent.
    /// * `LendingPoolError::TooEarlyToAdjustRate` returned if the attempt to adjust the rate is made earlier then the minimal time between adjustments.
    #[ink(message)]
    fn adjust_rate_at_target(
        &mut self,
        asset: AccountId,
        guessed_index: u32,
    ) -> Result<u64, LendingPoolError>;
}
