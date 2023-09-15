use crate::{
    impls::lending_pool::{
        internal::TimestampMock,
        storage::lending_pool_storage::LendingPoolStorage,
    },
    traits::{
        abacus_token::traits::abacus_token::{
            AbacusTokenRef, TransferEventData,
        },
        lending_pool::{
            errors::{LendingPoolError, LendingPoolTokenInterfaceError},
            events::EmitDepositEvents,
        },
    },
};
use ink::prelude::*;
use openbrush::traits::{AccountId, Balance, Storage};

pub trait LendingPoolATokenInterfaceImpl:
    Storage<LendingPoolStorage>
    + TimestampMock
    + Storage<openbrush::contracts::pausable::Data>
    + EmitDepositEvents
{
    fn total_supply_of(&self, underlying_asset: AccountId) -> Balance {
        let timestamp = self._timestamp();
        self.data::<LendingPoolStorage>()
            .total_deposit_of(&underlying_asset, &timestamp)
            .unwrap()
    }

    fn user_supply_of(
        &self,
        underlying_asset: AccountId,
        user: AccountId,
    ) -> Balance {
        let timestamp = self._timestamp();
        self.data::<LendingPoolStorage>()
            .user_deposit_of(&underlying_asset, &user, &timestamp)
            .unwrap()
    }

    #[openbrush::modifiers(openbrush::contracts::pausable::when_not_paused)]
    fn transfer_supply_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolTokenInterfaceError> {
        let reserve_abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus
            .get(&underlying_asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        if Self::env().caller() != reserve_abacus_tokens.a_token_address {
            return Err(LendingPoolTokenInterfaceError::WrongCaller);
        }

        let timestamp = self._timestamp();
        let (
            from_accumulated_deposit_interest,
            from_accumulated_debt_interest,
            to_accumulated_deposit_interest,
            to_accumulated_debt_interest,
        ) = self
            .data::<LendingPoolStorage>()
            .account_for_deposit_transfer_from_to(
                &underlying_asset,
                &from,
                &to,
                &amount,
                &timestamp,
            )?;

        // check if there ie enought collateral
        self.data::<LendingPoolStorage>()
            .check_lending_power(&from)?;

        //// ABACUS TOKEN EVENTS
        // AToken interests are returned.
        // VToken intersts
        if from_accumulated_debt_interest != 0
            || to_accumulated_debt_interest != 0
        {
            AbacusTokenRef::emit_transfer_events(
                &reserve_abacus_tokens.v_token_address,
                vec![
                    TransferEventData {
                        from: None,
                        to: Some(from),
                        amount: from_accumulated_debt_interest,
                    },
                    TransferEventData {
                        from: None,
                        to: Some(to),
                        amount: to_accumulated_debt_interest,
                    },
                ],
            )?;
        }

        //// EVENT
        self._emit_deposit_event(
            underlying_asset,
            Self::env().caller(),
            to,
            amount,
        );
        self._emit_redeem_event(
            underlying_asset,
            Self::env().caller(),
            from,
            amount,
        );

        Ok((
            from_accumulated_deposit_interest,
            to_accumulated_deposit_interest,
        ))
    }
}
