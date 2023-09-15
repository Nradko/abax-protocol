use crate::{
    impls::lending_pool::{
        internal::TimestampMock,
        storage::lending_pool_storage::LendingPoolStorage,
    },
    traits::lending_pool::{
        errors::LendingPoolError, events::EmitMaintainEvents,
    },
};
use openbrush::traits::{AccountId, Storage};

pub trait LendingPoolMaintainImpl:
    Storage<LendingPoolStorage> + EmitMaintainEvents
{
    fn insert_reserve_token_price_e8(
        &mut self,
        asset: AccountId,
        price_e8: u128,
    ) -> Result<(), LendingPoolError> {
        self.data::<LendingPoolStorage>()
            .account_for_token_price_change(&asset, &price_e8)?;
        Ok(())
    }

    fn accumulate_interest(
        &mut self,
        asset: AccountId,
    ) -> Result<(), LendingPoolError> {
        //// PULL DATA
        let timestamp = self._timestamp();
        self.data::<LendingPoolStorage>()
            .account_for_accumulate_interest(&asset, &timestamp)?;
        self._emit_accumulate_interest_event(&asset);

        Ok(())
    }
}
