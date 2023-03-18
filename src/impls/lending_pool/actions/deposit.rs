use ink::prelude::vec::Vec;
use openbrush::{
    contracts::traits::psp22::*,
    traits::{
        AccountId,
        Balance,
        Storage,
    },
};

use crate::{
    impls::lending_pool::{
        internal::{
            _accumulate_interest,
            _check_activeness,
            _check_deposit_enabled,
            *,
        },
        storage::{
            lending_pool_storage::{
                LendingPoolStorage,
                MarketRule,
            },
            structs::{
                reserve_data::ReserveData,
                user_config::UserConfig,
                user_reserve_data::UserReserveData,
            },
        },
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolError,
            events::*,
            traits::actions::LendingPoolDeposit,
        },
    },
};

impl<T: Storage<LendingPoolStorage> + DepositInternal> LendingPoolDeposit for T {
    default fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        //// ARGUMENT CHECK
        _check_amount_not_zero(amount)?;
        //// PULL DATA
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let (mut reserve_data, mut on_behalf_of_reserve_data, mut on_behalf_of_config) =
            self._pull_data_for_deposit(&asset, &on_behalf_of)?;

        //// MODIFY DATA
        // accumulate
        let (interest_on_behalf_of_supply, interest_on_behalf_of_variable_borrow): (Balance, Balance) =
            _accumulate_interest(&mut reserve_data, &mut on_behalf_of_reserve_data, block_timestamp);
        // add deposit
        _change_state_on_deposit(
            &mut reserve_data,
            &mut on_behalf_of_reserve_data,
            &mut on_behalf_of_config,
            amount,
        );
        _check_max_supply(reserve_data)?;

        // recalculate
        reserve_data._recalculate_current_rates();

        //// PUSH STORAGE
        self._push_data(
            &asset,
            &on_behalf_of,
            &reserve_data,
            &on_behalf_of_reserve_data,
            &on_behalf_of_config,
        );

        //// TOKEN TRANSFERS
        PSP22Ref::transfer_from_builder(
            &asset,
            Self::env().caller(),
            Self::env().account_id(),
            amount,
            Vec::<u8>::new(),
        )
        .call_flags(ink::env::CallFlags::default().set_allow_reentry(true))
        .try_invoke()
        .unwrap()??;
        //// ABACUS TOKEN EVENTS
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.a_token_address,
            &on_behalf_of,
            (interest_on_behalf_of_supply + amount) as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.v_token_address,
            &on_behalf_of,
            interest_on_behalf_of_variable_borrow as i128,
        )?;

        //// EVENT
        self._emit_deposit_event(asset, Self::env().caller(), on_behalf_of, amount);

        Ok(())
    }

    default fn redeem(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount_arg: Option<Balance>,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        //// PULL DATA
        let block_timestamp =
            BlockTimestampProviderRef::get_block_timestamp(&self.data::<LendingPoolStorage>().block_timestamp_provider);
        let (mut reserve_data, mut on_behalf_of_reserve_data, mut on_behalf_of_config, market_rule) =
            self._pull_data_for_redeem(&asset, &on_behalf_of)?;
        // MODIFY PULLED STORAGE & AMOUNT CHECK
        // accumulate
        let (interest_on_behalf_of_supply, interest_on_behalf_of_variable_borrow): (Balance, Balance) =
            _accumulate_interest(&mut reserve_data, &mut on_behalf_of_reserve_data, block_timestamp);
        // amount checks
        let amount = match amount_arg {
            Some(v) => {
                if v > on_behalf_of_reserve_data.supplied {
                    return Err(LendingPoolError::AmountExceedsUserDeposit)
                };
                v
            }
            None => on_behalf_of_reserve_data.supplied,
        };
        _check_amount_not_zero(amount)?;
        // sub deposit
        _change_state_on_redeem(
            &mut reserve_data,
            &mut on_behalf_of_reserve_data,
            &mut on_behalf_of_config,
            amount,
        );
        // recalculate
        reserve_data._recalculate_current_rates();

        //// PUSH STORAGE & FINAL CONDITION CHECK
        self._push_data(
            &asset,
            &on_behalf_of,
            &reserve_data,
            &on_behalf_of_reserve_data,
            &on_behalf_of_config,
        );
        // check if there ie enought collateral
        self._check_user_free_collateral(&on_behalf_of, &on_behalf_of_config, &market_rule, block_timestamp)?;

        //// TOKEN TRANSFERS
        PSP22Ref::transfer(&asset, Self::env().caller(), amount, Vec::<u8>::new())?;

        //// ABACUS TOKEN EVENTS
        // ATOKEN
        _emit_abacus_token_transfer_event_and_decrease_allowance(
            &reserve_data.a_token_address,
            &on_behalf_of,
            (interest_on_behalf_of_supply - amount) as i128,
            &(Self::env().caller()),
            amount,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &reserve_data.v_token_address,
            &on_behalf_of,
            interest_on_behalf_of_variable_borrow as i128,
        )?;

        //// EVENT
        self._emit_redeem_event(asset, Self::env().caller(), on_behalf_of, amount);

        Ok(amount)
    }
}

pub trait DepositInternal {
    fn _pull_data_for_deposit(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig), LendingPoolError>;

    fn _pull_data_for_redeem(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig, MarketRule), LendingPoolError>;
    fn _push_data(
        &mut self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
        reserve_data: &ReserveData,
        on_behalf_of_reserve_data: &UserReserveData,
        on_behalf_of_config: &UserConfig,
    );
}

impl<T: Storage<LendingPoolStorage>> DepositInternal for T {
    fn _pull_data_for_deposit(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig), LendingPoolError> {
        let reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        _check_deposit_enabled(&reserve_data)?;
        let on_behalf_of_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &on_behalf_of)
            .unwrap_or_default();
        let on_behalf_of_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&on_behalf_of)
            .unwrap_or_default();
        Ok((reserve_data, on_behalf_of_reserve_data, on_behalf_of_config))
    }

    fn _pull_data_for_redeem(
        &self,
        asset: &AccountId,
        on_behalf_of: &AccountId,
    ) -> Result<(ReserveData, UserReserveData, UserConfig, MarketRule), LendingPoolError> {
        let reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        _check_activeness(&reserve_data)?;
        let on_behalf_of_reserve_data = self
            .data::<LendingPoolStorage>()
            .get_user_reserve(&asset, &on_behalf_of)
            .ok_or(LendingPoolError::InsufficientSupply)?;
        let on_behalf_of_config = self
            .data::<LendingPoolStorage>()
            .get_user_config(&on_behalf_of)
            .ok_or(LendingPoolError::InsufficientSupply)?;
        let market_rule = self
            .data::<LendingPoolStorage>()
            .get_market_rule(&on_behalf_of_config.market_rule_id)
            .ok_or(LendingPoolError::MarketRule)?;
        Ok((
            reserve_data,
            on_behalf_of_reserve_data,
            on_behalf_of_config,
            market_rule,
        ))
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
            .insert_reserve_data(&asset, &reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_reserve(&asset, &on_behalf_of, &on_behalf_of_reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_user_config(&on_behalf_of, &on_behalf_of_config);
    }
}

fn _change_state_on_deposit(
    reserve_data: &mut ReserveData,
    on_behalf_of_reserve_data: &mut UserReserveData,
    on_behalf_of_config: &mut UserConfig,
    amount: u128,
) {
    _increase_user_deposit(&*reserve_data, on_behalf_of_reserve_data, on_behalf_of_config, amount);
    _increase_total_deposit(reserve_data, amount);
}

fn _change_state_on_redeem(
    reserve_data: &mut ReserveData,
    on_behalf_of_reserve_data: &mut UserReserveData,
    on_behalf_of_config: &mut UserConfig,
    amount: u128,
) {
    _decrease_user_deposit(&*reserve_data, on_behalf_of_reserve_data, on_behalf_of_config, amount);
    _decrease_total_deposit(reserve_data, amount);
    if on_behalf_of_reserve_data.supplied <= reserve_data.minimal_collateral {
        on_behalf_of_config.collaterals &= !(1_u128 << reserve_data.id);
    }
}

impl<T: Storage<LendingPoolStorage>> EmitDepositEvents for T {
    #[allow(unused_variables)]
    default fn _emit_deposit_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    ) {
    }
    #[allow(unused_variables)]
    default fn _emit_redeem_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    ) {
    }
}
