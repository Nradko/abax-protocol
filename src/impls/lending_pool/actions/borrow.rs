use crate::{
    impls::{
        lending_pool::{
            internal::{
                Internal,
                *,
            },
            storage::{
                lending_pool_storage::LendingPoolStorage,
                structs::{
                    reserve_data::ReserveData,
                    user_config::UserConfig,
                    user_reserve_data::*,
                },
            },
        },
        types::Bitmap128,
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolError,
            events::*,
            traits::actions::LendingPoolBorrow,
        },
    },
};
use ink::prelude::vec::Vec;
use openbrush::{
    contracts::traits::psp22::*,
    traits::{
        AccountId,
        Balance,
        Storage,
    },
};

impl<T: Storage<LendingPoolStorage> + BorrowInternal + EmitBorrowEvents> LendingPoolBorrow for T {
    default fn set_as_collateral(
        &mut self,
        asset: AccountId,
        use_as_collateral_to_set: bool,
    ) -> Result<(), LendingPoolError> {
        //// PULL DATA AND INIT CONDITIONS CHECK
        let caller = Self::env().caller();
        let reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        let user_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &caller)
            .ok_or(LendingPoolError::InsufficientSupply)?;
        let mut user_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&caller)
            .ok_or(LendingPoolError::InsufficientSupply)?;
        _check_enough_supply_to_be_collateral(&reserve_data, &user_reserve_data)?;
        let collateral_coefficient_e6 = reserve_data.collateral_coefficient_e6;
        if use_as_collateral_to_set && collateral_coefficient_e6.is_none() {
            return Err(LendingPoolError::RuleCollateralDisable)
        }
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);

        //// MODIFY PULLED STORAGE
        let user_config_before: Bitmap128 = user_config.collaterals;
        if use_as_collateral_to_set {
            user_config.collaterals |= 1_u128 << reserve_data.id;
        } else {
            user_config.collaterals &= !(1_u128 << reserve_data.id);
        }

        if user_config_before != user_config.collaterals {
            //// PUSH STORAGE & FINAL CONDION CHECK
            self.data::<LendingPoolStorage>()
                .insert_user_config(&caller, &user_config);

            self._check_user_free_collateral(&caller, block_timestamp)?;

            self._emit_collateral_set_event(asset, caller, use_as_collateral_to_set);
        }

        Ok(())
    }

    default fn borrow(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        //// PULL DATA AND INIT CONDITIONS CHECK
        if amount == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero)
        }
        let (mut reserve_data, mut on_behalf_of_reserve_data, mut on_behalf_of_config) =
            self._pull_data_for_borrow(&asset, &on_behalf_of)?;
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        //// MODIFY PULLED STORAGE
        // accumulate
        let (interest_on_behalf_of_supply, interest_on_behalf_of_variable_borrow): (Balance, Balance) =
            _accumulate_interest(&mut reserve_data, &mut on_behalf_of_reserve_data, block_timestamp);
        // modify state
        _check_borrowing_enabled(&reserve_data)?;
        _change_state_borrow_variable(
            &mut reserve_data,
            &mut on_behalf_of_reserve_data,
            &mut on_behalf_of_config,
            amount,
        );
        _check_enough_variable_debt(&reserve_data, &on_behalf_of_reserve_data)?;
        //// ABACUS TOKEN EVENTS
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.a_token_address,
            &on_behalf_of,
            interest_on_behalf_of_supply as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event_and_decrease_allowance(
            &reserve_data.v_token_address,
            &on_behalf_of,
            (interest_on_behalf_of_variable_borrow + amount) as i128,
            &(Self::env().caller()),
            amount,
        )?;

        self._emit_borrow_variable_event(asset, Self::env().caller(), on_behalf_of, amount);

        if reserve_data.maximal_total_debt.is_some() {
            if reserve_data.total_variable_borrowed > reserve_data.maximal_total_debt.unwrap() {
                return Err(LendingPoolError::MaxDebtReached)
            }
        }

        // recalculate
        reserve_data._recalculate_current_rates();
        // PUSH DATA
        self._push_data(
            &asset,
            &on_behalf_of,
            &reserve_data,
            &on_behalf_of_reserve_data,
            &on_behalf_of_config,
        );
        // check if there ie enought collateral
        self._check_user_free_collateral(&on_behalf_of, block_timestamp)?;
        //// TOKEN TRANSFER
        PSP22Ref::transfer(&asset, Self::env().caller(), amount, Vec::<u8>::new())?;
        Ok(())
    }

    default fn repay(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Option<Balance>,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        //// PULL DATA AND INIT CONDITIONS CHECK
        let (mut reserve_data, mut on_behalf_of_reserve_data, mut on_behalf_of_config) =
            self._pull_data_for_repay(&asset, &on_behalf_of)?;
        _check_activeness(&reserve_data)?;
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        // MODIFY PULLED STORAGE & AMOUNT CHECKS
        // accumulate
        let (interest_on_behalf_of_supply, interest_on_behalf_of_variable_borrow): (Balance, Balance) =
            _accumulate_interest(&mut reserve_data, &mut on_behalf_of_reserve_data, block_timestamp);
        let amount_val: Balance;
        amount_val = _change_state_repay_variable(
            &mut reserve_data,
            &mut on_behalf_of_reserve_data,
            &mut on_behalf_of_config,
            amount,
        )?;
        if (on_behalf_of_config.borrows_variable >> reserve_data.id) & 1 == 1 {
            _check_enough_variable_debt(&reserve_data, &on_behalf_of_reserve_data)?;
        }
        //// ABACUS TOKEN EVENTS
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.a_token_address,
            &on_behalf_of,
            interest_on_behalf_of_supply as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.v_token_address,
            &on_behalf_of,
            interest_on_behalf_of_variable_borrow as i128 - amount_val as i128,
        )?;
        //// EVENT
        self._emit_repay_variable_event(asset, Self::env().caller(), on_behalf_of, amount_val);
        // recalculate
        reserve_data._recalculate_current_rates();
        // PUSH DATA
        self._push_data(
            &asset,
            &on_behalf_of,
            &reserve_data,
            &on_behalf_of_reserve_data,
            &on_behalf_of_config,
        );
        // check if there ie enought collateral
        self._check_user_free_collateral(&on_behalf_of, block_timestamp)?;
        //// TOKEN TRANSFER
        PSP22Ref::transfer_from_builder(
            &asset,
            Self::env().caller(),
            Self::env().account_id(),
            amount_val,
            Vec::<u8>::new(),
        )
        .call_flags(ink::env::CallFlags::default().set_allow_reentry(true))
        .try_invoke()
        .unwrap()??;
        Ok(amount_val)
    }
}

pub trait BorrowInternal {
    fn _pull_data_for_borrow(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig), LendingPoolError>;

    fn _pull_data_for_repay(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig), LendingPoolError>;
    fn _push_data(
        &mut self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
        reserve_data: &ReserveData,
        on_behalf_of_reserve_data: &UserReserveData,
        on_behalf_of_config: &UserConfig,
    );
}

impl<T: Storage<LendingPoolStorage>> BorrowInternal for T {
    fn _pull_data_for_borrow(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig), LendingPoolError> {
        let reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        let on_behalf_of_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &on_behalf_of)
            .unwrap_or_default();
        let on_behalf_of_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(on_behalf_of)
            .ok_or(LendingPoolError::InsufficientCollateral)?;
        Ok((reserve_data, on_behalf_of_reserve_data, on_behalf_of_config))
    }

    fn _pull_data_for_repay(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig), LendingPoolError> {
        let reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        let on_behalf_of_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &on_behalf_of)
            .ok_or(LendingPoolError::NothingToRepay)?;
        let on_behalf_of_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(on_behalf_of)
            .ok_or(LendingPoolError::NothingToRepay)?;
        Ok((reserve_data, on_behalf_of_reserve_data, on_behalf_of_config))
    }

    fn _push_data(
        &mut self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
        reserve_data: &ReserveData,
        on_behalf_of_reserve_data: &UserReserveData,
        on_behalf_of_config: &UserConfig,
    ) {
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(asset, reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(asset, on_behalf_of, on_behalf_of_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_config(on_behalf_of, on_behalf_of_config);
    }
}

impl<T: Storage<LendingPoolStorage>> EmitBorrowEvents for T {
    #[allow(unused_variables)]
    default fn _emit_collateral_set_event(&mut self, asset: AccountId, user: AccountId, set: bool) {}
    #[allow(unused_variables)]
    default fn _emit_borrow_variable_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    ) {
    }
    #[allow(unused_variables)]
    default fn _emit_repay_variable_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    ) {
    }
}

fn _change_state_borrow_variable(
    reserve_data: &mut ReserveData,
    on_behalf_of_reserve_data: &mut UserReserveData,
    on_behalf_of_config: &mut UserConfig,
    amount: u128,
) {
    _increase_user_variable_debt(reserve_data, on_behalf_of_reserve_data, on_behalf_of_config, amount);
    _increase_total_variable_debt(reserve_data, amount);
}

fn _change_state_repay_variable(
    reserve_data: &mut ReserveData,
    on_behalf_of_reserve_data: &mut UserReserveData,
    on_behalf_of_config: &mut UserConfig,
    amount: Option<u128>,
) -> Result<u128, LendingPoolError> {
    let amount_val = match amount {
        Some(v) => v,
        None => on_behalf_of_reserve_data.variable_borrowed,
    };
    if amount_val == 0 {
        return Err(LendingPoolError::AmountNotGreaterThanZero)
    }
    if amount_val > on_behalf_of_reserve_data.variable_borrowed {
        return Err(LendingPoolError::AmountExceedsUserDebt)
    }
    _decrease_user_variable_debt(reserve_data, on_behalf_of_reserve_data, on_behalf_of_config, amount_val);
    _decrease_total_variable_debt(reserve_data, amount_val);

    Ok(amount_val)
}
