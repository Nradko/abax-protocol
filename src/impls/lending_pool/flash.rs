use abax_library::math::E6_U128;
use abax_traits::{
    flash_loan_receiver::FlashLoanReceiverError,
    lending_pool::{EmitFlashEvents, LendingPoolError, FLASH_BORROWER},
};
use ink::{
    env::{
        call::{build_call, ExecutionInput},
        CallFlags, DefaultEnvironment,
    },
    prelude::{vec, vec::Vec},
};

use pendzl::{
    contracts::access::access_control,
    traits::{AccountId, Balance, StorageFieldGetter},
};

use super::{
    internal::{Transfer, _check_amount_not_zero},
    storage::LendingPoolStorage,
};

pub trait LendingPoolFlashImpl:
    StorageFieldGetter<LendingPoolStorage>
    + EmitFlashEvents
    + access_control::AccessControlInternal
{
    fn flash_loan(
        &mut self,
        receiver: AccountId,
        assets: Vec<AccountId>,
        amounts: Vec<Balance>,
        receiver_params: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        if assets.len() != amounts.len() {
            return Err(
                LendingPoolError::FlashLoanAmountsAssetsInconsistentLengths,
            );
        }

        let mut fees: Vec<u128> = vec![];
        let flash_fee_e6 = self
            .data::<LendingPoolStorage>()
            .flash_loan_fee_e6
            .get()
            .unwrap();

        for i in 0..assets.len() {
            _check_amount_not_zero(amounts[i])?;
            let fee = match self
                ._has_role(FLASH_BORROWER, Some(Self::env().caller()))
            {
                false => amounts[i] * flash_fee_e6 / E6_U128,
                true => amounts[i] * flash_fee_e6 / E6_U128 / 10,
            };
            fees.push(fee);
            self._transfer_out(&assets[i], &receiver, &amounts[i])?;
        }

        build_call::<DefaultEnvironment>()
            .call(receiver)
            .call_flags(CallFlags::ALLOW_REENTRY)
            .exec_input(
                ExecutionInput::new(ink::env::call::Selector::new(
                    ink::selector_bytes!(
                        "FlashLoanReceiver::execute_operation"
                    ),
                ))
                .push_arg(assets.clone())
                .push_arg(amounts.clone())
                .push_arg(fees.clone())
                .push_arg(receiver_params),
            )
            .returns::<Result<(), FlashLoanReceiverError>>()
            .try_invoke()
            .unwrap()
            .unwrap()?;

        for i in 0..assets.len() {
            self._transfer_in(
                &assets[i],
                &receiver,
                &amounts[i].checked_add(fees[i]).unwrap(),
            )?;

            self._emit_flash_loan_event(
                receiver,
                Self::env().account_id(),
                assets[i],
                amounts[i],
                fees[i],
            );
        }
        Ok(())
    }
}
