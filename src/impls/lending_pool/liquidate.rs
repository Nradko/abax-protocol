use abax_library::math::E18_U128;
use abax_traits::lending_pool::{LendingPoolError, Liquidation, MathError};
use ink::{
    env::DefaultEnvironment,
    prelude::{vec::Vec, *},
};

use pendzl::traits::{AccountId, Balance, StorageFieldGetter};
use primitive_types::U256;

use super::{
    internal::{
        AssetPrices, Transfer, TransferEventDataSimplified,
        _emit_abacus_token_transfer_event, _emit_abacus_token_transfer_events,
    },
    storage::LendingPoolStorage,
};

pub trait LendingPoolLiquidateImpl:
    StorageFieldGetter<LendingPoolStorage> + Transfer
{
    fn liquidate(
        &mut self,
        liquidated_account: AccountId,
        asset_to_repay: AccountId,
        asset_to_take: AccountId,
        mut amount_to_repay: Balance,
        minimum_recieved_for_one_repaid_token_e18: u128,
        #[allow(unused_variables)] data: Vec<u8>,
    ) -> Result<(Balance, Balance), LendingPoolError> {
        // check if there ie enought collateral
        let all_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();
        let prices_e18 = self._get_assets_prices_e18(all_assets)?;
        let (collaterized, _) = self
            .data::<LendingPoolStorage>()
            .calculate_lending_power_of_an_account_e6(
                &liquidated_account,
                &prices_e18,
            )?;

        if collaterized {
            return Err(LendingPoolError::Collaterized);
        }

        let timestamp = Self::env().block_timestamp();
        let caller = Self::env().caller();

        let (
            amount_to_take,
            user_accumulated_deposit_interest_to_repay,
            user_accumulated_debt_interest_to_repay,
            user_accumulated_deposit_interest_to_take,
            user_accumulated_debt_interest_to_take,
            caller_accumulated_deposit_interest_to_take,
            caller_accumulated_debt_interest_to_take,
        ) = self.data::<LendingPoolStorage>().account_for_liquidate(
            &caller,
            &liquidated_account,
            &prices_e18,
            &asset_to_repay,
            &asset_to_take,
            &mut amount_to_repay,
            &timestamp,
        )?;

        let recieved_for_one_repaid_token_e18 = {
            let x = U256::from(amount_to_take);
            let y = U256::from(amount_to_repay);

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

        if recieved_for_one_repaid_token_e18
            < minimum_recieved_for_one_repaid_token_e18
        {
            return Err(LendingPoolError::MinimumRecieved);
        }
        //// TOKEN TRANSFERS

        self._transfer_in(&asset_to_repay, &caller, &amount_to_repay)?;

        //// ABACUS TOKEN EVENTS
        //// to_repay_token

        let abacus_tokens_to_repay = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(asset_to_repay)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens_to_repay.a_token_address,
            &liquidated_account,
            (user_accumulated_deposit_interest_to_repay) as i128,
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_event(
            &abacus_tokens_to_repay.v_token_address,
            &liquidated_account,
            (user_accumulated_debt_interest_to_repay as i128)
                .overflowing_sub(amount_to_repay as i128)
                .0,
        )?;

        //// to_take_token
        let abacus_tokens_to_take = self
            .data::<LendingPoolStorage>()
            .reserve_abacus_tokens
            .get(asset_to_take)
            .unwrap();
        // ATOKEN
        _emit_abacus_token_transfer_events(
            &abacus_tokens_to_take.a_token_address,
            &vec![
                TransferEventDataSimplified {
                    user: liquidated_account,
                    amount: (user_accumulated_deposit_interest_to_take as i128)
                        .overflowing_sub(amount_to_take as i128)
                        .0,
                },
                TransferEventDataSimplified {
                    user: caller,
                    amount: caller_accumulated_deposit_interest_to_take
                        .checked_add(amount_to_take)
                        .ok_or(MathError::Overflow)?
                        as i128,
                },
            ],
        )?;
        // VTOKEN
        _emit_abacus_token_transfer_events(
            &abacus_tokens_to_take.v_token_address,
            &vec![
                TransferEventDataSimplified {
                    user: liquidated_account,
                    amount: user_accumulated_debt_interest_to_take as i128,
                },
                TransferEventDataSimplified {
                    user: caller,
                    amount: caller_accumulated_debt_interest_to_take as i128,
                },
            ],
        )?;

        // EVENT
        ink::env::emit_event::<DefaultEnvironment, Liquidation>(Liquidation {
            liquidator: caller,
            liquidated_account,
            asset_to_repay,
            asset_to_take,
            amount_repaid: amount_to_repay,
            amount_taken: amount_to_take,
        });

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
    //     let block_timestamp = Self::env().block_timestamp();
    //     let caller = Self::env().caller();
    //     let (collaterized, _) = self
    //         .data::<LendingPoolStorage>()
    //         .calculate_user_lending_power_e6(&user)?;
    //     if collaterized {
    //         return Err(LendingPoolError::Collaterized);
    //     }

    //     let (
    //         user_accumulated_deposit_interest_to_repay,
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
    //         user_accumulated_deposit_interest_to_take,
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
    //         .reserve_abacus_tokens
    //         .get(&asset_to_repay)
    //         .unwrap();
    //     // ATOKEN
    //     _emit_abacus_token_transfer_event(
    //         &abacus_tokens_to_repay.a_token_address,
    //         &user,
    //         (user_accumulated_deposit_interest_to_repay) as i128,
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
    //         .reserve_abacus_tokens
    //         .get(&asset_to_take)
    //         .unwrap();
    //     // ATOKEN
    //     // ATOKEN
    //     _emit_abacus_token_transfer_event(
    //         &abacus_tokens_to_take.a_token_address,
    //         &user,
    //         (user_accumulated_deposit_interest_to_take) as i128,
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
