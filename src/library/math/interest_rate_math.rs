// calcualtes prev_step + (step-prev_step)*(step_position-utilization_rate)/(step_position - prev_step_position) + 1
pub fn calculate_interest_rate_e18(
    prev_step: u64,
    step: u64,
    prev_step_position: u64,
    step_position: u64,
    utilization_rate_e6: u64,
) -> Result<u64, MathError> {
    let step_diff: u64 =
        step.checked_sub(prev_step).ok_or(MathError::Underflow)?;

    let position_diff: u64 = step_position
        .checked_sub(prev_step_position)
        .ok_or(MathError::Underflow)?;

    let this_step_increase: u64 = step_diff
        .checked_mul(
            utilization_rate_e6
                .checked_sub(prev_step_position)
                .ok_or(MathError::Underflow)?,
        )
        .ok_or(MathError::Overflow)?
        .checked_div(position_diff)
        .ok_or(MathError::DivByZero)?
        .checked_add(1)
        .ok_or(MathError::Overflow)?;

    prev_step
        .checked_add(this_step_increase)
        .ok_or(MathError::Overflow)
}

type InterestRateModel = [u64; 7];
pub fn utilization_rate_to_interest_rate_e18(
    utilization_rate_e6: u64,
    interest_rate_model: &InterestRateModel,
) -> Result<u64, MathError> {
    let [t68, t84, t92, t96, t98, t99, t100]: InterestRateModel =
        *interest_rate_model;
    Ok(match utilization_rate_e6 {
        0 => 0,
        1..=680_000 => calculate_interest_rate_e18(
            0,
            t68,
            0,
            680_000,
            utilization_rate_e6,
        )?,
        680_001..=840_000 => calculate_interest_rate_e18(
            t68,
            t84,
            680_000,
            840_000,
            utilization_rate_e6,
        )?,
        840_001..=920_000 => calculate_interest_rate_e18(
            t84,
            t92,
            840_000,
            920_000,
            utilization_rate_e6,
        )?,
        920_001..=960_000 => calculate_interest_rate_e18(
            t92,
            t96,
            920_000,
            960_000,
            utilization_rate_e6,
        )?,
        960_001..=980_000 => calculate_interest_rate_e18(
            t96,
            t98,
            960_000,
            980_000,
            utilization_rate_e6,
        )?,
        980_001..=990_000 => calculate_interest_rate_e18(
            t98,
            t99,
            980_000,
            990_000,
            utilization_rate_e6,
        )?,
        990_001..=1_000_000 => calculate_interest_rate_e18(
            t99,
            t100,
            990_000,
            1_000_000,
            utilization_rate_e6,
        )?,
        _ => t100
            .checked_mul(utilization_rate_e6)
            .ok_or(MathError::Overflow)?
            .checked_div(E6_U64)
            .unwrap()
            .checked_add(1)
            .ok_or(MathError::Overflow)?,
    })
}

#[cfg(test)]
mod tests {

    use super::*;

    const INTEREST_RATE_MDOEL: InterestRateModel = [
        300_000,
        500_000,
        2_000_000,
        4_000_000,
        10_000_000,
        100_000_000,
        300_000_000,
    ];

    #[test]
    fn calculate_interest_rate_test() {
        assert_eq!(
            calculate_interest_rate_e18(0, 300_000, 0, 680_000, 10_000),
            Ok(4_412)
        );
    }

    #[test]
    fn utilization_rate_to_interest_rate_e18_tests() {
        //0%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(0, &INTEREST_RATE_MDOEL),
            Ok(0)
        );
        //1%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(10_000, &INTEREST_RATE_MDOEL),
            Ok(4_412) // 300_000 / 68
        );
        //10% 300_000 / 68
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                100_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(44_118) // 300_000 / 68 * 10
        );
        //34%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                340_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(150_001) // 300_000 / 68 * 34
        );
        //68%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                680_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(300_001) // 300_000
        );
        //76%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                760_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(400_001) // // 300_000  + (500_000 - 300_000) / 2
        );
        //84%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                840_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(500_001)
        );

        //88%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                880_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(1_250_001)
        );
        //92%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                920_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(2_000_001)
        );
        //94%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                940_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(3_000_001)
        );
        //96%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                960_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(4_000_001)
        );
        //97%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                970_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(7_000_001)
        );
        //98%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                980_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(10_000_001)
        );
        //98,5%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                985_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(55_000_001)
        );
        //99%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                990_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(100_000_001)
        );
        //99,5%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                995_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(200_000_001)
        );
        //100%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                1_000_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(300_000_001)
        );
        //110%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                1_100_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(330_000_001) // 300_000_000 * 1.1
        );
    }
}
