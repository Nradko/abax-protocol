use pendzl::{
    contracts::psp22::PSP22Error,
    traits::{AccountId, Balance, Storage},
};

use ink::prelude::*;

use crate::{
    impls::lending_pool::{
        internal::*, storage::lending_pool_storage::LendingPoolStorage,
    },
    traits::{
        abacus_token::traits::abacus_token::{
            AbacusToken, AbacusTokenRef, TransferEventData,
        },
        lending_pool::events::EmitBorrowEvents,
    },
};

pub trait LendingPoolVTokenInterfaceImpl:
    Storage<LendingPoolStorage>
    + Storage<pendzl::contracts::pausable::Data>
    + pendzl::contracts::pausable::Internal
    + EmitBorrowEvents
{
    fn total_variable_debt_of(&self, underlying_asset: AccountId) -> Balance {
        let timestamp = self._timestamp();
        self.data::<LendingPoolStorage>()
            .total_debt_of(&underlying_asset, &timestamp)
            .unwrap()
    }

    fn user_variable_debt_of(
        &self,
        underlying_asset: AccountId,
        user: AccountId,
    ) -> Balance {
        let timestamp = self._timestamp();
        self.data::<LendingPoolStorage>()
            .user_debt_of(&underlying_asset, &user, &timestamp)
            .unwrap()
    }

    fn transfer_variable_debt_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), PSP22Error> {
        self._ensure_not_paused()?;
        // pull reserve_data
        let reserve_abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus
            .get(&underlying_asset)
            .ok_or(PSP22Error::Custom("AssetNotRegistered".into()))?;
        if Self::env().caller() != reserve_abacus_tokens.v_token_address {
            return Err(PSP22Error::Custom("WrongCaller".into()));
        }

        let timestamp = self._timestamp();
        ink::env::debug_println!("v_token transfer| account");
        let (
            from_accumulated_deposit_interest,
            from_accumulated_debt_interest,
            to_accumulated_deposit_interest,
            to_accumulated_debt_interest,
        ) = self
            .data::<LendingPoolStorage>()
            .account_for_debt_transfer_from_to(
                &underlying_asset,
                &from,
                &to,
                &amount,
                &timestamp,
            )?;

        // check if there ie enought
        ink::env::debug_println!("v_token transfer| check lending Power");

        self.data::<LendingPoolStorage>().check_lending_power(&to)?;

        //// ABACUS TOKEN EVENTS
        // AToken interests
        if from_accumulated_deposit_interest != 0
            || to_accumulated_deposit_interest != 0
        {
            let mut abacus_token_contract: AbacusTokenRef =
                reserve_abacus_tokens.a_token_address.into();

            abacus_token_contract.emit_transfer_events(vec![
                TransferEventData {
                    from: None,
                    to: Some(from),
                    amount: from_accumulated_deposit_interest,
                },
                TransferEventData {
                    from: None,
                    to: Some(to),
                    amount: to_accumulated_deposit_interest,
                },
            ])?;
        }
        // VToken intersts are returned

        //// EVENT
        self._emit_repay_variable_event(
            underlying_asset,
            Self::env().caller(),
            from,
            amount,
        );
        self._emit_borrow_variable_event(
            underlying_asset,
            Self::env().caller(),
            to,
            amount,
        );

        Ok((from_accumulated_debt_interest, to_accumulated_debt_interest))
    }
}
