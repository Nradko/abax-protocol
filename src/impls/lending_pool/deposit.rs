use abax_traits::lending_pool::{
    EmitDepositEvents, LendingPoolDepositInternal, LendingPoolError, MathError,
};
use ink::prelude::vec::Vec;
use pendzl::traits::{AccountId, Balance, StorageFieldGetter};

use super::{
    internal::{
        LendingPowerChecker, Transfer, _check_amount_not_zero,
        _emit_abacus_token_transfer_event,
        _emit_abacus_token_transfer_event_and_decrease_allowance,
    },
    storage::LendingPoolStorage,
};

pub trait LendingPoolDepositInternalImpl:
    StorageFieldGetter<LendingPoolStorage> + Transfer + EmitDepositEvents
{
    fn _deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        _check_amount_not_zero(amount)?;

        let block_timestamp = Self::env().block_timestamp();

        let (user_accumulated_deposit_interest, user_accumulated_debt_interest) =
            self.data::<LendingPoolStorage>().account_for_deposit(
                &asset,
                &on_behalf_of,
                &amount,
                &block_timestamp,
            )?;

        //// TOKEN TRANSFERS
        self._transfer_in(&asset, &Self::env().caller(), &amount)?;
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
            user_accumulated_debt_interest as i128,
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

    fn _redeem(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        mut amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(Balance, bool), LendingPoolError> {
        _check_amount_not_zero(amount)?;

        let block_timestamp = Self::env().block_timestamp();

        let asset_id =
            self.data::<LendingPoolStorage>().asset_id(&asset).unwrap();
        let reserve_data_before = self
            .data::<LendingPoolStorage>()
            .reserve_datas
            .get(asset_id)
            .unwrap();
        let user_reserve_data_before = self
            .data::<LendingPoolStorage>()
            .get_user_reserve_data(asset_id, &on_behalf_of)
            .unwrap();

        let (
            user_accumulated_deposit_interest,
            user_accumulated_debt_interest,
            was_asset_a_collateral,
        ) = self.data::<LendingPoolStorage>().account_for_withdraw(
            &asset,
            &on_behalf_of,
            &mut amount,
            &block_timestamp,
        )?;

        let reserve_data_after = self
            .data::<LendingPoolStorage>()
            .reserve_datas
            .get(asset_id)
            .unwrap();
        let user_reserve_data_after = self
            .data::<LendingPoolStorage>()
            .get_user_reserve_data(asset_id, &on_behalf_of)
            .unwrap();

        ink::env::debug_println!(
            "reserve_data_before: {:?}",
            reserve_data_before
        );
        ink::env::debug_println!(
            "reserve_data_after: {:?}",
            reserve_data_after
        );

        ink::env::debug_println!(
            "user_reserve_data_before: {:?}",
            user_reserve_data_before
        );
        ink::env::debug_println!(
            "user_reserve_data_after: {:?}",
            user_reserve_data_after
        );

        //// TOKEN TRANSFERS
        self._transfer_out(&asset, &Self::env().caller(), &amount)?;

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
            (user_accumulated_deposit_interest as i128)
                .overflowing_sub(amount as i128)
                .0,
            &(Self::env().caller()),
            amount,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            user_accumulated_debt_interest as i128,
        )?;

        //// EVENT
        self._emit_redeem_event(
            asset,
            Self::env().caller(),
            on_behalf_of,
            amount,
        );

        Ok((amount, was_asset_a_collateral))
    }
}
pub trait LendingPoolDepositImpl:
    StorageFieldGetter<LendingPoolStorage>
    + LendingPoolDepositInternal
    + LendingPowerChecker
{
    fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        self._deposit(asset, on_behalf_of, amount, data)?;
        Ok(())
    }
    fn redeem(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        let (amount, was_asset_a_collateral) =
            self._redeem(asset, on_behalf_of, amount, data)?;

        // check if there is enought collateral
        if was_asset_a_collateral {
            self._ensure_is_collateralized(&on_behalf_of)?;
        }
        Ok(amount)
    }
}
