// SPDX-License-Identifier: BUSL-1.1
use crate::lending_pool::{
    events::{Borrow, CollateralSet, MarketRuleChosen, Repay},
    LendingPoolError, RuleId,
};
use ink::{
    env::DefaultEnvironment,
    prelude::{vec, vec::Vec},
};
use pendzl::{
    math::errors::MathError,
    traits::{AccountId, Balance, StorageFieldGetter},
};

use abax_library::structs::{Action, Operation, OperationArgs};

use super::{
    internal::{
        Transfer, _check_amount_not_zero, _emit_abacus_token_transfer_event,
        _emit_abacus_token_transfer_event_and_decrease_allowance,
    },
    storage::LendingPoolStorage,
};

pub trait LendingPoolBorrowImpl:
    StorageFieldGetter<LendingPoolStorage>
{
    fn choose_market_rule(
        &mut self,
        market_rule_id: RuleId,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self.data::<LendingPoolStorage>()
            .account_for_market_rule_change(&caller, market_rule_id)?;

        // check if there ie enought collateral
        self.data::<LendingPoolStorage>()
            .ensure_collateralized_by_account(&caller)?;

        ink::env::emit_event::<DefaultEnvironment, MarketRuleChosen>(
            MarketRuleChosen {
                caller,
                market_rule_id,
            },
        );
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
            self.data::<LendingPoolStorage>()
                .ensure_collateralized_by_account(&caller)?;
        }

        ink::env::emit_event::<DefaultEnvironment, CollateralSet>(
            CollateralSet {
                caller,
                asset,
                set: use_as_collateral_to_set,
            },
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

        let mut actions = vec![Action {
            op: Operation::Borrow,
            args: OperationArgs { asset, amount },
        }];
        let res = self
            .data::<LendingPoolStorage>()
            .account_for_account_actions(&on_behalf_of, &mut actions)?;
        let (
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ) = res.first().unwrap();

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
            *account_accumulated_deposit_interest as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event_and_decrease_allowance(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            (account_accumulated_debt_interest
                .checked_add(amount)
                .ok_or(MathError::Overflow)?) as i128,
            &(Self::env().caller()),
            amount,
        )?;
        //// emit event
        ink::env::emit_event::<DefaultEnvironment, Borrow>(Borrow {
            asset,
            caller: Self::env().caller(),
            on_behalf_of,
            amount,
        });
        Ok(())
    }

    fn repay(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError> {
        _check_amount_not_zero(amount)?;

        let mut actions = vec![Action {
            op: Operation::Repay,
            args: OperationArgs { asset, amount },
        }];
        let res = self
            .data::<LendingPoolStorage>()
            .account_for_account_actions(&on_behalf_of, &mut actions)?;
        let (
            account_accumulated_deposit_interest,
            account_accumulated_debt_interest,
        ) = res.first().unwrap();
        //// TOKEN TRANSFER
        self._transfer_in(
            &asset,
            &Self::env().caller(),
            &actions[0].args.amount,
        )?;
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
            *account_accumulated_deposit_interest as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens.v_token_address,
            &on_behalf_of,
            (*account_accumulated_debt_interest as i128)
                .overflowing_sub(actions[0].args.amount as i128)
                .0,
        )?;
        //// EVENT
        ink::env::emit_event::<DefaultEnvironment, Repay>(Repay {
            asset,
            caller: Self::env().caller(),
            on_behalf_of,
            amount: actions[0].args.amount,
        });
        Ok(actions[0].args.amount)
    }
}
