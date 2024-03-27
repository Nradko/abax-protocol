use crate::{
    abacus_token::{AbacusToken, AbacusTokenRef, TransferEventData},
    lending_pool::{
        events::{Borrow, Repay},
        LendingPoolError,
    },
};
use pendzl::{
    contracts::access_control::AccessControlError,
    traits::{AccountId, Balance, StorageFieldGetter},
};

use ink::{env::DefaultEnvironment, prelude::*};

use super::storage::LendingPoolStorage;

pub trait LendingPoolVTokenInterfaceImpl:
    StorageFieldGetter<LendingPoolStorage>
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
            .get(underlying_asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        if Self::env().caller() != reserve_abacus_tokens_tokens.v_token_address
        {
            return Err((AccessControlError::MissingRole).into());
        }

        let timestamp = Self::env().block_timestamp();

        let (
            (from_accumulated_deposit_interest, from_accumulated_debt_interest),
            (to_accumulated_deposit_interest, to_accumulated_debt_interest),
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
        self.data::<LendingPoolStorage>()
            .ensure_collateralized_by_account(&to)?;

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

        ink::env::emit_event::<DefaultEnvironment, Repay>(Repay {
            asset: underlying_asset,
            caller: Self::env().caller(),
            on_behalf_of: from,
            amount,
        });
        ink::env::emit_event::<DefaultEnvironment, Borrow>(Borrow {
            asset: underlying_asset,
            caller: Self::env().caller(),
            on_behalf_of: to,
            amount,
        });

        Ok((from_accumulated_debt_interest, to_accumulated_debt_interest))
    }
}
