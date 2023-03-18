// TODO::tothink should transfer emit event inside lendingpool?

use openbrush::traits::{
    AccountId,
    Balance,
    Storage,
};

use ink::prelude::*;

use crate::{
    impls::lending_pool::{
        internal::{
            _check_borrowing_enabled,
            *,
        },
        storage::{
            lending_pool_storage::LendingPoolStorage,
            structs::{
                reserve_data::ReserveData,
                user_config::UserConfig,
                user_reserve_data::UserReserveData,
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
            traits::v_token_interface::LendingPoolVTokenInterface,
        },
    },
};

impl<T: Storage<LendingPoolStorage> + VTokenInterfaceInternal> LendingPoolVTokenInterface for T {
    default fn total_variable_debt_of(&self, underlying_asset: AccountId) -> Balance {
        let mut reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)
            .unwrap_or_default();
        if reserve_data.total_variable_borrowed == 0 {
            return 0
        }

        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        reserve_data._accumulate_interest(block_timestamp);
        reserve_data.total_variable_borrowed
    }

    fn user_variable_debt_of(&self, underlying_asset: AccountId, user: AccountId) -> Balance {
        let mut user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &user)
            .unwrap_or_default();
        if user_reserve_data.variable_borrowed == 0 {
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
        let (mut reserve_data, mut from_config, mut from_user_reserve_data, mut to_config, mut to_user_reserve_data) =
            self._pull_data_for_token_transfer(&underlying_asset, &from, &to)?;
        if reserve_data.v_token_address != Self::env().caller() {
            return Err(LendingPoolTokenInterfaceError::WrongCaller)
        }
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        _check_borrowing_enabled(&reserve_data).or(Err(LendingPoolTokenInterfaceError::TransfersDisabled))?;

        // MODIFY PULLED STORAGE & AMOUNT CHECKS
        // accumulate reserve
        reserve_data._accumulate_interest(block_timestamp);
        let (interest_from_supply, interest_from_variable_borrow): (Balance, Balance) =
            from_user_reserve_data._accumulate_user_interest(&mut reserve_data);
        let (interest_to_supply, interest_to_variable_borrow): (Balance, Balance) =
            to_user_reserve_data._accumulate_user_interest(&mut reserve_data);

        if from_user_reserve_data.variable_borrowed < amount {
            return Err(LendingPoolTokenInterfaceError::InsufficientBalance)
        }
        _decrease_user_variable_debt(&reserve_data, &mut from_user_reserve_data, &mut from_config, amount);
        _increase_user_variable_debt(&reserve_data, &mut to_user_reserve_data, &mut to_config, amount);

        _check_enough_variable_debt(&reserve_data, &from_user_reserve_data)
            .or(Err(LendingPoolTokenInterfaceError::MinimalDebt))?;
        _check_enough_variable_debt(&reserve_data, &to_user_reserve_data)
            .or(Err(LendingPoolTokenInterfaceError::MinimalDebt))?;
        //// PUSH STORAGE & FINAL CONDITION CHECK
        self._push_data(
            &underlying_asset,
            &reserve_data,
            &from,
            &from_config,
            &from_user_reserve_data,
            &to,
            &to_config,
            &to_user_reserve_data,
        );
        // check if there ie enought collateral
        self._check_user_free_collateral(&to, block_timestamp)
            .or(Err(LendingPoolTokenInterfaceError::InsufficientCollateral))?;

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

        //// EVENT
        // TODO add transfer emit event

        Ok((interest_from_variable_borrow, interest_to_variable_borrow))
    }
}

pub trait VTokenInterfaceInternal {
    fn _pull_data_for_token_transfer(
        &mut self,
        underlying_asset: &AccountId,
        from: &AccountId,
        to: &AccountId,
    ) -> Result<(ReserveData, UserConfig, UserReserveData, UserConfig, UserReserveData), LendingPoolTokenInterfaceError>;
    fn _push_data(
        &mut self,
        underlying_asset: &AccountId,
        reserve_data: &ReserveData,
        from: &AccountId,
        from_config: &UserConfig,
        from_user_reserve_data: &UserReserveData,
        to: &AccountId,
        to_config: &UserConfig,
        to_user_reserve_data: &UserReserveData,
    );
}

impl<T: Storage<LendingPoolStorage>> VTokenInterfaceInternal for T {
    fn _pull_data_for_token_transfer(
        &mut self,
        underlying_asset: &AccountId,
        from: &AccountId,
        to: &AccountId,
    ) -> Result<(ReserveData, UserConfig, UserReserveData, UserConfig, UserReserveData), LendingPoolTokenInterfaceError>
    {
        let reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&underlying_asset)
            .ok_or(LendingPoolTokenInterfaceError::AssetNotRegistered)?;
        // "from" config and data
        let from_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&from)
            .ok_or(LendingPoolTokenInterfaceError::InsufficientBalance)?;
        let from_user_reserve_data: UserReserveData = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &from)
            .ok_or(LendingPoolTokenInterfaceError::InsufficientBalance)?;
        // "to" config and data
        let to_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&to)
            .ok_or(LendingPoolTokenInterfaceError::InsufficientCollateral)?;
        let to_user_reserve_data: UserReserveData = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &to)
            .unwrap_or_default();
        Ok((
            reserve_data,
            from_config,
            from_user_reserve_data,
            to_config,
            to_user_reserve_data,
        ))
    }

    fn _push_data(
        &mut self,
        underlying_asset: &AccountId,
        reserve_data: &ReserveData,
        from: &AccountId,
        from_config: &UserConfig,
        from_user_reserve_data: &UserReserveData,
        to: &AccountId,
        to_config: &UserConfig,
        to_user_reserve_data: &UserReserveData,
    ) {
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&underlying_asset, reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&underlying_asset, &from, &from_user_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&underlying_asset, &to, &to_user_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_config(&from, &from_config);
        self.data::<LendingPoolStorage>().insert_user_config(&to, &to_config);
    }
}
