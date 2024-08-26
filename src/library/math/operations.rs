// SPDX-License-Identifier: BUSL-1.1
use pendzl::math::{
    errors::MathError,
    operations::{mul_div, Rounding},
};

use primitive_types::U256;

use super::{E10_U128, E18_U128, E6_U128, E8_U128};

pub fn e18_mul_e18_to_e18_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    if a == E18_U128 {
        return Ok(b);
    }
    if b == E18_U128 {
        return Ok(a);
    }
    mul_div(a, b, E18_U128, Rounding::Down)
}

pub fn e18_mul_e18_to_e18_rup(a: u128, b: u128) -> Result<u128, MathError> {
    if a == E18_U128 {
        return Ok(b);
    }
    if b == E18_U128 {
        return Ok(a);
    }
    mul_div(a, b, E18_U128, Rounding::Up)
}

pub fn e18_mul_e0_to_e18(a: u64, b: u64) -> u128 {
    (a as u128).checked_mul(b as u128).unwrap()
}

pub fn e18_mul_e18_div_e18_to_e18_rdown(
    a: u128,
    b: u64,
    c: u128,
) -> Result<u64, MathError> {
    match u64::try_from(mul_div(a, b as u128, c, Rounding::Down)?) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e0_mul_e18_div_e18_to_e0_rdown(
    a: u128,
    b: u128,
    c: u128,
) -> Result<u128, MathError> {
    mul_div(a, b, c, Rounding::Down)
}

pub fn e0_mul_e18_div_e18_to_e0_rup(
    a: u128,
    b: u128,
    c: u128,
) -> Result<u128, MathError> {
    mul_div(a, b, c, Rounding::Up)
}

pub fn e0_mul_e6_to_e0_rup(a: u128, b: u32) -> Result<u128, MathError> {
    mul_div(a, b as u128, E6_U128, Rounding::Up)
}

pub fn e8_mul_e6_to_e6_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    mul_div(a, b, E8_U128, Rounding::Down)
}

pub fn calculate_amount_to_take(
    amount_to_repay: &u128,
    asset_to_repay_price_e18: &u128,
    asset_to_take_price_e18: &u128,
    reserve_to_repay_decimal_multiplier: &u128,
    reserve_to_take_decimal_multiplier: &u128,
    penalty_to_repay_e6: &u128,
    penalty_to_take_e6: &u128,
) -> Result<u128, MathError> {
    let a = U256::from(*amount_to_repay);
    let b = U256::from(*asset_to_repay_price_e18);
    let c = U256::from(*reserve_to_take_decimal_multiplier);
    let l = U256::from(*penalty_to_repay_e6);
    let m = U256::from(*penalty_to_take_e6);
    let x = U256::from(*asset_to_take_price_e18);
    let y = U256::from(*reserve_to_repay_decimal_multiplier);

    match u128::try_from(
        a.checked_mul(b)
            .unwrap()
            .checked_mul(c)
            .unwrap()
            .checked_mul(
                l.checked_add(m)
                    .unwrap()
                    .checked_add(E6_U128.into())
                    .unwrap(),
            )
            .unwrap()
            .checked_div(
                x.checked_mul(y)
                    .unwrap()
                    .checked_mul(E6_U128.into())
                    .unwrap(),
            )
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn calculate_asset_amount_value_e8(
    amount: &u128,
    price_e18: &u128,
    decimal_multplier: &u128,
) -> u128 {
    let denominator = decimal_multplier.checked_mul(E10_U128).unwrap(); // here e18 coming from price is adjusted to e8 // this should not fail as long decimal multiplier is smaller than 3 *10^28
    mul_div(*amount, *price_e18, denominator, Rounding::Down).unwrap()
}
