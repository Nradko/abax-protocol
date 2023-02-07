// TODO::tothink should transfer emit event inside lendingpool?

use checked_math::checked_math;
use openbrush::traits::{
    AccountId,
    Balance,
    Storage,
};

use crate::{
    impls::{
        constants::MATH_ERROR_MESSAGE,
        lending_pool::{
            internal::{
                Internal,
                _check_borrowing_stable_enabled,
            },
            storage::{
                lending_pool_storage::LendingPoolStorage,
                structs::user_reserve_data::UserReserveData,
            },
        },
    },
    traits::{
        abacus_token::traits::abacus_token::{
            AbacusTokenRef,
            TransferEventData,
        },
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolTokenInterfaceError,
            traits::s_token_interface::LendingPoolSTokenInterface,
        },
    },
};
use ink_prelude::*;

impl<T: Storage<LendingPoolStorage>> LendingPoolSTokenInterface for T {
    default fn total_stable_debt_of(&self, underlying_asset: AccountId) -> Balance {
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)
            .unwrap_or_default();
        if reserve_data.sum_stable_debt + reserve_data.accumulated_stable_borrow == 0 {
            return 0
        }

        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        reserve_data._accumulate_interest(block_timestamp);
        reserve_data.sum_stable_debt + reserve_data.accumulated_stable_borrow
    }

    default fn user_stable_debt_of(&self, underlying_asset: AccountId, user: AccountId) -> Balance {
        let mut user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &user)
            .unwrap_or_default();
        if user_reserve_data.stable_borrowed == 0 {
            return 0
        }
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)
            .unwrap_or_default();
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        reserve_data._accumulate_interest(block_timestamp);
        user_reserve_data._accumulate_user_interest(&mut reserve_data);
        user_reserve_data.stable_borrowed
    }

    fn transfer_stable_debt_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError> {
        //// PULL DATA AND INIT CONDITIONS CHECK
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&underlying_asset)?;
        if reserve_data.s_token_address != Self::env().caller() {
            return Err(LendingPoolTokenInterfaceError::WrongCaller)
        }
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut from_reserve_data: UserReserveData = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &from)?;
        let mut to_reserve_data: UserReserveData = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &to)?;
        let mut to_config = self.data::<LendingPoolStorage>().get_user_config(&to)?;
        // check if rules allow user "to" to take debt
        match _check_borrowing_stable_enabled(&reserve_data) {
            Err(_) => return Err(LendingPoolTokenInterfaceError::TransfersDisabled),
            Ok(_) => (),
        };
        // MODIFY PULLED STORAGE & AMOUNT CHECKS
        // accumulate reserve
        reserve_data._accumulate_interest(block_timestamp);
        // accumulate from user
        let (interest_from_supply, interest_from_variable_borrow, interest_from_stable_borrow): (
            Balance,
            Balance,
            Balance,
        ) = from_reserve_data._accumulate_user_interest(&mut reserve_data);
        // accumulate to user
        let (interest_to_supply, interest_to_variable_borrow, interest_to_stable_borrow): (Balance, Balance, Balance) =
            to_reserve_data._accumulate_user_interest(&mut reserve_data);
        // if transfering whole debt
        let from_debt = from_reserve_data.stable_borrowed;
        if from_debt == amount {
            let mut from_config = self.data::<LendingPoolStorage>().get_user_config(&from)?;
            from_config.borrows_stable &= !(1_u128 << reserve_data.id);
            self.data::<LendingPoolStorage>()
                .insert_user_config(&from, &from_config);
        } else if from_debt < amount {
            return Err(LendingPoolTokenInterfaceError::InsufficientBalance)
        }
        from_reserve_data.stable_borrowed = from_reserve_data.stable_borrowed - amount;
        //// TO
        if ((to_config.borrows_stable >> reserve_data.id) & 1) == 0 {
            to_config.borrows_stable &= 1_u128 << reserve_data.id;
            self.data::<LendingPoolStorage>().insert_user_config(&from, &to_config);
        }
        // add_to_user_borrow
        to_reserve_data.stable_borrow_rate_e24 = {
            let stable_borrow_rate_e24_rounded_down = u128::try_from(
                checked_math!(
                    (to_reserve_data.stable_borrow_rate_e24 * to_reserve_data.stable_borrowed
                        + from_reserve_data.stable_borrow_rate_e24 * amount)
                        / (to_reserve_data.stable_borrowed + amount)
                )
                .unwrap(),
            )
            .expect(MATH_ERROR_MESSAGE);
            stable_borrow_rate_e24_rounded_down
                .checked_add(1)
                .expect(MATH_ERROR_MESSAGE)
        };
        to_reserve_data.stable_borrowed = to_reserve_data
            .stable_borrowed
            .checked_add(amount)
            .expect(MATH_ERROR_MESSAGE);

        //// PUSH STORAGE & FINAL CONDITION CHECK
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&underlying_asset, &reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&underlying_asset, &from, &from_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&underlying_asset, &to, &to_reserve_data);
        // check if there ie enought collateral
        let (collaterized, collateral_value) = self._get_user_free_collateral_coefficient_e6(&to, block_timestamp);
        if !collaterized {
            ink_env::debug_println!("s token | User is undercollaterized: {}", collateral_value);
            return Err(LendingPoolTokenInterfaceError::InsufficientUserFreeCollateral)
        }

        //// ABACUS TOKEN EVENTS
        if interest_from_supply != 0 || interest_to_supply != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.a_token_address,
                vec![
                    TransferEventData {
                        from: None,
                        to: Some(from),
                        amount: interest_from_supply,
                    },
                    TransferEventData {
                        from: None,
                        to: Some(to),
                        amount: interest_to_supply,
                    },
                ],
            )?;
        }
        if interest_from_variable_borrow != 0 || interest_to_variable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.s_token_address,
                vec![
                    TransferEventData {
                        from: None,
                        to: Some(from),
                        amount: interest_from_variable_borrow,
                    },
                    TransferEventData {
                        from: None,
                        to: Some(to),
                        amount: interest_to_variable_borrow,
                    },
                ],
            )?;
        }

        //// EVENT
        // TODO add transfer emit event

        Ok((interest_from_stable_borrow, interest_to_stable_borrow))
    }
}
