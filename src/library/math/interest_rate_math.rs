use pendzl::math::{errors::MathError, operations::mul_div};

use crate::structs::InterestRateModel;

use super::E6_U32;

pub fn utilization_rate_to_interest_rate_e18(
    utilization_rate_e6: u32,
    interest_rate_model: &InterestRateModel,
) -> Result<u64, MathError> {
    if utilization_rate_e6 == 0 {
        return Ok(0);
    }

    if utilization_rate_e6 <= interest_rate_model.target_ur_e6 {
        match u32::try_from(mul_div(
            utilization_rate_e6 as u128,
            interest_rate_model.rate_at_target_ur_e18 as u128,
            interest_rate_model.target_ur_e6 as u128,
            pendzl::math::operations::Rounding::Up,
        )?) {
            Ok(v) => Ok(v as u64),
            _ => Err(MathError::Overflow),
        }
    } else {
        let distance_from_target = utilization_rate_e6
            .saturating_sub(interest_rate_model.target_ur_e6);

        let max_distance_from_target =
            E6_U32.saturating_sub(interest_rate_model.target_ur_e6);

        let interest_step = interest_rate_model
            .rate_at_max_ur_e18
            .saturating_sub(interest_rate_model.rate_at_target_ur_e18);

        match u32::try_from(mul_div(
            distance_from_target as u128,
            interest_step as u128,
            max_distance_from_target as u128,
            pendzl::math::operations::Rounding::Up,
        )?) {
            Ok(v) => Ok(interest_rate_model
                .rate_at_target_ur_e18
                .checked_add(v as u64)
                .ok_or(MathError::Overflow)?),
            _ => Err(MathError::Overflow),
        }
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    const ONE_PERCENT_APR: u64 = 3_170_979;
    const TEN_PERCENT_APR: u64 = 10 * ONE_PERCENT_APR;
    const INTEREST_RATE_MDOEL: InterestRateModel = InterestRateModel {
        target_ur_e6: 900_000,                     // 90%
        min_rate_at_target_e18: ONE_PERCENT_APR, // 1%, not imporant for this test
        max_rate_at_target_e18: TEN_PERCENT_APR, // 10%, not imporant for this test
        rate_at_target_ur_e18: TEN_PERCENT_APR,  // 10%
        rate_at_max_ur_e18: 100 * ONE_PERCENT_APR, // 100%
        minimal_time_between_adjustments: 0,
        last_adjustment_timestamp: 0,
    };

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
            Ok(TEN_PERCENT_APR * 1 / 90)
        );
        //10%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                100_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(TEN_PERCENT_APR * 10 / 90)
        );

        //50%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                500_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(TEN_PERCENT_APR * 50 / 90)
        );

        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                900_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(TEN_PERCENT_APR)
        );
        //95%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                950_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(55 * ONE_PERCENT_APR)
        );

        //100%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                1_000_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(100 * ONE_PERCENT_APR)
        );

        //110%
        assert_eq!(
            utilization_rate_to_interest_rate_e18(
                1_100_000,
                &INTEREST_RATE_MDOEL
            ),
            Ok(190 * ONE_PERCENT_APR)
        );
    }
}
