use ink::prelude::{vec::Vec, *};

use pendzl::traits::{AccountId, Balance, Storage};
use primitive_types::U256;

use crate::{
    impls::{
        constants::E18_U128,
        lending_pool::{
            internal::*, storage::lending_pool_storage::LendingPoolStorage,
        },
    },
    library::math::MathError,
    traits::lending_pool::{
        errors::LendingPoolError, events::EmitLiquidateEvents,
    },
};

pub trait LendingPoolLiquidateImpl:
    Storage<LendingPoolStorage> + TimestampMock + Transfer + EmitLiquidateEvents
{
    fn liquidate(
        &mut self,
        liquidated_user: AccountId,
        asset_to_repay: AccountId,
        asset_to_take: AccountId,
        mut amount_to_repay: Balance,
        minimum_recieved_for_one_repaid_token_e18: u128,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(Balance, Balance), LendingPoolError> {
        ink::env::debug_println!("a1");
        let (collaterized, _) = self
            .data::<LendingPoolStorage>()
            .calculate_user_lending_power_e6(&liquidated_user)?;
        ink::env::debug_println!("a2");
        if collaterized {
            return Err(LendingPoolError::Collaterized);
        }

        let timestamp = self._timestamp();
        let caller = Self::env().caller();
        ink::env::debug_println!("a3");
        let (
            amount_to_take,
            user_accumulated_supply_interest_to_repay,
            user_accumulated_debt_interest_to_repay,
            user_accumulated_supply_interest_to_take,
            user_accumulated_debt_interest_to_take,
            caller_accumulated_supply_interest_to_take,
            caller_accumulated_debt_interest_to_take,
        ) = self.data::<LendingPoolStorage>().account_for_liquidate(
            &caller,
            &liquidated_user,
            &asset_to_repay,
            &asset_to_take,
            &mut amount_to_repay,
            &timestamp,
        )?;
        ink::env::debug_println!("a4");

        let recieved_for_one_repaid_token_e18 = {
            let x = U256::try_from(amount_to_take).unwrap();
            let y = U256::try_from(amount_to_repay).unwrap();
            ink::env::debug_println!("a5");

            match u128::try_from(
                x.checked_mul(E18_U128.into())
                    .unwrap()
                    .checked_div(y)
                    .unwrap(),
            ) {
                Ok(v) => Ok(v),
                _ => Err(MathError::Overflow),
            }
        }?;
        ink::env::debug_println!("a6");

        if recieved_for_one_repaid_token_e18
            < minimum_recieved_for_one_repaid_token_e18
        {
            return Err(LendingPoolError::MinimumRecieved);
        }
        //// TOKEN TRANSFERS
        ink::env::debug_println!("a7");

        self._transfer_in(&asset_to_repay, &caller, &amount_to_repay)?;

        //// ABACUS TOKEN EVENTS
        //// to_repay_token
        ink::env::debug_println!("a8");
        let abacus_tokens_to_repay = self
            .data::<LendingPoolStorage>()
            .reserve_abacus
            .get(&asset_to_repay)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens_to_repay.a_token_address,
            &liquidated_user,
            (user_accumulated_supply_interest_to_repay) as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens_to_repay.v_token_address,
            &liquidated_user,
            user_accumulated_debt_interest_to_repay as i128
                - amount_to_repay as i128,
        )?;

        ink::env::debug_println!("a9");

        //// to_take_token
        let abacus_tokens_to_take = self
            .data::<LendingPoolStorage>()
            .reserve_abacus
            .get(&asset_to_take)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_events(
            &abacus_tokens_to_take.a_token_address,
            &vec![
                TransferEventDataSimplified {
                    user: liquidated_user,
                    amount: user_accumulated_supply_interest_to_take as i128
                        - amount_to_take as i128,
                },
                TransferEventDataSimplified {
                    user: caller,
                    amount: (caller_accumulated_supply_interest_to_take
                        + amount_to_take) as i128,
                },
            ],
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_events(
            &abacus_tokens_to_take.v_token_address,
            &vec![
                TransferEventDataSimplified {
                    user: liquidated_user,
                    amount: user_accumulated_debt_interest_to_take as i128,
                },
                TransferEventDataSimplified {
                    user: caller,
                    amount: caller_accumulated_debt_interest_to_take as i128,
                },
            ],
        )?;

        ink::env::debug_println!("a10");

        // EVENT
        self._emit_liquidation_variable_event(
            caller,
            liquidated_user,
            asset_to_repay,
            asset_to_take,
            amount_to_repay,
            amount_to_take,
        );
        ink::env::debug_println!("a11");

        Ok((amount_to_repay, amount_to_take))
    }

    // fn liquidate_outside(
    //     &mut self,
    //     user: AccountId,
    //     asset_to_repay: AccountId,
    //     asset_to_take: AccountId,
    //     mut amount_to_repay: Balance,
    //     #[allow(unused_variables)] data: Vec<u8>,
    // ) -> Result<(Balance, Balance), LendingPoolError> {
    //     let block_timestamp = self._timestamp();
    //     let caller = Self::env().caller();
    //     let (collaterized, _) = self
    //         .data::<LendingPoolStorage>()
    //         .calculate_user_lending_power_e6(&user)?;
    //     if collaterized {
    //         return Err(LendingPoolError::Collaterized);
    //     }

    //     let (
    //         user_accumulated_supply_interest_to_repay,
    //         user_accumulated_debt_interest_to_repay,
    //     ) = self.data::<LendingPoolStorage>().account_for_repay(
    //         &asset_to_repay,
    //         &caller,
    //         &mut amount_to_repay,
    //         &block_timestamp,
    //     )?;
    //     self._transfer_in(&asset_to_repay, &caller, &amount_to_repay)?;

    //     let mut amount_to_take = self
    //         .data::<LendingPoolStorage>()
    //         .calculate_liquidated_amount_and_check_if_collateral(
    //             &user,
    //             &asset_to_repay,
    //             &asset_to_take,
    //             &amount_to_repay,
    //         )?;

    //     let (
    //         user_accumulated_supply_interest_to_take,
    //         user_accumulated_debt_interest_to_take,
    //     ) = self.data::<LendingPoolStorage>().account_for_withdraw(
    //         &asset_to_take,
    //         &user,
    //         &mut amount_to_take,
    //         &block_timestamp,
    //     )?;

    //     self._transfer_out(&asset_to_take, &caller, &amount_to_take)?;

    //     //// ABACUS TOKEN EVENTS
    //     //// to_repay_token
    //     let abacus_tokens_to_repay = self
    //         .data::<LendingPoolStorage>()
    //         .reserve_abacus
    //         .get(&asset_to_repay)
    //         .unwrap();
    //     // ATOKEN
    //     _emit_abacus_token_transfer_event(
    //         &abacus_tokens_to_repay.a_token_address,
    //         &user,
    //         (user_accumulated_supply_interest_to_repay) as i128,
    //     )?;
    //     // VTOKEN
    //     _emit_abacus_token_transfer_event(
    //         &abacus_tokens_to_repay.v_token_address,
    //         &user,
    //         user_accumulated_debt_interest_to_repay as i128
    //             - amount_to_repay as i128,
    //     )?;
    //     //// to_take_token
    //     let abacus_tokens_to_take = self
    //         .data::<LendingPoolStorage>()
    //         .reserve_abacus
    //         .get(&asset_to_take)
    //         .unwrap();
    //     // ATOKEN
    //     // ATOKEN
    //     _emit_abacus_token_transfer_event(
    //         &abacus_tokens_to_take.a_token_address,
    //         &user,
    //         (user_accumulated_supply_interest_to_take) as i128,
    //     )?;
    //     // VTOKEN
    //     _emit_abacus_token_transfer_event(
    //         &abacus_tokens_to_take.v_token_address,
    //         &user,
    //         user_accumulated_debt_interest_to_take as i128
    //             - amount_to_take as i128,
    //     )?;
    //     // EVENT
    //     self._emit_liquidation_variable_event(
    //         caller,
    //         user,
    //         asset_to_repay,
    //         asset_to_take,
    //         amount_to_repay,
    //         amount_to_take,
    //     );
    //     Ok((amount_to_repay, amount_to_take))
    // }
}
