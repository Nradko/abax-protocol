use pendzl::math::errors::MathError;

use primitive_types::U256;

use super::{E10_U128, E18_U128, E6_U128, E8_U128};

// a*b/d + x + y
pub fn mul_div_add_add_u64(
    a: u64,
    b: u64,
    d: u64,
    x: u64,
    y: u64,
) -> Result<u64, MathError> {
    a.checked_mul(b)
        .ok_or(MathError::Overflow)?
        .checked_div(d)
        .ok_or(MathError::DivByZero)?
        .checked_add(x)
        .ok_or(MathError::Overflow)?
        .checked_add(y)
        .ok_or(MathError::Overflow)
}

pub fn e18_mul_e18_to_e18_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    if a == E18_U128 {
        return Ok(b);
    }
    if b == E18_U128 {
        return Ok(a);
    }
    let x = U256::from(a);
    let y = U256::from(b);
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
    if a == E18_U128 {
        return Ok(b);
    }
    if b == E18_U128 {
        return Ok(a);
    }
    let x = U256::from(a);
    let y = U256::from(b);
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

pub fn e18_mul_e0_to_e18_rdown(a: u64, b: u64) -> u128 {
    if a == 0 || b == 0 {
        return 0;
    }
    let x: u128 = a.into();
    let y: u128 = b.into();
    x.checked_mul(y).unwrap()
}

pub fn e18_mul_e0_to_e18_rup(a: u64, b: u64) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x: u128 = a.into();
    let y: u128 = b.into();
    x.checked_mul(y)
        .unwrap()
        .checked_add(1)
        .ok_or(MathError::Overflow)
}

// pub fn e24_mul_e0_to_e18_rup(a: u128, b: u128) -> Result<u128, MathError> {
//     if a == 0 || b == 0 {
//         return Ok(0);
//     }
//     let x = U256::try_from(a).unwrap();
//     let y = U256::try_from(b).unwrap();
//     match u128::try_from(
//         x.checked_mul(y)
//             .unwrap()
//             .checked_div(E6_U128.into())
//             .unwrap()
//             .checked_add(1.into())
//             .unwrap(),
//     ) {
//         Ok(v) => Ok(v),
//         _ => Err(MathError::Overflow),
//     }
// }

pub fn e18_mul_e0_to_e0_rdown(a: u128, b: u128) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    let x = U256::from(a);
    let y = U256::from(b);
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
    let x = U256::from(a);
    let y = U256::from(b);
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

pub fn e18_mul_e18_div_e18_to_e18_rdown(
    a: u128,
    b: u64,
    c: u128,
) -> Result<u64, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    if c == 0 {
        return Err(MathError::DivByZero);
    }
    let x = U256::from(a);
    let y = U256::from(b);
    let z = U256::from(c);
    match u64::try_from(x.checked_mul(y).unwrap().checked_div(z).unwrap()) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e0_mul_e18_div_e18_to_e0_rdown(
    a: u128,
    b: u128,
    c: u128,
) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    if c == 0 {
        return Err(MathError::DivByZero);
    }
    let x = U256::from(a);
    let y = U256::from(b);
    let z = U256::from(c);
    // x*y cant overflow and z != 0
    match u128::try_from(
        x.checked_mul(y)
            .ok_or(MathError::Overflow)?
            .checked_div(z)
            .ok_or(MathError::DivByZero)?,
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e0_mul_e18_div_e18_to_e0_rup(
    a: u128,
    b: u128,
    c: u128,
) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }
    if c == 0 {
        return Err(MathError::DivByZero);
    }
    let x = U256::from(a);
    let y = U256::from(b);
    let z = U256::from(c);
    // x*y cant overflow and z != 0
    match u128::try_from(
        x.checked_mul(y)
            .ok_or(MathError::Overflow)?
            .checked_div(z)
            .ok_or(MathError::DivByZero)?,
    ) {
        Ok(v) => v.checked_add(1).ok_or(MathError::Overflow),
        _ => Err(MathError::Overflow),
    }
}

pub fn e0_mul_e6_to_e0_rup(a: u128, b: u32) -> Result<u128, MathError> {
    if a == 0 || b == 0 {
        return Ok(0);
    }

    let x = U256::from(a);
    let y = U256::from(b);
    let e6_u256 = U256::from(E6_U128);

    //x * y + 1 can't overflow, e6_u256 != 0
    match u128::try_from(
        x.checked_mul(y)
            .ok_or(MathError::Overflow)?
            .checked_div(e6_u256)
            .ok_or(MathError::DivByZero)?
            .checked_add(1.into())
            .ok_or(MathError::Overflow)?,
    ) {
        Ok(v) => Ok(v),
        _ => Err(MathError::Overflow),
    }
}

pub fn e18_mul_e6_div_e0_to_e18_rdown(
    a: U256,
    b: u128,
    c: u128,
) -> Result<u64, MathError> {
    if a.is_zero() || b == 0 {
        return Ok(0);
    }
    if c == 0 {
        return Err(MathError::DivByZero);
    }
    let x = a;
    let y = U256::from(b);
    let z = U256::from(c);
    match u64::try_from(
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

    let x = U256::from(a);
    let y = U256::from(b);
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
    let a = U256::from(*amount);
    let b = U256::from(*price_e18);
    let c = U256::from(decimal_multplier.checked_mul(E10_U128).unwrap()); // here e18 coming from price is adjusted to e8 // this should not fail as long decimal multiplier is smaller than 3 *10^28

    u128::try_from(a.checked_mul(b).unwrap().checked_div(c).unwrap()).unwrap()
}
