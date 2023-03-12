// TODO::think should we emit events on set_as_collateral

use crate::{
    impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolError,
            events::*,
            traits::actions::LendingPoolMaintain,
        },
    },
};
use openbrush::traits::{
    AccountId,
    Storage,
};

impl<T: Storage<LendingPoolStorage>> LendingPoolMaintain for T {
    default fn insert_reserve_token_price_e8(
        &mut self,
        asset: AccountId,
        price_e8: u128,
    ) -> Result<(), LendingPoolError> {
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        reserve_data.token_price_e8 = Some(price_e8);
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);
        Ok(())
    }

    default fn accumulate_interest(&mut self, asset: AccountId) -> Result<(), LendingPoolError> {
        //// PULL DATA
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;

        //// MODIFY STORAGE
        if reserve_data.indexes_update_timestamp < block_timestamp {
            reserve_data._accumulate_interest(block_timestamp);
            reserve_data._recalculate_current_rates();
            //// PUSH STORAGE
            self.data::<LendingPoolStorage>()
                .insert_reserve_data(&asset, &reserve_data);
            self._emit_accumulate_interest_event(&asset);
        }
        Ok(())
    }
}

impl<T: Storage<LendingPoolStorage>> EmitMaintainEvents for T {
    #[allow(unused_variables)]
    default fn _emit_accumulate_interest_event(&mut self, asset: &AccountId) {}
    #[allow(unused_variables)]
    default fn _emit_accumulate_user_interest_event(&mut self, asset: &AccountId, user: &AccountId) {}
    #[allow(unused_variables)]
    default fn _emit_rebalance_rate_event(&mut self, asset: &AccountId, user: &AccountId) {}
}
