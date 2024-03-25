use abax_library::structs::{Action, Operation, ReserveAbacusTokens};
use abax_traits::lending_pool::{
    EmitBorrowEvents, EmitDepositEvents, LendingPoolError, MathError,
};
use ink::{prelude::vec::Vec, primitives::AccountId, storage::Mapping};
use pendzl::traits::StorageFieldGetter;

use super::{
    internal::{
        Transfer, _emit_abacus_token_transfer_event,
        _emit_abacus_token_transfer_event_and_decrease_allowance,
    },
    storage::LendingPoolStorage,
};

pub trait LendingPoolMultiOpImpl:
    StorageFieldGetter<LendingPoolStorage>
    + Transfer
    + EmitDepositEvents
    + EmitBorrowEvents
{
    fn multi_op(
        &mut self,
        op: Vec<Action>,
        on_behalf_of: AccountId,
        _data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        let mut actions = op.clone();
        let act_slice = actions.as_mut_slice();
        let res = self
            .data()
            .account_for_account_actions(&on_behalf_of, act_slice)?;
        let caller = Self::env().caller();

        let mut abacus_tokens =
            Mapping::<AccountId, ReserveAbacusTokens>::new();

        for (
            i,
            (user_accumulated_deposit_interest, user_accumulated_debt_interest),
        ) in res.iter().enumerate()
        {
            let asset = actions[i].args.asset;
            let amount = actions[i].args.amount;
            let op = actions[i].op;
            let abacus_tokens = abacus_tokens
                .get(asset)
                .or_else(|| {
                    let present = self
                        .data::<LendingPoolStorage>()
                        .reserve_abacus_tokens
                        .get(asset)
                        .unwrap();
                    abacus_tokens.insert(asset, &present);
                    Some(present)
                })
                .unwrap();

            match op {
                Operation::Deposit => {
                    self._transfer_in(&asset, &caller, &amount)?;
                    // ATOKEN
                    _emit_abacus_token_transfer_event(
                        &abacus_tokens.a_token_address,
                        &on_behalf_of,
                        (user_accumulated_deposit_interest
                            .checked_add(amount)
                            .ok_or(MathError::Overflow)?)
                            as i128,
                    )?;
                    // VTOKEN
                    _emit_abacus_token_transfer_event(
                        &abacus_tokens.v_token_address,
                        &on_behalf_of,
                        *user_accumulated_debt_interest as i128,
                    )?;
                    self._emit_deposit_event(
                        asset,
                        caller,
                        on_behalf_of,
                        amount,
                    );
                }
                Operation::Withdraw => {
                    self._transfer_out(&asset, &caller, &amount)?;
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
                    self._emit_withdraw_event(
                        asset,
                        caller,
                        on_behalf_of,
                        amount,
                    );
                }
                Operation::Borrow => {
                    self._transfer_out(&asset, &caller, &amount)?;
                    // ATOKEN
                    _emit_abacus_token_transfer_event(
                        &abacus_tokens.a_token_address,
                        &on_behalf_of,
                        *user_accumulated_deposit_interest as i128,
                    )?;
                    // VTOKEN
                    _emit_abacus_token_transfer_event_and_decrease_allowance(
                        &abacus_tokens.v_token_address,
                        &on_behalf_of,
                        (user_accumulated_debt_interest
                            .checked_add(amount)
                            .ok_or(MathError::Overflow)?)
                            as i128,
                        &(caller),
                        amount,
                    )?;
                    self._emit_borrow_variable_event(
                        asset,
                        caller,
                        on_behalf_of,
                        amount,
                    )
                }
                Operation::Repay => {
                    self._transfer_in(&asset, &caller, &amount)?;
                    _emit_abacus_token_transfer_event(
                        &abacus_tokens.a_token_address,
                        &on_behalf_of,
                        *user_accumulated_deposit_interest as i128,
                    )?;
                    // VTOKEN
                    _emit_abacus_token_transfer_event(
                        &abacus_tokens.v_token_address,
                        &on_behalf_of,
                        (*user_accumulated_debt_interest as i128)
                            .overflowing_sub(actions[0].args.amount as i128)
                            .0,
                    )?;

                    self._emit_repay_variable_event(
                        asset,
                        caller,
                        on_behalf_of,
                        amount,
                    );
                }
            }
        }

        Ok(())
    }
}
