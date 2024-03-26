use abax_traits::lending_pool::{InterestsAccumulated, LendingPoolError};
use ink::{env::DefaultEnvironment, primitives::AccountId};
use pendzl::traits::StorageFieldGetter;

use super::storage::LendingPoolStorage;

pub trait LendingPoolMaintainImpl:
    StorageFieldGetter<LendingPoolStorage>
{
    fn accumulate_interest(
        &mut self,
        asset: AccountId,
    ) -> Result<(), LendingPoolError> {
        //// PULL DATA
        let timestamp = Self::env().block_timestamp();
        self.data::<LendingPoolStorage>()
            .account_for_accumulate_interest(&asset, &timestamp)?;
        ink::env::emit_event::<DefaultEnvironment, InterestsAccumulated>(
            InterestsAccumulated { asset },
        );

        Ok(())
    }
}
