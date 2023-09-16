use ink::prelude::vec::Vec;
use pendzl::traits::{AccountId, Balance, Storage};

use crate::{
    impls::lending_pool::{
        internal::*, storage::lending_pool_storage::LendingPoolStorage,
    },
    traits::lending_pool::{
        errors::LendingPoolError, events::EmitDepositEvents,
    },
};

pub trait LendingPoolDepositImpl:
    Storage<LendingPoolStorage> + Transfer + TimestampMock + EmitDepositEvents
{
    fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        //// ARGUMENT CHECK
        _check_amount_not_zero(amount)?;
        //// PULL DATA
        let block_timestamp = self._timestamp();

        let (user_accumulated_supply_interest, user_accumulated_debt_interest) =
            self.data::<LendingPoolStorage>().account_for_deposit(
                &asset,
                &on_behalf_of,
                &amount,
                &block_timestamp,
            )?;

        //// TOKEN TRANSFERS
        self._transfer_in(&asset, &Self::env().caller(), &amount)?;
        //// ABACUS TOKEN EVENTS
        let abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus
            .get(&asset)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.a_token_address,
            &on_behalf_of,
            (user_accumulated_supply_interest + amount) as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            user_accumulated_debt_interest as i128,
        )?;

        //// EVENT
        self._emit_deposit_event(
            asset,
            Self::env().caller(),
            on_behalf_of,
            amount,
        );

        Ok(())
    }

    fn redeem(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        mut amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        if amount == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero);
        }
        //// PULL DATA
        let block_timestamp = self._timestamp();

        let (user_accumulated_supply_interest, user_accumulated_debt_interest) =
            self.data::<LendingPoolStorage>().account_for_withdraw(
                &asset,
                &on_behalf_of,
                &mut amount,
                &block_timestamp,
            )?;
        // check if there ie enought collateral
        self.data::<LendingPoolStorage>()
            .check_lending_power(&on_behalf_of)?;

        //// TOKEN TRANSFERS
        self._transfer_out(&asset, &Self::env().caller(), &amount)?;

        //// ABACUS TOKEN EVENTS
        let abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus
            .get(&asset)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event_and_decrease_allowance(
            &abacus_tokens.a_token_address,
            &on_behalf_of,
            user_accumulated_supply_interest as i128 - amount as i128,
            &(Self::env().caller()),
            amount,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            user_accumulated_debt_interest as i128,
        )?;

        //// EVENT
        self._emit_redeem_event(
            asset,
            Self::env().caller(),
            on_behalf_of,
            amount,
        );

        Ok(amount)
    }
}
