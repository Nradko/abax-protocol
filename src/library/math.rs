use primitive_types::U256;

use crate::impls::constants::{E18_U128, E6_U128, E8_U128};

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum MathError {
    Overflow,
    DivByZero,
    Underflow,
}

pub fn e18_mul_e18_to_e18_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x = U256::try_from(a).unwrap();
    let y = U256::try_from(b).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(E18_U128.into())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e18_mul_e18_to_e18_rup(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x = U256::try_from(a).unwrap();
    let y = U256::try_from(b).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(E18_U128.into())
            .unwrap()
            .checked_add(1.into())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e24_mul_e0_to_e18_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x = U256::try_from(a).unwrap();
    let y = U256::try_from(b).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(E6_U128.into())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e24_mul_e0_to_e18_rup(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x = U256::try_from(a).unwrap();
    let y = U256::try_from(b).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(E6_U128.into())
            .unwrap()
            .checked_add(1.into())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e18_mul_e0_to_e0_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x = U256::try_from(a).unwrap();
    let y = U256::try_from(b).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(E18_U128.into())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e18_mul_e0_to_e0_rup(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x = U256::try_from(a).unwrap();
    let y = U256::try_from(b).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(E18_U128.into())
            .unwrap()
            .checked_add(1.into())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e24_mul_e6_div_e0_to_e24_rdown(
    a: U256,
    b: u128,
    c: u128,
) -> Result<u128, MathError> {
    if a.is_zero() || b == 0 {
        return Ok(0);
    }
    if c == 0 {
        return Err(MathError::DivByZero);
    }
    let x = a;
    let y = U256::try_from(b).unwrap();
    let z = U256::try_from(c).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(z.checked_mul(E6_U128.into()).unwrap())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e8_mul_e6_to_e6_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }

    let x = U256::try_from(a).unwrap();
    let y = U256::try_from(b).unwrap();
    match u128::try_from(
        x.checked_mul(y)
            .unwrap()
            .checked_div(E8_U128.into())
            .unwrap(),
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn calculate_amount_to_take(
    amount_to_repay: &u128,
    asset_to_repay_price_e8: &u128,
    asset_to_take_price_e8: &u128,
    reserve_to_repay_decimals: &u128,
    reserve_to_take_decimals: &u128,
    penalty_to_repay_e6: &u128,
    penalty_to_take_e6: &u128,
) -> Result<u128, MathError> {
    let a = U256::try_from(*amount_to_repay).unwrap();
    let b = U256::try_from(*asset_to_repay_price_e8).unwrap();
    let c = U256::try_from(*reserve_to_take_decimals).unwrap();
    let l = U256::try_from(*penalty_to_repay_e6).unwrap();
    let m = U256::try_from(*penalty_to_take_e6).unwrap();
    let x = U256::try_from(*asset_to_take_price_e8).unwrap();
    let y = U256::try_from(*reserve_to_repay_decimals).unwrap();

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
