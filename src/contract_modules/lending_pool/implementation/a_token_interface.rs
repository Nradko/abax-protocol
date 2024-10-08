// SPDX-License-Identifier: BUSL-1.1
use super::{_check_amount_not_zero, storage::LendingPoolStorage};
use crate::{
    abacus_token::{AbacusToken, AbacusTokenRef, TransferEventData},
    lending_pool::{
        events::{Deposit, Withdraw},
        LendingPoolError,
    },
};
use ink::codegen::TraitCallBuilder;
use ink::{env::DefaultEnvironment, prelude::*};
use pendzl::{
    contracts::access_control::AccessControlError,
    traits::{AccountId, Balance, StorageFieldGetter},
};

pub trait LendingPoolATokenInterfaceImpl:
    StorageFieldGetter<LendingPoolStorage>
{
    fn total_deposit_of(&self, underlying_asset: AccountId) -> Balance {
        let timestamp = Self::env().block_timestamp();
        self.data::<LendingPoolStorage>()
            .total_deposit_of(&underlying_asset, &timestamp)
            .unwrap()
    }

    fn account_deposit_of(
        &self,
        underlying_asset: AccountId,
        account: AccountId,
    ) -> Balance {
        let timestamp = Self::env().block_timestamp();
        self.data::<LendingPoolStorage>()
            .account_deposit_of(&underlying_asset, &account, &timestamp)
            .unwrap()
    }

    fn transfer_deposit_from_to(
        &mut self,
        underlying_asset: AccountId,
        from: AccountId,
        to: AccountId,
        amount: Balance,
    ) -> Result<(Balance, Balance), LendingPoolError> {
        _check_amount_not_zero(amount)?;

        let reserve_abacus_tokens_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(underlying_asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        if Self::env().caller() != reserve_abacus_tokens_tokens.a_token_address
        {
            return Err((AccessControlError::MissingRole).into());
        }

        let timestamp = Self::env().block_timestamp();
        let (
            (from_accumulated_deposit_interest, from_accumulated_debt_interest),
            (to_accumulated_deposit_interest, to_accumulated_debt_interest),
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
            .ensure_collateralized_by_account(&from)?;

        //// ABACUS TOKEN EVENTS
        // AToken interests are returned.
        // VToken intersts
        if from_accumulated_debt_interest != 0
            || to_accumulated_debt_interest != 0
        {
            let mut abacus_token_contract: AbacusTokenRef =
                reserve_abacus_tokens_tokens.v_token_address.into();

            abacus_token_contract
                .call_mut()
                .emit_transfer_events(vec![
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
                ])
                .call_v1()
                .invoke()?;
        }

        //// EVENT
        ink::env::emit_event::<DefaultEnvironment, Deposit>(Deposit {
            asset: underlying_asset,
            caller: Self::env().caller(),
            on_behalf_of: to,
            amount,
        });
        ink::env::emit_event::<DefaultEnvironment, Withdraw>(Withdraw {
            asset: underlying_asset,
            caller: Self::env().caller(),
            on_behalf_of: from,
            amount,
        });

        Ok((
            from_accumulated_deposit_interest,
            to_accumulated_deposit_interest,
        ))
    }
}
