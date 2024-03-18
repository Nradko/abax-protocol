use abax_traits::lending_pool::{
    EmitBorrowEvents, LendingPoolError, MathError, RuleId,
};
use ink::prelude::vec::Vec;
use pendzl::traits::{AccountId, Balance, StorageFieldGetter};

use super::{
    internal::{
        AssetPrices, Transfer, _check_amount_not_zero,
        _emit_abacus_token_transfer_event,
        _emit_abacus_token_transfer_event_and_decrease_allowance,
    },
    storage::LendingPoolStorage,
};

pub trait LendingPoolBorrowImpl:
    StorageFieldGetter<LendingPoolStorage> + EmitBorrowEvents
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
        let caller = Self::env().caller();
        self.data::<LendingPoolStorage>()
            .account_for_set_as_collateral(
                &caller,
                &asset,
                use_as_collateral_to_set,
            )?;

        // if the collateral is turned off collateralization must be checked
        if !use_as_collateral_to_set {
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
        _check_amount_not_zero(amount)?;

        let block_timestamp = Self::env().block_timestamp();
        ink::env::debug_println!("BORROW");
        ink::env::debug_println!(
            "borrow | block_timestamp {}",
            block_timestamp
        );

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
            .get(asset)
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
            (user_accumulated_debt_interest
                .checked_add(amount)
                .ok_or(MathError::Overflow)?) as i128,
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
        _check_amount_not_zero(amount)?;
        let block_timestamp = Self::env().block_timestamp();

        ink::env::debug_println!("REPAY");
        ink::env::debug_println!(
            "repay  | block_timestamp {}",
            block_timestamp
        );
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
            .get(asset)
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
            (user_accumulated_debt_interest as i128)
                .overflowing_sub(amount as i128)
                .0,
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
