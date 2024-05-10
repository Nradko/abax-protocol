use crate::lending_pool::{events::InterestsAccumulated, LendingPoolError};
use ink::{env::DefaultEnvironment, primitives::AccountId};
use pendzl::{math::errors::MathError, traits::StorageFieldGetter};

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

    fn adjust_rate_at_target(
        &mut self,
        asset: AccountId,
        guessed_index: u32,
    ) -> Result<u64, LendingPoolError> {
        let timestamp = Self::env().block_timestamp();

        let asset_id = self.data::<LendingPoolStorage>().asset_id(&asset)?;

        if let Some(mut interest_rate_model) = self
            .data::<LendingPoolStorage>()
            .interest_rate_model
            .get(asset_id)
        {
            if timestamp
                < interest_rate_model
                    .last_adjustment_timestamp
                    .checked_add(
                        interest_rate_model.minimal_time_between_adjustments,
                    )
                    .ok_or(MathError::Overflow)?
            {
                return Err(LendingPoolError::TooEarlyToAdjustRate); //tests/interestRateModel.test.ts:147
            }

            let twa_ur_e6 = self
                .data::<LendingPoolStorage>()
                .get_tw_ur_from_shortest_period_longer_than(
                    interest_rate_model.minimal_time_between_adjustments,
                    asset_id,
                    guessed_index,
                )?;

            let res = interest_rate_model
                .adjust_rate_at_target(twa_ur_e6, timestamp)?;

            self.data::<LendingPoolStorage>()
                .interest_rate_model
                .insert(asset_id, &interest_rate_model);

            Ok(res)
        } else {
            Err(LendingPoolError::AssetNotRegistered)
        }
    }
}
