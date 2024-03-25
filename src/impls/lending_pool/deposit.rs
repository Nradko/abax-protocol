use abax_traits::lending_pool::{
    EmitDepositEvents, LendingPoolError, MathError,
};
use ink::prelude::{vec, vec::Vec};
use pendzl::traits::{AccountId, Balance, StorageFieldGetter};

use abax_library::structs::{Action, Operation, OperationArgs};

use super::{
    internal::{
        Transfer, _check_amount_not_zero, _emit_abacus_token_transfer_event,
        _emit_abacus_token_transfer_event_and_decrease_allowance,
    },
    storage::LendingPoolStorage,
};

pub trait LendingPoolDepositImpl:
    StorageFieldGetter<LendingPoolStorage> + Transfer + EmitDepositEvents
{
    fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        _check_amount_not_zero(amount)?;

        let mut actions = vec![Action {
            op: Operation::Deposit,
            args: OperationArgs { asset, amount },
        }];
        let res = self
            .data::<LendingPoolStorage>()
            .account_for_account_actions(&on_behalf_of, &mut actions)?;
        let (user_accumulated_deposit_interest, user_accumulated_debt_interest) =
            res.first().unwrap();
        //// TOKEN TRANSFERS
        self._transfer_in(
            &asset,
            &Self::env().caller(),
            &actions[0].args.amount,
        )?;
        //// ABACUS TOKEN EVENTS
        let abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(asset)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.a_token_address,
            &on_behalf_of,
            (user_accumulated_deposit_interest
                .checked_add(amount)
                .ok_or(MathError::Overflow)?) as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            *user_accumulated_debt_interest as i128,
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

    fn withdraw(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        _check_amount_not_zero(amount)?;

        let mut actions = vec![Action {
            op: Operation::Withdraw,
            args: OperationArgs { asset, amount },
        }];
        let res = self
            .data::<LendingPoolStorage>()
            .account_for_account_actions(&on_behalf_of, &mut actions)?;
        let (user_accumulated_deposit_interest, user_accumulated_debt_interest) =
            res.first().unwrap();

        //// TOKEN TRANSFERS
        self._transfer_out(
            &asset,
            &Self::env().caller(),
            &actions[0].args.amount,
        )?;

        //// ABACUS TOKEN EVENTS
        let abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(asset)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event_and_decrease_allowance(
            &abacus_tokens.a_token_address,
            &on_behalf_of,
            (*user_accumulated_deposit_interest as i128)
                .overflowing_sub(actions[0].args.amount as i128)
                .0,
            &(Self::env().caller()),
            actions[0].args.amount,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            *user_accumulated_debt_interest as i128,
        )?;

        //// EVENT
        self._emit_withdraw_event(
            asset,
            Self::env().caller(),
            on_behalf_of,
            actions[0].args.amount,
        );

        Ok(actions[0].args.amount)
    }
}
