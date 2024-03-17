use abax_traits::lending_pool::{EmitMaintainEvents, LendingPoolError};
use ink::primitives::AccountId;
use pendzl::traits::StorageFieldGetter;

use super::storage::LendingPoolStorage;

pub trait LendingPoolMaintainImpl:
    StorageFieldGetter<LendingPoolStorage> + EmitMaintainEvents
{
    fn accumulate_interest(
        &mut self,
        asset: AccountId,
    ) -> Result<(), LendingPoolError> {
        //// PULL DATA
        let timestamp = Self::env().block_timestamp();
        self.data::<LendingPoolStorage>()
            .account_for_accumulate_interest(&asset, &timestamp)?;
        self._emit_accumulate_interest_event(&asset);

        Ok(())
    }
}
