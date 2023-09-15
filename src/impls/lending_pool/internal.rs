use openbrush::{
    contracts::psp22::{PSP22Error, PSP22Ref},
    traits::{Balance, Storage, Timestamp},
};

use crate::{
    impls::lending_pool::storage::lending_pool_storage::LendingPoolStorage,
    traits::{
        abacus_token::traits::abacus_token::*,
        block_timestamp_provider::{
            BlockTimestampProviderInterface, BlockTimestampProviderRef,
        },
        lending_pool::errors::LendingPoolError,
    },
};
use ink::{
    prelude::{vec::Vec, *},
    primitives::AccountId,
};

pub fn _check_amount_not_zero(amount: u128) -> Result<(), LendingPoolError> {
    if amount == 0 {
        return Err(LendingPoolError::AmountNotGreaterThanZero);
    }
    Ok(())
}
pub fn _emit_abacus_token_transfer_event(
    abacus_token: &AccountId,
    user: &AccountId,
    amount_transferred: i128,
) -> Result<(), PSP22Error> {
    let mut abacus_token_contract: AbacusTokenRef = (*abacus_token).into();
    if amount_transferred > 0 {
        abacus_token_contract.emit_transfer_events(vec![TransferEventData {
            from: None,
            to: Some(*user),
            amount: amount_transferred as u128,
        }])
    } else if amount_transferred < 0 {
        abacus_token_contract.emit_transfer_events(vec![TransferEventData {
            from: Some(*user),
            to: None,
            amount: (-amount_transferred) as u128,
        }])
    } else {
        Ok(())
    }
}

pub struct TransferEventDataSimplified {
    pub user: AccountId,
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
                to: Some(event.user),
                amount: event.amount as u128,
            })
        } else {
            events.push(TransferEventData {
                from: Some(event.user),
                to: None,
                amount: (-event.amount) as u128,
            })
        }
    }
    let mut abacus_token_contract: AbacusTokenRef = (*abacus_token).into();

    abacus_token_contract.emit_transfer_events(events)
}

pub fn _emit_abacus_token_transfer_event_and_decrease_allowance(
    abacus_token: &AccountId,
    user: &AccountId,
    amount_transferred: i128,
    spender: &AccountId,
    decrease_alowance_by: Balance,
) -> Result<(), PSP22Error> {
    if *spender == *user {
        _emit_abacus_token_transfer_event(
            abacus_token,
            user,
            amount_transferred,
        )
    } else {
        let event: TransferEventData;
        if amount_transferred > 0 {
            event = TransferEventData {
                from: None,
                to: Some(*user),
                amount: amount_transferred as u128,
            }
        } else {
            event = TransferEventData {
                from: Some(*user),
                to: None,
                amount: amount_transferred as u128,
            }
        }
        let mut abacus_token_contract: AbacusTokenRef = (*abacus_token).into();

        abacus_token_contract.emit_transfer_event_and_decrease_allowance(
            event,
            *user,
            *spender,
            decrease_alowance_by,
        )
    }
}

pub trait TimestampMock {
    fn _timestamp(&self) -> Timestamp;
}

impl<T: Storage<LendingPoolStorage>> TimestampMock for T {
    fn _timestamp(&self) -> Timestamp {
        let provider: BlockTimestampProviderRef = (self
            .data::<LendingPoolStorage>()
            .block_timestamp_provider
            .get()
            .unwrap())
        .into();

        provider.get_block_timestamp()
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

impl<T: Storage<LendingPoolStorage>> Transfer for T {
    fn _transfer_in(
        &self,
        asset: &AccountId,
        from: &AccountId,
        amount: &Balance,
    ) -> Result<(), LendingPoolError> {
        PSP22Ref::transfer_from(
            asset,
            *from,
            Self::env().account_id(),
            *amount,
            Vec::<u8>::new(),
        )?;
        Ok(())
    }

    /// Transfers `want` tokens from self to `account`.
    fn _transfer_out(
        &self,
        asset: &AccountId,
        to: &AccountId,
        amount: &Balance,
    ) -> Result<(), LendingPoolError> {
        PSP22Ref::transfer(asset, *to, *amount, vec![])?;
        Ok(())
    }
}

pub trait InternalIncome {
    fn _get_protocol_income(
        &self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError>;
}

impl<T: Storage<LendingPoolStorage>> InternalIncome for T {
    fn _get_protocol_income(
        &self,
        assets: &[AccountId],
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError> {
        let mut result: Vec<(AccountId, i128)> = vec![];
        let timestamp = self._timestamp();
        for asset in assets.iter() {
            let total_deposit = self
                .data::<LendingPoolStorage>()
                .total_deposit_of(&asset, &timestamp)?;
            let total_debt = self
                .data::<LendingPoolStorage>()
                .total_debt_of(&asset, &timestamp)?;
            let balance = PSP22Ref::balance_of(asset, Self::env().account_id());
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
