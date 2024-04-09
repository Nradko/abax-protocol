use crate::fee_reduction::FeeReduction;
use crate::{
    fee_reduction::FeeReductionRef,
    flash_loan_receiver::FlashLoanReceiverError,
    lending_pool::{events::FlashLoan, LendingPoolError},
};

use abax_library::math::{E6_U128, E6_U32};
use ink::{
    env::{
        call::{build_call, ExecutionInput},
        CallFlags, DefaultEnvironment,
    },
    prelude::{vec, vec::Vec},
};

use pendzl::math::operations::{mul_div, Rounding};
use pendzl::{
    contracts::access_control,
    traits::{AccountId, Balance, StorageFieldGetter},
};

use super::{
    internal::{Transfer, _check_amount_not_zero},
    storage::LendingPoolStorage,
};

pub trait LendingPoolFlashImpl:
    StorageFieldGetter<LendingPoolStorage> + access_control::AccessControlInternal
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

        let fee_reduction_e6 = {
            if let Some(free_provider_account) = self
                .data::<LendingPoolStorage>()
                .fee_reduction_provider
                .get()
            {
                let free_provider: FeeReductionRef =
                    free_provider_account.into();
                free_provider.get_flash_loan_fee_reduction(Self::env().caller())
            } else {
                0
            }
        };
        let fee_part_e6 = E6_U32.saturating_sub(fee_reduction_e6);

        for i in 0..assets.len() {
            _check_amount_not_zero(amounts[i])?;

            let pre_fee =
                mul_div(amounts[i], flash_fee_e6, E6_U128, Rounding::Up)?;
            let fee =
                mul_div(pre_fee, fee_part_e6 as u128, E6_U128, Rounding::Up)?;

            ink::env::debug_println!("flash_fee: {:?}, fee_reduction_e6: {:?}, fee_part_e6: {:?}, pre_fee: {:?}, fee: {:?}", flash_fee_e6, fee_reduction_e6, fee_part_e6, pre_fee, fee);

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

            ink::env::emit_event::<DefaultEnvironment, FlashLoan>(FlashLoan {
                receiver,
                caller: Self::env().account_id(),
                asset: assets[i],
                amount: amounts[i],
                fee: fees[i],
            });
        }
        Ok(())
    }
}
