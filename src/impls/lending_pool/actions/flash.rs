// TODO::think should we emit events on set_as_collateral

#![allow(unused_variables)]
use crate::{
    impls::{
        constants::{
            E6,
            MATH_ERROR_MESSAGE,
        },
        lending_pool::{
            manage::FLASH_BORROWER,
            storage::{
                lending_pool_storage::LendingPoolStorage,
                structs::reserve_data::ReserveData,
            },
        },
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        flash_loan_receiver::FlashLoanReceiverRef,
        lending_pool::{
            errors::LendingPoolError,
            events::*,
            traits::actions::LendingPoolFlash,
        },
    },
};
use checked_math::checked_math;
use ink::{
    env::CallFlags,
    prelude::{
        vec,
        vec::Vec,
    },
};

use openbrush::{
    contracts::{
        access_control::*,
        traits::psp22::PSP22Ref,
    },
    traits::{
        AccountId,
        Balance,
        Storage,
    },
};
impl<T: Storage<LendingPoolStorage> + Storage<access_control::Data> + EmitFlashEvents> LendingPoolFlash for T {
    default fn flash_loan(
        &mut self,
        receiver_address: AccountId,
        assets: Vec<AccountId>,
        amounts: Vec<Balance>,
        receiver_params: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        if !(assets.len() == amounts.len()) {
            return Err(LendingPoolError::FlashLoanAmountsAssetsInconsistentLengths)
        }

        let mut reserve_data_vec: Vec<ReserveData> = vec![];
        let mut fees: Vec<u128> = vec![];

        for i in 0..assets.len() {
            reserve_data_vec.push(
                self.data::<LendingPoolStorage>()
                    .get_reserve_data(&assets[i])
                    .ok_or(LendingPoolError::AssetNotRegistered)?,
            );
            let fee = match self
                .data::<access_control::Data>()
                .has_role(FLASH_BORROWER, Self::env().caller())
            {
                false => amounts[i] * reserve_data_vec[i].flash_loan_fee_e6 / E6,
                true => amounts[i] * reserve_data_vec[i].flash_loan_fee_e6 / E6 / 10,
            };
            fees.push(fee);
            PSP22Ref::transfer_builder(&assets[i], receiver_address, amounts[i], Vec::<u8>::new())
                .call_flags(CallFlags::default().set_allow_reentry(true))
                .try_invoke()
                .unwrap()??;
            let receiver_balance = PSP22Ref::balance_of(&assets[i], receiver_address);
        }

        FlashLoanReceiverRef::execute_operation_builder(
            &receiver_address,
            assets.clone(),
            amounts.clone(),
            fees.clone(),
            receiver_params,
        )
        .call_flags(CallFlags::default().set_allow_reentry(true))
        .try_invoke()
        .unwrap()??;

        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);

        for i in 0..assets.len() {
            reserve_data_vec[i]._accumulate_interest(block_timestamp);
            let income_for_suppliers = fees[i] * reserve_data_vec[i].income_for_suppliers_part_e6 / E6;
            reserve_data_vec[i].cumulative_supply_rate_index_e18 = u128::try_from(
                checked_math!(
                    reserve_data_vec[i].cumulative_supply_rate_index_e18
                        * (reserve_data_vec[i].total_supplied + income_for_suppliers)
                        / reserve_data_vec[i].total_supplied
                )
                .unwrap(),
            )
            .expect(MATH_ERROR_MESSAGE);
            reserve_data_vec[i].total_supplied = reserve_data_vec[i]
                .total_supplied
                .checked_add(fees[i])
                .expect(MATH_ERROR_MESSAGE);

            reserve_data_vec[i]._recalculate_current_rates();

            self.data::<LendingPoolStorage>()
                .insert_reserve_data(&assets[i], &reserve_data_vec[i]);
            PSP22Ref::transfer_from_builder(
                &assets[i],
                receiver_address,
                Self::env().account_id(),
                amounts[i].checked_add(fees[i]).expect(MATH_ERROR_MESSAGE),
                Vec::<u8>::new(),
            )
            .call_flags(ink::env::CallFlags::default().set_allow_reentry(true))
            .try_invoke()
            .unwrap()??;

            self._emit_flash_loan_event(
                receiver_address,
                Self::env().account_id(),
                assets[i],
                amounts[i],
                fees[i],
            );
        }
        Ok(())
    }
}
