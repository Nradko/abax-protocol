// TODO::think should we emit events on set_as_collateral

#![allow(unused_variables)]
use ink::prelude::vec::Vec;
use openbrush::{
    contracts::traits::psp22::*,
    traits::{
        AccountId,
        Balance,
        Storage,
    },
};

use crate::{
    impls::lending_pool::{
        internal::{
            _accumulate_interest,
            _check_activeness,
            _check_deposit_enabled,
            *,
        },
        storage::lending_pool_storage::LendingPoolStorage,
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolError,
            events::*,
            traits::actions::LendingPoolDeposit,
        },
    },
};

impl<T: Storage<LendingPoolStorage>> LendingPoolDeposit for T {
    default fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        //// ARGUMENT CHECK
        if amount == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero)
        }
        //// PULL DATA
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        _check_deposit_enabled(&reserve_data)?;
        let mut on_behalf_of_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_or_create_user_reserve(&asset, &on_behalf_of);
        let mut on_behalf_of_config = self
            .data::<LendingPoolStorage>()
            .get_or_create_user_config(&on_behalf_of);

        //// MODIFY DATA
        // accumulate
        let (
            interest_on_behalf_of_supply,
            interest_on_behalf_of_variable_borrow,
            interest_on_behalf_of_stable_borrow,
        ): (Balance, Balance, Balance) = _accumulate_interest(
            &mut reserve_data,
            &mut on_behalf_of_reserve_data,
            block_timestamp,
        );
        // add deposit
        _increase_user_deposit(
            &reserve_data,
            &mut on_behalf_of_reserve_data,
            &mut on_behalf_of_config,
            amount,
        );
        _increase_total_deposit(&mut reserve_data, amount);
        // recalculate
        reserve_data._recalculate_current_rates()?;

        //// PUSH STORAGE
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);

        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&asset, &on_behalf_of, &on_behalf_of_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_config(&on_behalf_of, &on_behalf_of_config);

        //// TOKEN TRANSFERS
        PSP22Ref::transfer_from_builder(
            &asset,
            Self::env().caller(),
            Self::env().account_id(),
            amount,
            Vec::<u8>::new(),
        )
        .call_flags(ink::env::CallFlags::default().set_allow_reentry(true))
        .try_invoke()
        .unwrap()??;
        //// ABACUS TOKEN EVENTS
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.a_token_address,
            &on_behalf_of,
            (interest_on_behalf_of_supply + amount) as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.v_token_address,
            &on_behalf_of,
            interest_on_behalf_of_variable_borrow as i128,
        )?;
        // STOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.s_token_address,
            &on_behalf_of,
            interest_on_behalf_of_stable_borrow as i128,
        )?;

        //// EVENT
        self._emit_deposit_event(asset, Self::env().caller(), on_behalf_of, amount);

        Ok(())
    }

    default fn redeem(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount_arg: Option<Balance>,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        //// PULL DATA
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let mut reserve_data = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        _check_activeness(&reserve_data)?;
        let mut on_behalf_of_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &on_behalf_of)?;
        let mut on_behalf_of_config = self.data::<LendingPoolStorage>().get_user_config(&on_behalf_of)?;
        // MODIFY PULLED STORAGE & AMOUNT CHECK
        // accumulate
        let (
            interest_on_behalf_of_supply,
            interest_on_behalf_of_variable_borrow,
            interest_on_behalf_of_stable_borrow,
        ): (Balance, Balance, Balance) = _accumulate_interest(
            &mut reserve_data,
            &mut on_behalf_of_reserve_data,
            block_timestamp,
        );
        // amount checks
        let amount = match amount_arg {
            Some(v) => v,
            None => on_behalf_of_reserve_data.supplied,
        };
        if amount == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero)
        }
        if amount > on_behalf_of_reserve_data.supplied {
            return Err(LendingPoolError::AmountExceedsUserDeposit)
        }
        // sub deposit
        _decrease_user_deposit(
            &reserve_data,
            &mut on_behalf_of_reserve_data,
            &mut on_behalf_of_config,
            amount,
        );
        _decrease_total_deposit(&mut reserve_data, amount);
        if on_behalf_of_reserve_data.supplied <= reserve_data.minimal_collateral {
            on_behalf_of_config.collaterals &= !(1_u128 << reserve_data.id);
        }
        // recalculate
        reserve_data._recalculate_current_rates()?;

        //// PUSH STORAGE & FINAL CONDITION CHECK
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&asset, &on_behalf_of, &on_behalf_of_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_config(&on_behalf_of, &on_behalf_of_config);
        // check if there ie enought collateral
        let (collaterized, _) = self._get_user_free_collateral_coefficient_e6(&on_behalf_of, block_timestamp);
        if !collaterized {
            return Err(LendingPoolError::InsufficientUserFreeCollateral)
        }

        //// TOKEN TRANSFERS
        PSP22Ref::transfer(&asset, Self::env().caller(), amount, Vec::<u8>::new())?;

        //// ABACUS TOKEN EVENTS
        // ATOKEN
        _emit_abacus_token_transfer_event_and_decrease_allowance(
            &reserve_data.a_token_address,
            &on_behalf_of,
            (interest_on_behalf_of_supply - amount) as i128,
            &(Self::env().caller()),
            amount,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.v_token_address,
            &on_behalf_of,
            interest_on_behalf_of_variable_borrow as i128,
        )?;
        // STOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.s_token_address,
            &on_behalf_of,
            interest_on_behalf_of_stable_borrow as i128,
        )?;

        //// EVENT
        self._emit_redeem_event(asset, Self::env().caller(), on_behalf_of, amount);

        Ok(amount)
    }
}

impl<T: Storage<LendingPoolStorage>> EmitDepositEvents for T {
    default fn _emit_deposit_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    ) {
    }
    default fn _emit_redeem_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    ) {
    }
}
