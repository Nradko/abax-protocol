use checked_math::checked_math;
use openbrush::traits::{
    AccountId,
    Balance,
    Timestamp,
};
use primitive_types::U256;
use scale::{
    Decode,
    Encode,
};

use crate::impls::constants::{
    E18,
    E6,
    MATH_ERROR_MESSAGE,
};

use crate::traits::lending_pool::errors::{
    LendingPoolError,
    StorageError,
};
use ink::prelude::string::String;

/// is a struct containing all important constants and non-constant parameters and variables for each asset available on market.
/// records  total supplly and debt, interest rates.
#[derive(Debug, Encode, Decode, Clone, Copy)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
pub struct ReserveData {
    /// unique reserve id. it is the position of the coresponding underlying asset in registered_asset Vec<AccountId>.
    pub id: u64,
    //// CONFIGURATION ////
    //// BOOLEAN parameters
    /// are any actions allowed?
    pub activated: bool,
    /// are borrows and supplies freezed?
    pub freezed: bool,
    //// U128 parameters
    /// decimals multiplier of an underlying token. If token has n decimal places then it is 10^n.
    pub decimals: u128,
    /// delta interest per millisecond for utilizations (50%, 60%, 70%, 80%, 90%, 95%, 100%).
    pub interest_rate_model: [u128; 7],
    /// maximal allowed total supply
    pub maximal_total_supply: Option<Balance>,
    /// maximal allowad total debt
    pub maximal_total_debt: Option<Balance>,
    /// minimal collateral that can be used by each user.
    /// if user's collateral drops below this value (during redeem) then it will be automatically turned off (as collateral).
    /// it may happen during liquidation that users collateral will drop below this value.
    pub minimal_collateral: Balance,
    /// minimal debt that can be taken and maintain by each user.
    /// At any time user's debt can not bee smaller than minimal debt.
    /// Exception! it may happen during liquidation that users debt will drop below this value.
    pub minimal_debt: Balance,
    /// part of interest paid by borrowers that is redistributed to the suppliers. 10^6 = 100%.
    pub income_for_suppliers_part_e6: u128,
    /// fee that must be paid while taking flash loan. 10^6 = 100%.
    pub flash_loan_fee_e6: u128,
    ///// Variables
    /// underlying asset price in USD. 10^8 = 1 USD/per_1.
    pub token_price_e8: Option<u128>,
    //// Supply
    /// total supply of underlying asset. It is sum of deposits and  of accumulated interests. Total supply of aToken.
    pub total_supplied: Balance,
    /// index used to calculate supply accumulated interest
    pub cumulative_supply_rate_index_e18: u128,
    /// current interest rate for supplied tokens per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_supply_rate_e24: u128,
    //// variable_borrow
    /// total supply of variable borrows. It is sum of debts with accumulated interests. Total supply of vToken.
    pub total_debt: Balance,
    // index used to calculate borrow accumulated interest
    pub cumulative_debt_rate_index_e18: u128,
    // current interest rate for variable debt per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_debt_rate_e24: u128,
    ////
    /// timestamp of last borrow index update
    pub indexes_update_timestamp: Timestamp,
    //// Abacus Tokens
    /// adress of wrapping supply aToken
    pub a_token_address: AccountId,
    /// address of wrapping variable borrow vToken
    pub v_token_address: AccountId,
}

impl ReserveData {
    //// VIEW
    pub fn _current_utilization_rate_e6(&self) -> u128 {
        if self.total_supplied == 0 {
            return E6
        }
        let total_debt = self.total_debt;
        u128::try_from(checked_math!(total_debt * E6 / self.total_supplied).unwrap()).expect(MATH_ERROR_MESSAGE)
    }

    pub fn _utilization_rate_to_interest_rate_e24(&self, utilization_rate_e6: u128) -> u128 {
        let [t50, t60, t70, t80, t90, t95, t100]: [u128; 7] = self.interest_rate_model;
        ink::env::debug_println!(
            "interestRateModel: {} | {} | {} | {} | {} | {} | {}",
            t50,
            t60,
            t70,
            t80,
            t90,
            t95,
            t100
        );
        ink::env::debug_println!("utilization_rate_e6: {}", utilization_rate_e6);
        match utilization_rate_e6 {
            0 => 0,
            1..=499_999 => t50 * utilization_rate_e6 / 500_000 + 1,
            500_000..=599_999 => t50 + (t60 - t50) * (utilization_rate_e6 - 500_000) / 100_000 + 1,
            600_000..=699_999 => t60 + (t70 - t60) * (utilization_rate_e6 - 600_000) / 100_000 + 1,
            700_000..=799_999 => t70 + (t80 - t70) * (utilization_rate_e6 - 700_000) / 100_000 + 1,
            800_000..=899_999 => t80 + (t90 - t80) * (utilization_rate_e6 - 800_000) / 100_000 + 1,
            900_000..=949_999 => t90 + (t95 - t90) * (utilization_rate_e6 - 900_000) / 50_000 + 1,
            950_000..=999_999 => t95 + (t100 - t95) * (utilization_rate_e6 - 950_000) / 50_000 + 1,
            _ => t100 * utilization_rate_e6 / E6 + 1,
        }
    }

    //// MUT
    pub fn _accumulate_interest(&mut self, new_timestamp: Timestamp) {
        // time that hace passed in seconds
        let delta_timestamp: u128 = (new_timestamp - self.indexes_update_timestamp) as u128;
        // variable_borrow
        if delta_timestamp == 0 {
            return
        }

        if self.current_supply_rate_e24 != 0 {
            let index_multiplier_e18 = {
                let delta_index_multiplier_e18 =
                    u128::try_from(checked_math!((self.current_supply_rate_e24 * delta_timestamp / E6)).unwrap())
                        .expect(MATH_ERROR_MESSAGE);
                delta_index_multiplier_e18.checked_add(E18).expect(MATH_ERROR_MESSAGE)
            };
            self.total_supplied =
                u128::try_from(checked_math!((self.total_supplied * index_multiplier_e18) / E18).unwrap())
                    .expect(MATH_ERROR_MESSAGE);
            self.cumulative_supply_rate_index_e18 = u128::try_from(
                checked_math!((self.cumulative_supply_rate_index_e18 * index_multiplier_e18) / E18).unwrap(),
            )
            .expect(MATH_ERROR_MESSAGE);
        }

        ink::env::debug_println!("+++ reserve_data accumulate interest +++");

        ink::env::debug_println!(
            "new_timestamp: {}, old_timestamp: {}, delta_timestamp: {}",
            new_timestamp,
            self.indexes_update_timestamp,
            delta_timestamp
        );

        ink::env::debug_println!("current_debt_rate_e24: {}", self.current_debt_rate_e24,);

        if self.current_debt_rate_e24 != 0 {
            let index_multiplier_e18 = {
                let delta_index_multiplier_e18 =
                    u128::try_from(checked_math!((self.current_debt_rate_e24 * delta_timestamp / E6)).unwrap())
                        .expect(MATH_ERROR_MESSAGE);
                delta_index_multiplier_e18.checked_add(E18).expect(MATH_ERROR_MESSAGE)
            };
            ink::env::debug_println!("index_multiplier_e18: {}", index_multiplier_e18);
            self.total_debt = u128::try_from(checked_math!((self.total_debt * index_multiplier_e18) / E18).unwrap())
                .expect(MATH_ERROR_MESSAGE);

            ink::env::debug_println!(
                "old cumulative_debt_rate_index_e18: {}",
                self.cumulative_debt_rate_index_e18
            );

            self.cumulative_debt_rate_index_e18 = {
                let cumulative_debt_rate_index_e18_rounded_down = u128::try_from(
                    checked_math!((self.cumulative_debt_rate_index_e18 * index_multiplier_e18) / E18).unwrap(),
                )
                .expect(MATH_ERROR_MESSAGE);
                cumulative_debt_rate_index_e18_rounded_down
                    .checked_add(1)
                    .expect(MATH_ERROR_MESSAGE)
            };

            ink::env::debug_println!(
                "new cumulative_debt_rate_index_e18: {}",
                self.cumulative_debt_rate_index_e18
            );
        }
        self.indexes_update_timestamp = new_timestamp;
        ink::env::debug_println!("--- reserve_data accumulate interest ---");
    }

    pub fn _recalculate_current_rates(&mut self) {
        if self.total_debt == 0 {
            self.current_debt_rate_e24 = 0;
            self.current_supply_rate_e24 = 0;
            return
        }
        let utilization_rate_e6 = self._current_utilization_rate_e6();
        self.current_debt_rate_e24 = self._utilization_rate_to_interest_rate_e24(utilization_rate_e6);
        ink::env::debug_println!("recalculated current_debt_rate_e24: {}", self.current_debt_rate_e24);

        if self.total_supplied != 0 {
            let current_income_per_milisecond_e24: U256 =
                checked_math!(self.total_debt * self.current_debt_rate_e24).expect(MATH_ERROR_MESSAGE);
            self.current_supply_rate_e24 = u128::try_from(
                checked_math!(
                    current_income_per_milisecond_e24 * self.income_for_suppliers_part_e6 / (self.total_supplied * E6)
                )
                .unwrap(),
            )
            .expect(MATH_ERROR_MESSAGE);
        } else {
            self.current_supply_rate_e24 = 0;
        }
    }

    pub fn token_price_e8(&self) -> Result<u128, LendingPoolError> {
        let res = self
            .token_price_e8
            .ok_or(StorageError::EntityNotFound(String::from("TokenPrice")))?;
        Ok(res)
    }
}

impl Default for ReserveData {
    fn default() -> Self {
        Self {
            id: 0,
            activated: true,
            freezed: false,
            decimals: 10_000_000,
            interest_rate_model: [
                300_000_000_000,
                500_000_000_000,
                2_000_000_000_000,
                4_000_000_000_000,
                10_000_000_000_000,
                100_000_000_000_000,
                300_000_000_000_000,
            ],
            maximal_total_supply: None,
            maximal_total_debt: None,
            minimal_collateral: 0,
            minimal_debt: 0,
            income_for_suppliers_part_e6: E6,
            flash_loan_fee_e6: 0,
            token_price_e8: None,
            total_supplied: 0,
            cumulative_supply_rate_index_e18: E18,
            current_supply_rate_e24: 0,
            total_debt: 0,
            cumulative_debt_rate_index_e18: E18,
            current_debt_rate_e24: 0,
            indexes_update_timestamp: 0,
            a_token_address: ink::blake2x256!("ZERO_ADRESS").into(),
            v_token_address: ink::blake2x256!("ZERO_ADRESS").into(),
        }
    }
}

pub use super::tests::reserve_data_tests;
