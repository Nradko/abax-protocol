use crate::{
    impls::{
        constants::E6_U128,
        lending_pool::{
            internal::Transfer,
            manage::FLASH_BORROWER,
            storage::{
                lending_pool_storage::LendingPoolStorage,
                structs::reserve_data::{ReserveData, ReserveIndexes},
            },
        },
    },
    traits::{
        flash_loan_receiver::FlashLoanReceiverRef,
        lending_pool::{errors::LendingPoolError, events::EmitFlashEvents},
    },
};
use ink::{
    env::CallFlags,
    prelude::{vec, vec::Vec},
};

use openbrush::{
    contracts::access_control::*,
    traits::{AccountId, Balance, Storage},
};

pub trait LendingPoolFlashImpl:
    Storage<LendingPoolStorage> + EmitFlashEvents + AccessControlImpl
{
    fn flash_loan(
        &mut self,
        receiver_address: AccountId,
        assets: Vec<AccountId>,
        amounts: Vec<Balance>,
        receiver_params: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        if !(assets.len() == amounts.len()) {
            return Err(
                LendingPoolError::FlashLoanAmountsAssetsInconsistentLengths,
            );
        }

        let mut reserve_data_vec: Vec<ReserveData> = vec![];
        let mut reserve_indexes_vec: Vec<ReserveIndexes> = vec![];
        let mut fees: Vec<u128> = vec![];

        for i in 0..assets.len() {
            let asset_id = self
                .data::<LendingPoolStorage>()
                .asset_to_id
                .get(&assets[i])
                .ok_or(LendingPoolError::AssetNotRegistered)?;
            reserve_data_vec.push(
                self.data::<LendingPoolStorage>()
                    .reserve_datas
                    .get(&asset_id)
                    .unwrap(),
            );
            reserve_indexes_vec.push(
                self.data::<LendingPoolStorage>()
                    .reserve_indexes
                    .get(&asset_id)
                    .unwrap(),
            );
            let fee = match self
                .has_role(FLASH_BORROWER, Self::env().caller().into())
            {
                false => {
                    amounts[i]
                        * reserve_data_vec[i].parameters.flash_loan_fee_e6
                        / E6_U128
                }
                true => {
                    amounts[i]
                        * reserve_data_vec[i].parameters.flash_loan_fee_e6
                        / E6_U128
                        / 10
                }
            };
            fees.push(fee);
            self._transfer_out(&assets[i], &receiver_address, &amounts[i])?;
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

        for i in 0..assets.len() {
            self._transfer_in(
                &assets[i],
                &receiver_address,
                &amounts[i].checked_add(fees[i]).unwrap(),
            )?;

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
