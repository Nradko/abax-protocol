// TODO::tothink should transfer emit event inside lendingpool?

use checked_math::checked_math;
use openbrush::traits::{AccountId, Balance, Storage};

use ink_prelude::*;

use crate::{
    impls::{
        constants::MATH_ERROR_MESSAGE,
        lending_pool::{
            internal::{_check_borrowing_enabled, *},
            storage::{
                lending_pool_storage::LendingPoolStorage,
                structs::user_reserve_data::UserReserveData,
            },
        },
    },
    traits::{
        abacus_token::traits::abacus_token::{AbacusTokenRef, TransferEventData},
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolTokenInterfaceError,
            traits::v_token_interface::LendingPoolVTokenInterface,
        },
    },
};

impl<T: Storage<LendingPoolStorage>> LendingPoolVTokenInterface for T {
    default fn total_variable_debt_of(&self, underlying_asset: AccountId) -> Balance {
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)
            .unwrap_or_default();
        if reserve_data.total_variable_borrowed == 0 {
            return 0;
        }

        let block_timestamp = BlockTimestampProviderRef::get_block_timestamp(
            &self.data::<LendingPoolStorage>().block_timestamp_provider,
        );
        reserve_data._accumulate_interest(block_timestamp);
        reserve_data.total_variable_borrowed
    }

    fn user_variable_debt_of(&self, underlying_asset: AccountId, user: AccountId) -> Balance {
        let mut user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &user)
            .unwrap_or_default();
        if user_reserve_data.variable_borrowed == 0 {
            return 0;
        }
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)
            .unwrap_or_default();

        let block_timestamp = BlockTimestampProviderRef::get_block_timestamp(
            &self.data::<LendingPoolStorage>().block_timestamp_provider,
        );
        reserve_data._accumulate_interest(block_timestamp);
        user_reserve_data._accumulate_user_interest(&mut reserve_data);
        user_reserve_data.variable_borrowed
    }

    fn transfer_variable_debt_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError> {
        // pull reserve_data
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)?;
        if reserve_data.v_token_address != Self::env().caller() {
            return Err(LendingPoolTokenInterfaceError::WrongCaller);
        }
        let block_timestamp = BlockTimestampProviderRef::get_block_timestamp(
            &self.data::<LendingPoolStorage>().block_timestamp_provider,
        );
        let mut from_reserve_data: UserReserveData = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &from)?;
        let mut to_reserve_data: UserReserveData = self
            .data::<LendingPoolStorage>()
            .get_or_create_user_reserve(&underlying_asset, &to);
        // check if rules allow user "to" to take debt
        let mut to_config = self.data::<LendingPoolStorage>().get_user_config(&to)?;
        match _check_borrowing_enabled(&reserve_data) {
            Err(_) => return Err(LendingPoolTokenInterfaceError::TransfersDisabled),
            Ok(_) => (),
        };

        // MODIFY PULLED STORAGE & AMOUNT CHECKS
        // accumulate reserve
        reserve_data._accumulate_interest(block_timestamp);
        let (interest_from_supply, interest_from_variable_borrow, interest_from_stable_borrow): (
            Balance,
            Balance,
            Balance,
        ) = from_reserve_data._accumulate_user_interest(&mut reserve_data);
        let (interest_to_supply, interest_to_variable_borrow, interest_to_stable_borrow): (
            Balance,
            Balance,
            Balance,
        ) = to_reserve_data._accumulate_user_interest(&mut reserve_data);
        // if transfering whole debt
        let from_debt = from_reserve_data.variable_borrowed;
        if from_debt == amount {
            let mut from_config = self.data::<LendingPoolStorage>().get_user_config(&from)?;
            from_config.borrows_variable &= !(1_u128 << reserve_data.id);
            self.data::<LendingPoolStorage>()
                .insert_user_config(&from, &from_config);
        } else if from_debt < amount {
            return Err(LendingPoolTokenInterfaceError::InsufficientBalance);
        }
        from_reserve_data.variable_borrowed =
            u128::try_from(checked_math!(from_reserve_data.variable_borrowed - amount).unwrap())
                .expect(MATH_ERROR_MESSAGE);
        //// TO
        // if debt was 0
        if ((to_config.borrows_variable >> reserve_data.id) & 1) == 0 {
            to_config.borrows_variable |= 1_u128 << reserve_data.id;
            self.data::<LendingPoolStorage>()
                .insert_user_config(&from, &to_config);
        }
        // add_to_user_borrow
        to_reserve_data.variable_borrowed =
            u128::try_from(checked_math!(to_reserve_data.variable_borrowed + amount).unwrap())
                .expect(MATH_ERROR_MESSAGE);

        //// PUSH STORAGE & FINAL CONDITION CHECK
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&underlying_asset, &reserve_data);

        self.data::<LendingPoolStorage>().insert_user_reserve(
            &underlying_asset,
            &from,
            &from_reserve_data,
        );

        self.data::<LendingPoolStorage>().insert_user_reserve(
            &underlying_asset,
            &to,
            &to_reserve_data,
        );
        // check if there ie enought collateral
        let (collaterized, collateral_value) =
            self._get_user_free_collateral_coefficient_e6(&to, block_timestamp);
        if !collaterized {
            ink_env::debug_println!("v token | User is undercollaterized: {}", collateral_value);
            return Err(LendingPoolTokenInterfaceError::InsufficientUserFreeCollateral);
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
        if interest_from_stable_borrow != 0 || interest_to_stable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.s_token_address,
                vec![
                    TransferEventData {
                        from: None,
                        to: Some(from),
                        amount: interest_from_stable_borrow,
                    },
                    TransferEventData {
                        from: None,
                        to: Some(to),
                        amount: interest_to_stable_borrow,
                    },
                ],
            )?;
        }

        //// EVENT
        // TODO add transfer emit event

        Ok((interest_from_variable_borrow, interest_to_variable_borrow))
    }
}
