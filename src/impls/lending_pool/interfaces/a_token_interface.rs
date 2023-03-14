// TODO::tothink should transfer emit event inside lendingpool?

use crate::{
    impls::lending_pool::{
        internal::{
            Internal,
            _check_enough_supply_to_be_collateral,
            _decrease_user_deposit,
            _increase_user_deposit,
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

impl<T: Storage<LendingPoolStorage> + ATokenInterfaceInternal> LendingPoolATokenInterface for T {
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
        let (mut reserve_data, mut from_config, mut from_user_reserve_data, mut to_config, mut to_user_reserve_data) =
            self._pull_data_for_token_transfer(&underlying_asset, &from, &to)?;
        if Self::env().caller() != reserve_data.a_token_address {
            return Err(LendingPoolTokenInterfaceError::WrongCaller)
        }
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        // MODIFY PULLED STORAGE & AMOUNT CHECKS
        // accumulate reserve
        reserve_data._accumulate_interest(block_timestamp);
        // accumulate from user
        let (interest_from_supply, interest_from_variable_borrow): (Balance, Balance) =
            from_user_reserve_data._accumulate_user_interest(&mut reserve_data);
        // accumulate to user
        let (interest_to_supply, interest_to_variable_borrow): (Balance, Balance) =
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

        if (from_config.collaterals >> reserve_data.id) & 1 == 1 {
            _check_enough_supply_to_be_collateral(&reserve_data, &from_user_reserve_data)
                .or(Err(LendingPoolTokenInterfaceError::MinimalSupply))?;
        }

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
        self._check_user_free_collateral(&from, block_timestamp)
            .or(Err(LendingPoolTokenInterfaceError::InsufficientCollateral))?;

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

        //// EVENT
        // TODO add transfer emit event

        Ok((interest_from_supply, interest_to_supply))
    }
}

pub trait ATokenInterfaceInternal {
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

impl<T: Storage<LendingPoolStorage>> ATokenInterfaceInternal for T {
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
        let from_user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &from)
            .ok_or(LendingPoolTokenInterfaceError::InsufficientBalance)?;
        let to_user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&underlying_asset, &to)
            .unwrap_or_default();
        let from_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&from)
            .ok_or(LendingPoolTokenInterfaceError::InsufficientBalance)?;
        let to_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&to)
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
