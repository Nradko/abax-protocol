// SPDX-License-Identifier: BUSL-1.1
use core::{cmp::Ordering, ops::Neg};

use crate::{
    abacus_token::{AbacusToken, AbacusTokenRef, TransferEventData},
    lending_pool::LendingPoolError,
};
use ink::{
    prelude::{vec::Vec, *},
    primitives::AccountId,
};

use pendzl::{
    contracts::psp22::{
        burnable::{PSP22Burnable, PSP22BurnableRef},
        mintable::{PSP22Mintable, PSP22MintableRef},
        PSP22Error, PSP22Ref, PSP22,
    },
    traits::{Balance, StorageFieldGetter},
};

use super::storage::LendingPoolStorage;
use ink::codegen::TraitCallBuilder;

pub fn _check_amount_not_zero(amount: u128) -> Result<(), LendingPoolError> {
    if amount == 0 {
        return Err(LendingPoolError::AmountNotGreaterThanZero);
    }
    Ok(())
}
pub fn _emit_abacus_token_transfer_event(
    abacus_token: &AccountId,
    account: &AccountId,
    amount_transferred: i128,
) -> Result<(), PSP22Error> {
    let mut abacus_token_contract: AbacusTokenRef = (*abacus_token).into();
    match amount_transferred.cmp(&0) {
        Ordering::Greater => abacus_token_contract
            .call_mut()
            .emit_transfer_events(vec![TransferEventData {
                from: None,
                to: Some(*account),
                amount: u128::try_from(amount_transferred).unwrap(), // Ordering::Greater => amount is greater than zero
            }])
            .call_v1()
            .invoke(),
        Ordering::Less => abacus_token_contract
            .call_mut()
            .emit_transfer_events(vec![TransferEventData {
                from: Some(*account),
                to: None,
                amount: u128::try_from(amount_transferred.neg()).unwrap(), // Ordering::Less => amount is less than zero => neg() is positive
            }])
            .call_v1()
            .invoke(),
        Ordering::Equal => Ok(()),
    }
}

pub struct TransferEventDataSimplified {
    pub account: AccountId,
    pub amount: i128,
}

pub fn _emit_abacus_token_transfer_events(
    abacus_token: &AccountId,
    data: &Vec<TransferEventDataSimplified>,
) -> Result<(), PSP22Error> {
    let mut events: Vec<TransferEventData> = vec![];
    for event in data {
        if event.amount > 0 {
            events.push(TransferEventData {
                from: None,
                to: Some(event.account),
                amount: event.amount as u128,
            })
        } else {
            events.push(TransferEventData {
                from: Some(event.account),
                to: None,
                amount: u128::try_from(event.amount.neg()).unwrap(), // event.amount is less than zero => neg() is positive
            })
        }
    }
    let mut abacus_token_contract: AbacusTokenRef = (*abacus_token).into();

    abacus_token_contract
        .call_mut()
        .emit_transfer_events(events)
        .call_v1()
        .invoke()
}

pub fn _emit_abacus_token_transfer_event_and_decrease_allowance(
    abacus_token: &AccountId,
    account: &AccountId,
    amount_transferred: i128,
    spender: &AccountId,
    decrease_alowance_by: Balance,
) -> Result<(), PSP22Error> {
    if *spender == *account {
        _emit_abacus_token_transfer_event(
            abacus_token,
            account,
            amount_transferred,
        )
    } else {
        let event = if amount_transferred > 0 {
            TransferEventData {
                from: None,
                to: Some(*account),
                amount: amount_transferred as u128,
            }
        } else {
            TransferEventData {
                from: Some(*account),
                to: None,
                amount: amount_transferred as u128,
            }
        };
        let mut abacus_token_contract: AbacusTokenRef = (*abacus_token).into();

        abacus_token_contract
            .call_mut()
            .emit_transfer_event_and_decrease_allowance(
                event,
                *account,
                *spender,
                decrease_alowance_by,
            )
            .call_v1()
            .invoke()
    }
}

pub trait Transfer {
    /// Transfers `want` tokens from `account` to self.
    fn _transfer_in(
        &self,
        asset: &AccountId,
        from: &AccountId,
        amount: &Balance,
    ) -> Result<(), LendingPoolError>;

    /// Transfers `want` tokens from self to `account`.
    fn _transfer_out(
        &self,
        asset: &AccountId,
        to: &AccountId,
        amount: &Balance,
    ) -> Result<(), LendingPoolError>;
}

impl<T: StorageFieldGetter<LendingPoolStorage>> Transfer for T {
    fn _transfer_in(
        &self,
        asset: &AccountId,
        from: &AccountId,
        amount: &Balance,
    ) -> Result<(), LendingPoolError> {
        if self
            .data()
            .interest_rate_model
            .contains(self.data().asset_id(asset)?)
        {
            let mut psp22: PSP22Ref = (*asset).into();
            psp22
                .call_mut()
                .transfer_from(
                    *from,
                    Self::env().account_id(),
                    *amount,
                    Vec::<u8>::new(),
                )
                .call_v1()
                .invoke()?;
        } else {
            let mut psp22: PSP22BurnableRef = (*asset).into();
            psp22.call_mut().burn(*from, *amount).call_v1().invoke()?
        }
        Ok(())
    }

    /// Transfers `want` tokens from self to `account`.
    fn _transfer_out(
        &self,
        asset: &AccountId,
        to: &AccountId,
        amount: &Balance,
    ) -> Result<(), LendingPoolError> {
        if self
            .data()
            .interest_rate_model
            .contains(self.data().asset_id(asset)?)
        {
            let mut psp22: PSP22Ref = (*asset).into();
            psp22
                .call_mut()
                .transfer(*to, *amount, vec![])
                .call_v1()
                .invoke()?;
        } else {
            let mut psp22: PSP22MintableRef = (*asset).into();
            psp22.call_mut().mint(*to, *amount).call_v1().invoke()?
        }
        Ok(())
    }
}

pub trait InternalIncome {
    fn _view_protocol_income(
        &self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, Balance)>, LendingPoolError>;

    fn _take_protocol_income(
        &mut self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, Balance)>, LendingPoolError>;
}

impl<T: StorageFieldGetter<LendingPoolStorage>> InternalIncome for T {
    fn _view_protocol_income(
        &self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, Balance)>, LendingPoolError> {
        let mut result: Vec<(AccountId, Balance)> = vec![];
        for asset in assets.iter() {
            let asset_id = self.data().asset_id(asset)?;
            let mut reserve_indexes_and_fees = self
                .data()
                .reserve_indexes_and_fees
                .get(asset_id)
                .ok_or(LendingPoolError::AssetNotRegistered)?;

            let income = reserve_indexes_and_fees.fees.take_earned_fee();

            result.push((*asset, income));
        }
        Ok(result)
    }
    fn _take_protocol_income(
        &mut self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, Balance)>, LendingPoolError> {
        let mut result: Vec<(AccountId, Balance)> = vec![];
        for asset in assets.iter() {
            let asset_id = self.data().asset_id(asset)?;
            let mut reserve_indexes_and_fees = self
                .data()
                .reserve_indexes_and_fees
                .get(asset_id)
                .ok_or(LendingPoolError::AssetNotRegistered)?;

            let income = reserve_indexes_and_fees.fees.take_earned_fee();

            self.data()
                .reserve_indexes_and_fees
                .insert(asset_id, &reserve_indexes_and_fees);

            result.push((*asset, income));
        }
        Ok(result)
    }
}
