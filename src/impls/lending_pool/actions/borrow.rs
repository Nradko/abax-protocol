use crate::{
    impls::lending_pool::{
        internal::*,
        storage::lending_pool_storage::{LendingPoolStorage, RuleId},
    },
    traits::lending_pool::{errors::LendingPoolError, events::*},
};
use ink::prelude::vec::Vec;
use pendzl::traits::{AccountId, Balance, Storage};

pub trait LendingPoolBorrowImpl:
    Storage<LendingPoolStorage> + TimestampMock + EmitBorrowEvents
{
    fn choose_market_rule(
        &mut self,
        market_rule_id: RuleId,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self.data::<LendingPoolStorage>()
            .account_for_market_rule_change(&caller, market_rule_id)?;

        // check if there ie enought collateral
        let all_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();
        let prices_e18 = self._get_assets_prices_e18(all_assets)?;
        self.data::<LendingPoolStorage>()
            .check_lending_power(&caller, &prices_e18)?;

        self._emit_market_rule_chosen(&caller, &market_rule_id);
        Ok(())
    }
    fn set_as_collateral(
        &mut self,
        asset: AccountId,
        use_as_collateral_to_set: bool,
    ) -> Result<(), LendingPoolError> {
        //// PULL DATA AND INIT CONDITIONS CHECK
        let caller = Self::env().caller();
        self.data::<LendingPoolStorage>()
            .account_for_set_as_collateral(
                &caller,
                &asset,
                use_as_collateral_to_set,
            )?;

        if use_as_collateral_to_set == false {
            // check if there ie enought collateral
            let all_assets = self
                .data::<LendingPoolStorage>()
                .get_all_registered_assets();
            let prices_e18 = self._get_assets_prices_e18(all_assets)?;
            self.data::<LendingPoolStorage>()
                .check_lending_power(&caller, &prices_e18)?;
        }

        self._emit_collateral_set_event(
            asset,
            caller,
            use_as_collateral_to_set,
        );

        Ok(())
    }

    fn borrow(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(), LendingPoolError> {
        //// PULL DATA AND INIT CONDITIONS CHECK
        _check_amount_not_zero(amount)?;

        let block_timestamp = self._timestamp();

        let (user_accumulated_deposit_interest, user_accumulated_debt_interest) =
            self.data::<LendingPoolStorage>().account_for_borrow(
                &asset,
                &on_behalf_of,
                &amount,
                &block_timestamp,
            )?;

        // check if there ie enought collateral
        let all_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();
        let prices_e18 = self._get_assets_prices_e18(all_assets)?;
        self.data::<LendingPoolStorage>()
            .check_lending_power(&on_behalf_of, &prices_e18)?;

        //// TOKEN TRANSFER
        self._transfer_out(&asset, &Self::env().caller(), &amount)?;

        //// ABACUS TOKEN EVENTS
        let abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(&asset)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.a_token_address,
            &on_behalf_of,
            user_accumulated_deposit_interest as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event_and_decrease_allowance(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            (user_accumulated_debt_interest + amount) as i128,
            &(Self::env().caller()),
            amount,
        )?;
        //// emit event
        self._emit_borrow_variable_event(
            asset,
            Self::env().caller(),
            on_behalf_of,
            amount,
        );
        Ok(())
    }

    fn repay(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        mut amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        if amount == 0 {
            return Err(LendingPoolError::AmountNotGreaterThanZero);
        }

        let block_timestamp = self._timestamp();
        let (user_accumulated_deposit_interest, user_accumulated_debt_interest) =
            self.data::<LendingPoolStorage>().account_for_repay(
                &asset,
                &on_behalf_of,
                &mut amount,
                &block_timestamp,
            )?;

        //// TOKEN TRANSFER
        self._transfer_in(&asset, &Self::env().caller(), &amount)?;
        //// ABACUS TOKEN EVENTS
        let abacus_tokens = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(&asset)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.a_token_address,
            &on_behalf_of,
            user_accumulated_deposit_interest as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            user_accumulated_debt_interest as i128 - amount as i128,
        )?;
        //// EVENT
        self._emit_repay_variable_event(
            asset,
            Self::env().caller(),
            on_behalf_of,
            amount,
        );
        Ok(amount)
    }
}
