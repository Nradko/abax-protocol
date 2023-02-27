// TODO::think should we emit events on set_as_collateral

#![allow(unused_variables)]
use crate::{
    impls::{
        constants::{
            MATH_ERROR_MESSAGE,
            ONE_HOUR,
        },
        lending_pool::{
            internal::_accumulate_interest,
            storage::lending_pool_storage::LendingPoolStorage,
        },
    },
    traits::{
        abacus_token::traits::abacus_token::{
            AbacusTokenRef,
            TransferEventData,
        },
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolError,
            events::*,
            traits::actions::LendingPoolMaintain,
        },
    },
};
use checked_math::checked_math;
use ink::prelude::*;
use openbrush::traits::{
    AccountId,
    Balance,
    Storage,
};

impl<T: Storage<LendingPoolStorage>> LendingPoolMaintain for T {
    default fn insert_reserve_token_price_e8(
        &mut self,
        asset: AccountId,
        price_e8: u128,
    ) -> Result<(), LendingPoolError> {
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        reserve_data.token_price_e8 = Some(price_e8);
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);
        Ok(())
    }

    default fn accumulate_interest(&mut self, asset: AccountId) -> Result<(), LendingPoolError> {
        //// PULL DATA
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;

        //// MODIFY STORAGE
        reserve_data._accumulate_interest(block_timestamp);

        reserve_data._recalculate_current_rates();
        //// PUSH STORAGE
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);

        Ok(())
    }
    default fn accumulate_user_interest(&mut self, asset: AccountId, user: AccountId) -> Result<(), LendingPoolError> {
        //// PULL DATA & INIT CONDITION CHECK
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        let mut user_reserve_data = self.data::<LendingPoolStorage>().get_user_reserve(&asset, &user)?;
        if block_timestamp < user_reserve_data.update_timestamp + u64::try_from(ONE_HOUR).unwrap() {
            return Err(LendingPoolError::TooEarlyToAccumulate)
        }

        //// MODIFY STORAGE
        let (interest_user_of_supply, interest_user_variable_borrow, interest_user_stable_borrow): (
            Balance,
            Balance,
            Balance,
        ) = _accumulate_interest(&mut reserve_data, &mut user_reserve_data, block_timestamp);

        reserve_data._recalculate_current_rates();

        //// PUSH STORAGE
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&asset, &user, &user_reserve_data);

        //// ABACUS TOKEN EVENTS
        if interest_user_of_supply != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.a_token_address,
                ink::prelude::vec![TransferEventData {
                    from: None,
                    to: Some(user),
                    amount: interest_user_of_supply,
                }],
            )?;
        }
        if interest_user_variable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.v_token_address,
                vec![TransferEventData {
                    from: None,
                    to: Some(user),
                    amount: interest_user_variable_borrow,
                }],
            )?;
        }
        if interest_user_stable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.s_token_address,
                vec![TransferEventData {
                    from: None,
                    to: Some(user),
                    amount: interest_user_stable_borrow,
                }],
            )?;
        }

        Ok(())
    }
    default fn rebalance_stable_borrow_rate(
        &mut self,
        asset: AccountId,
        user: AccountId,
    ) -> Result<u128, LendingPoolError> {
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        let mut user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &user)
            .unwrap_or_default();

        if user_reserve_data.stable_borrowed == 0 {
            return Err(LendingPoolError::NoStableBorrow)
        }

        //// MODIFY STORAGE
        let (interest_user_of_supply, interest_user_variable_borrow, interest_user_stable_borrow): (
            Balance,
            Balance,
            Balance,
        ) = _accumulate_interest(&mut reserve_data, &mut user_reserve_data, block_timestamp);
        reserve_data._recalculate_current_rates();

        if reserve_data.current_supply_rate_e24 < user_reserve_data.stable_borrow_rate_e24 {
            return Err(LendingPoolError::RebalanceCondition)
        }

        let new_stable_borrow_rate_e24 = reserve_data
            .current_supply_rate_e24
            .checked_add(reserve_data.stable_rate_base_e24.unwrap_or_default())
            .expect(MATH_ERROR_MESSAGE);
        reserve_data.avarage_stable_rate_e24 = u128::try_from(
            checked_math!(
                ((reserve_data.sum_stable_debt - user_reserve_data.stable_borrowed)
                    * reserve_data.avarage_stable_rate_e24
                    + user_reserve_data.stable_borrowed * new_stable_borrow_rate_e24)
                    / reserve_data.sum_stable_debt
            )
            .unwrap(),
        )
        .expect(MATH_ERROR_MESSAGE);
        user_reserve_data.stable_borrow_rate_e24 = new_stable_borrow_rate_e24;

        //// PUSH STORAGE
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&asset, &user, &user_reserve_data);

        //// ABACUS TOKEN EVENTS
        if interest_user_of_supply != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.a_token_address,
                ink::prelude::vec![TransferEventData {
                    from: None,
                    to: Some(user),
                    amount: interest_user_of_supply,
                }],
            )?;
        }
        if interest_user_variable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.v_token_address,
                vec![TransferEventData {
                    from: None,
                    to: Some(user),
                    amount: interest_user_variable_borrow,
                }],
            )?;
        }
        if interest_user_stable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.s_token_address,
                vec![TransferEventData {
                    from: None,
                    to: Some(user),
                    amount: interest_user_stable_borrow,
                }],
            )?;
        }
        Ok(new_stable_borrow_rate_e24)
    }
}

impl<T: Storage<LendingPoolStorage>> EmitMaintainEvents for T {
    default fn _emit_accumulate_interest_event(&mut self, asset: &AccountId) {}
    default fn _emit_accumulate_user_interest_event(&mut self, asset: &AccountId, user: &AccountId) {}
    default fn _emit_rebalance_rate_event(&mut self, asset: &AccountId, user: &AccountId) {}
}
