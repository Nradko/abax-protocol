use pendzl::traits::{AccountId, Balance, Timestamp};
use primitive_types::U256;
use scale::{Decode, Encode};

use crate::impls::constants::{E18_U128, E6_U128};

use crate::library::math::{
    e18_mul_e0_to_e0_rdown, e18_mul_e18_to_e18_rdown, e18_mul_e18_to_e18_rup,
    e24_mul_e0_to_e18_rdown, e24_mul_e0_to_e18_rup,
    e24_mul_e6_div_e0_to_e24_rdown, MathError,
};
use crate::traits::lending_pool::errors::LendingPoolError;

// Immutable data that is rarely used
#[derive(Debug, Encode, Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveAbacusTokens {
    /// adress of wrapping supply aToken
    pub a_token_address: AccountId,
    /// address of wrapping variable borrow vToken
    pub v_token_address: AccountId,
}

impl ReserveAbacusTokens {
    pub fn new(
        a_token_address: &AccountId,
        v_token_address: &AccountId,
    ) -> Self {
        ReserveAbacusTokens {
            a_token_address: *a_token_address,
            v_token_address: *v_token_address,
        }
    }
}

// Parameters that are quite commonly used
#[derive(Debug, Encode, Decode, Default)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveRestrictions {
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
}

impl ReserveRestrictions {
    pub fn new(
        maximal_total_supply: &Option<Balance>,
        maximal_total_debt: &Option<Balance>,
        minimal_collateral: &Balance,
        minimal_debt: &Balance,
    ) -> Self {
        ReserveRestrictions {
            maximal_total_supply: *maximal_total_supply,
            maximal_total_debt: *maximal_total_debt,
            minimal_collateral: *minimal_collateral,
            minimal_debt: *minimal_debt,
        }
    }
}

#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveIndexes {
    /// index used to calculate supply accumulated interest
    pub cumulative_supply_index_e18: u128,
    // index used to calculate borrow accumulated interest
    pub cumulative_debt_index_e18: u128,
}

impl ReserveIndexes {
    pub fn new() -> Self {
        ReserveIndexes {
            cumulative_supply_index_e18: E18_U128,
            cumulative_debt_index_e18: E18_U128,
        }
    }

    pub fn update_indexes(
        &mut self,
        supply_index_multiplier_e18: u128,
        debt_index_multiplier_e18: u128,
    ) -> Result<(), MathError> {
        self.cumulative_supply_index_e18 = e18_mul_e18_to_e18_rdown(
            self.cumulative_supply_index_e18,
            supply_index_multiplier_e18,
        )?;

        self.cumulative_debt_index_e18 = e18_mul_e18_to_e18_rup(
            self.cumulative_debt_index_e18,
            debt_index_multiplier_e18,
        )?;

        Ok(())
    }
}

#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReservePrice {
    /// decimals multiplier of an underlying token. If token has n decimal places then it is 10^n.
    pub decimals: u128,
    /// underlying asset price in USD. 10^8 = 1 USD/per_1.
    pub token_price_e8: Option<u128>,
}

impl ReservePrice {
    pub fn new(decimals: &u128) -> Self {
        ReservePrice {
            decimals: *decimals,
            token_price_e8: None,
        }
    }

    pub fn amount_to_value_e8(
        &self,
        amount: &Balance,
    ) -> Result<u128, LendingPoolError> {
        let price_e8 = self
            .token_price_e8
            .ok_or(LendingPoolError::AssetPriceNotInitialized)?;
        let x = U256::try_from(price_e8).unwrap();
        let y = U256::try_from(*amount).unwrap();
        let z = U256::try_from(self.decimals).unwrap();

        match u128::try_from(x.checked_mul(y).unwrap().checked_div(z).unwrap())
        {
            Ok(v) => Ok(v),
            _ => Err(LendingPoolError::from(MathError::Overflow)),
        }
    }
}

#[derive(Debug, Encode, Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveDataParameters {
    /// delta interest per millisecond for utilizations (50%, 60%, 70%, 80%, 90%, 95%, 100%).
    pub interest_rate_model: [u128; 7],
    /// part of interest paid by borrowers that is redistributed to the suppliers. 10^6 = 100%.
    pub income_for_suppliers_part_e6: u128,
    /// fee that must be paid while taking flash loan. 10^6 = 100%.
    pub flash_loan_fee_e6: u128,
}
/// is a struct containing all important constants and non-constant parameters and variables for each asset available on market.
/// records  total supplly and debt, interest rates.
/// very ofther used
#[derive(Debug, Encode, Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveData {
    /// are any actions allowed?
    pub activated: bool,
    /// are borrows and supplies freezed?
    pub freezed: bool,
    ///
    pub parameters: ReserveDataParameters,
    ///// Variables
    //// Supply
    /// total supply of underlying asset. It is sum of deposits and  of accumulated interests. Total supply of aToken.
    pub total_deposit: Balance,
    /// current interest rate for supplied tokens per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_supply_rate_e24: u128,
    //// variable_borrow
    /// total supply of variable borrows. It is sum of debts with accumulated interests. Total supply of vToken.
    pub total_debt: Balance,
    // current interest rate for variable debt per millisecond. 10^24 = 100%  millisecond Percentage Rate.
    pub current_debt_rate_e24: u128,
    /// timestamp of the last update od rate indexes
    pub indexes_update_timestamp: Timestamp,
}

impl ReserveData {
    pub fn new(
        interest_rate_model: &[u128; 7],
        income_for_suppliers_part_e6: &u128,
        flash_loan_fee_e6: &u128,
        timestamp: &Timestamp,
    ) -> Self {
        ReserveData {
            activated: true,
            freezed: false,
            parameters: ReserveDataParameters {
                interest_rate_model: *interest_rate_model,
                income_for_suppliers_part_e6: *income_for_suppliers_part_e6,
                flash_loan_fee_e6: *flash_loan_fee_e6,
            },
            total_deposit: 0,
            current_supply_rate_e24: E18_U128,
            total_debt: 0,
            current_debt_rate_e24: E18_U128,
            indexes_update_timestamp: *timestamp,
        }
    }

    pub fn set_is_active(
        &mut self,
        active: bool,
    ) -> Result<(), LendingPoolError> {
        if self.activated == active {
            return Err(LendingPoolError::AlreadySet);
        }
        self.activated = active;
        Ok(())
    }

    pub fn set_is_freezed(
        &mut self,
        freeze: bool,
    ) -> Result<(), LendingPoolError> {
        if self.freezed == freeze {
            return Err(LendingPoolError::AlreadySet);
        }
        self.activated = freeze;
        Ok(())
    }

    pub fn check_activeness(&self) -> Result<(), LendingPoolError> {
        if !self.activated {
            return Err(LendingPoolError::Inactive);
        }
        Ok(())
    }

    pub fn check_is_freezed(&self) -> Result<(), LendingPoolError> {
        if self.freezed {
            return Err(LendingPoolError::Freezed);
        }
        Ok(())
    }

    pub fn utilization_rate_to_interest_rate_e24(
        &self,
        utilization_rate_e6: u128,
    ) -> u128 {
        let [t50, t60, t70, t80, t90, t95, t100]: [u128; 7] =
            self.parameters.interest_rate_model;
        match utilization_rate_e6 {
            0 => 0,
            1..=499_999 => t50 * utilization_rate_e6 / 500_000 + 1,
            500_000..=599_999 => {
                t50 + (t60 - t50) * (utilization_rate_e6 - 500_000) / 100_000
                    + 1
            }
            600_000..=699_999 => {
                t60 + (t70 - t60) * (utilization_rate_e6 - 600_000) / 100_000
                    + 1
            }
            700_000..=799_999 => {
                t70 + (t80 - t70) * (utilization_rate_e6 - 700_000) / 100_000
                    + 1
            }
            800_000..=899_999 => {
                t80 + (t90 - t80) * (utilization_rate_e6 - 800_000) / 100_000
                    + 1
            }
            900_000..=949_999 => {
                t90 + (t95 - t90) * (utilization_rate_e6 - 900_000) / 50_000 + 1
            }
            950_000..=999_999 => {
                t95 + (t100 - t95) * (utilization_rate_e6 - 950_000) / 50_000
                    + 1
            }
            _ => t100 * utilization_rate_e6 / E6_U128 + 1,
        }
    }
    //// VIEW
    pub fn current_utilization_rate_e6(&self) -> Result<u128, MathError> {
        if self.total_deposit == 0 {
            return Ok(E6_U128);
        }
        let total_debt = self.total_debt;
        match u128::try_from({
            let x = U256::try_from(total_debt).unwrap();
            let y = U256::try_from(E6_U128).unwrap();
            let z = U256::try_from(self.total_deposit).unwrap();
            x.checked_mul(y).unwrap().checked_div(z).unwrap()
        }) {
            Ok(v) => Ok(v),
            _ => Err(MathError::Overflow),
        }
    }

    //// MUT
    pub fn accumulate_interest(
        &mut self,
        reserve_indexes: &mut ReserveIndexes,
        new_timestamp: &Timestamp,
    ) -> Result<(), MathError> {
        let mut supply_index_multiplier_e18: u128 = E18_U128;
        let mut debt_index_multiplier_e18: u128 = E18_U128;

        // time that have passed in seconds
        let delta_timestamp: u128 =
            (*new_timestamp - self.indexes_update_timestamp) as u128;
        // variable_borrow
        if delta_timestamp == 0 {
            return Ok(());
        }

        if self.current_supply_rate_e24 != 0 {
            supply_index_multiplier_e18 = supply_index_multiplier_e18
                .checked_add(e24_mul_e0_to_e18_rdown(
                    self.current_supply_rate_e24,
                    delta_timestamp,
                )?)
                .ok_or(MathError::Overflow)?;
            self.total_deposit = e18_mul_e0_to_e0_rdown(
                supply_index_multiplier_e18,
                self.total_deposit,
            )?;
        }

        if self.current_debt_rate_e24 != 0 {
            debt_index_multiplier_e18 = debt_index_multiplier_e18
                .checked_add(e24_mul_e0_to_e18_rup(
                    self.current_debt_rate_e24,
                    delta_timestamp,
                )?)
                .ok_or(MathError::Overflow)?;
            self.total_debt = e18_mul_e0_to_e0_rdown(
                debt_index_multiplier_e18,
                self.total_debt,
            )?;
        }
        self.indexes_update_timestamp = *new_timestamp;
        reserve_indexes.update_indexes(
            supply_index_multiplier_e18,
            debt_index_multiplier_e18,
        )?;
        Ok(())
    }

    pub fn recalculate_current_rates(&mut self) -> Result<(), MathError> {
        if self.total_debt == 0 {
            self.current_debt_rate_e24 = 0;
            self.current_supply_rate_e24 = 0;
            return Ok(());
        }
        let utilization_rate_e6 = self.current_utilization_rate_e6()?;
        self.current_debt_rate_e24 =
            self.utilization_rate_to_interest_rate_e24(utilization_rate_e6);

        if self.total_deposit != 0 {
            let current_income_per_milisecond_e24: U256 = {
                let x = U256::try_from(self.total_debt).unwrap();
                let y = U256::try_from(self.current_debt_rate_e24).unwrap();
                x.checked_mul(y).unwrap()
            };
            self.current_supply_rate_e24 = e24_mul_e6_div_e0_to_e24_rdown(
                current_income_per_milisecond_e24,
                self.parameters.income_for_suppliers_part_e6,
                self.total_deposit,
            )?;
        } else {
            self.current_supply_rate_e24 = 0;
        }
        Ok(())
    }

    pub fn increase_total_deposit(
        &mut self,
        amount: &Balance,
    ) -> Result<(), MathError> {
        self.total_deposit = self
            .total_deposit
            .checked_add(*amount)
            .ok_or(MathError::Overflow)?;
        Ok(())
    }

    pub fn decrease_total_deposit(
        &mut self,
        amount: &Balance,
    ) -> Result<(), MathError> {
        self.total_deposit = self
            .total_deposit
            .checked_sub(*amount)
            .ok_or(MathError::Underflow)?;
        Ok(())
    }

    pub fn check_max_total_deposit(
        &self,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), LendingPoolError> {
        match reserve_restrictions.maximal_total_supply {
            Some(max_total_supply) if self.total_deposit > max_total_supply => {
                return Err(LendingPoolError::MaxSupplyReached);
            }
            _ => Ok(()),
        }
    }

    pub fn increase_total_debt(
        &mut self,
        amount: &Balance,
    ) -> Result<(), MathError> {
        self.total_debt = self
            .total_debt
            .checked_add(*amount)
            .ok_or(MathError::Overflow)?;
        Ok(())
    }

    pub fn decrease_total_debt(&mut self, amount: &Balance) {
        self.total_debt = self.total_debt.saturating_sub(*amount);
    }

    pub fn check_max_total_debt(
        &self,
        reserve_restrictions: &ReserveRestrictions,
    ) -> Result<(), LendingPoolError> {
        match reserve_restrictions.maximal_total_debt {
            Some(max_total_debt) if self.total_debt > max_total_debt => {
                return Err(LendingPoolError::MaxDebtReached);
            }
            _ => Ok(()),
        }
    }
}
//TODO
// pub use super::tests::reserve_data_tests;
