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
        Ordering::Greater => abacus_token_contract.emit_transfer_events(vec![
            TransferEventData {
                from: None,
                to: Some(*account),
                amount: u128::try_from(amount_transferred).unwrap(), // Ordering::Greater => amount is greater than zero
            },
        ]),
        Ordering::Less => abacus_token_contract.emit_transfer_events(vec![
            TransferEventData {
                from: Some(*account),
                to: None,
                amount: u128::try_from(amount_transferred.neg()).unwrap(), // Ordering::Less => amount is less than zero => neg() is positive
            },
        ]),
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

    abacus_token_contract.emit_transfer_events(events)
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

        abacus_token_contract.emit_transfer_event_and_decrease_allowance(
            event,
            *account,
            *spender,
            decrease_alowance_by,
        )
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
            psp22.transfer_from(
                *from,
                Self::env().account_id(),
                *amount,
                Vec::<u8>::new(),
            )?;
        } else {
            let mut psp22: PSP22BurnableRef = (*asset).into();
            psp22.burn(*from, *amount)?
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
            psp22.transfer(*to, *amount, vec![])?;
        } else {
            let mut psp22: PSP22MintableRef = (*asset).into();
            psp22.mint(*to, *amount)?
        }
        Ok(())
    }
}

pub trait InternalIncome {
    fn _get_protocol_income(
        &self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError>;
}

impl<T: StorageFieldGetter<LendingPoolStorage>> InternalIncome for T {
    fn _get_protocol_income(
        &self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError> {
        let mut result: Vec<(AccountId, i128)> = vec![];
        let timestamp = Self::env().block_timestamp();
        for asset in assets.iter() {
            let total_deposit = self
                .data::<LendingPoolStorage>()
                .total_deposit_of(asset, &timestamp)?;
            let total_debt = self
                .data::<LendingPoolStorage>()
                .total_debt_of(asset, &timestamp)?;
            let psp22: PSP22Ref = (*asset).into();
            let balance = psp22.balance_of(Self::env().account_id());
            let income = {
                (balance as i128)
                    .checked_add(total_debt as i128)
                    .unwrap()
                    .checked_sub(total_deposit as i128)
                    .unwrap()
            };
            result.push((*asset, income));
        }
        Ok(result)
    }
}