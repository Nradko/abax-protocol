use abax_traits::{
    abacus_token::{AbacusToken, AbacusTokenRef, TransferEventData},
    lending_pool::{EmitBorrowEvents, LendingPoolError},
};
use pendzl::{
    contracts::access::access_control::AccessControlError,
    traits::{AccountId, Balance, StorageFieldGetter},
};

use ink::prelude::*;

use super::{internal::AssetPrices, storage::LendingPoolStorage};

pub trait LendingPoolVTokenInterfaceImpl:
    StorageFieldGetter<LendingPoolStorage> + EmitBorrowEvents
{
    fn total_debt_of(&self, underlying_asset: AccountId) -> Balance {
        let timestamp = Self::env().block_timestamp();
        self.data::<LendingPoolStorage>()
            .total_debt_of(&underlying_asset, &timestamp)
            .unwrap()
    }

    fn user_debt_of(
        &self,
        underlying_asset: AccountId,
        user: AccountId,
    ) -> Balance {
        let timestamp = Self::env().block_timestamp();
        self.data::<LendingPoolStorage>()
            .user_debt_of(&underlying_asset, &user, &timestamp)
            .unwrap()
    }

    fn transfer_debt_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolError> {
        // pull reserve_data
        let reserve_abacus_tokens_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(&underlying_asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        if Self::env().caller() != reserve_abacus_tokens_tokens.v_token_address
        {
            return Err((AccessControlError::MissingRole).into());
        }

        let timestamp = Self::env().block_timestamp();

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

        // check if there ie enought collateral
        let all_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();
        let prices_e18 = self._get_assets_prices_e18(all_assets)?;
        self.data::<LendingPoolStorage>()
            .check_lending_power(&to, &prices_e18)?;

        //// ABACUS TOKEN EVENTS
        // AToken interests
        if from_accumulated_deposit_interest != 0
            || to_accumulated_deposit_interest != 0
        {
            let mut abacus_token_contract: AbacusTokenRef =
                reserve_abacus_tokens_tokens.a_token_address.into();

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
