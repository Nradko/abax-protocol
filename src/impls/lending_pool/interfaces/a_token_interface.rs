// TODO::tothink should transfer emit event inside lendingpool?

use crate::{
    impls::lending_pool::{
        internal::{
            Internal,
            _decrease_user_deposit,
            _increase_user_deposit,
        },
        storage::lending_pool_storage::LendingPoolStorage,
    },
    traits::{
        abacus_token::traits::abacus_token::{
            AbacusTokenRef,
            TransferEventData,
        },
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolTokenInterfaceError,
            traits::a_token_interface::LendingPoolATokenInterface,
        },
    },
};
use ink::prelude::*;
use openbrush::traits::{
    AccountId,
    Balance,
    Storage,
};

impl<T: Storage<LendingPoolStorage>> LendingPoolATokenInterface for T {
    default fn total_supply_of(&self, underlying_asset: AccountId) -> Balance {
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)
            .unwrap_or_default();
        if reserve_data.total_supplied == 0 {
            return 0
        }
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        reserve_data._accumulate_interest(block_timestamp);
        reserve_data.total_supplied
    }

    fn user_supply_of(&self, underlying_asset: AccountId, user: AccountId) -> Balance {
        let mut user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &user)
            .unwrap_or_default();
        if user_reserve_data.supplied == 0 {
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
        user_reserve_data.supplied
    }

    fn transfer_supply_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError> {
        //// PULL DATA AND INIT CONDITIONS CHECK
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&underlying_asset)?;

        if Self::env().caller() != reserve_data.a_token_address {
            return Err(LendingPoolTokenInterfaceError::WrongCaller)
        }
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut from_user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &from)?;
        let mut to_user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_or_create_user_reserve(&underlying_asset, &to);
        let mut from_config = self.data::<LendingPoolStorage>().get_or_create_user_config(&from);
        let mut to_config = self.data::<LendingPoolStorage>().get_or_create_user_config(&to);
        // MODIFY PULLED STORAGE & AMOUNT CHECKS
        // accumulate reserve
        reserve_data._accumulate_interest(block_timestamp);
        // accumulate from user
        let (interest_from_supply, interest_from_variable_borrow, interst_from_stable_borrow): (
            Balance,
            Balance,
            Balance,
        ) = from_user_reserve_data._accumulate_user_interest(&mut reserve_data);
        // accumulate to user
        let (interest_to_supply, interest_to_variable_borrow, interst_to_stable_borrow): (Balance, Balance, Balance) =
            to_user_reserve_data._accumulate_user_interest(&mut reserve_data);
        // amount check and sub supply
        if from_user_reserve_data.supplied < amount {
            return Err(LendingPoolTokenInterfaceError::InsufficientBalance)
        }
        _decrease_user_deposit(&reserve_data, &mut from_user_reserve_data, &mut from_config, amount);
        if from_user_reserve_data.supplied <= reserve_data.minimal_collateral {
            from_config.collaterals &= !(1_u128 << reserve_data.id);
        }
        // add_to_user_supply
        _increase_user_deposit(&reserve_data, &mut to_user_reserve_data, &mut to_config, amount);

        //// PUSH STORAGE & FINAL CONDITION CHECK
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&underlying_asset, &reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&underlying_asset, &from, &from_user_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&underlying_asset, &to, &to_user_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_config(&from, &from_config);
        self.data::<LendingPoolStorage>().insert_user_config(&to, &to_config);
        // check if there ie enought collateral
        let (collaterized, _) = self._get_user_free_collateral_coefficient_e6(&from, block_timestamp);
        if !collaterized {
            return Err(LendingPoolTokenInterfaceError::InsufficientUserFreeCollateral)
        }

        //// ABACUS TOKEN EVENTS
        if interest_from_variable_borrow != 0 || interest_to_variable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.v_token_address,
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
        if interst_from_stable_borrow != 0 || interst_to_stable_borrow != 0 {
            AbacusTokenRef::emit_transfer_events(
                &reserve_data.s_token_address,
                vec![
                    TransferEventData {
                        from: None,
                        to: Some(from),
                        amount: interst_from_stable_borrow,
                    },
                    TransferEventData {
                        from: None,
                        to: Some(to),
                        amount: interst_to_stable_borrow,
                    },
                ],
            )?;
        }

        //// EVENT
        // TODO add transfer emit event

        Ok((interest_from_supply, interest_to_supply))
    }
}
