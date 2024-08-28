// SPDX-License-Identifier: BUSL-1.1
use pendzl::{math::errors::MathError, traits::Timestamp};

use crate::math::interest_rate_math::utilization_rate_to_interest_rate_e18;

/// used to manage interest rate model
#[derive(Debug, Default, scale::Encode, scale::Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct InterestRateModelParams {
    pub target_ur_e6: u32,
    pub min_rate_at_target_e18: u64,
    pub max_rate_at_target_e18: u64,

    pub rate_at_max_ur_e18: u64,

    pub minimal_time_between_adjustments: u64,
}

/// type used to represent interest rate model
#[derive(Debug, Default, scale::Encode, scale::Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct InterestRateModel {
    pub target_ur_e6: u32,
    pub min_rate_at_target_e18: u64,
    pub max_rate_at_target_e18: u64,

    pub rate_at_target_ur_e18: u64,
    pub rate_at_max_ur_e18: u64,

    pub minimal_time_between_adjustments: u64,
    pub last_adjustment_timestamp: u64,
}

impl InterestRateModel {
    pub fn new(params: InterestRateModelParams, timestamp: Timestamp) -> Self {
        InterestRateModel {
            target_ur_e6: params.target_ur_e6,
            min_rate_at_target_e18: params.min_rate_at_target_e18,
            max_rate_at_target_e18: params.max_rate_at_target_e18,
            rate_at_target_ur_e18: params.min_rate_at_target_e18,
            rate_at_max_ur_e18: params.rate_at_max_ur_e18,
            minimal_time_between_adjustments: params
                .minimal_time_between_adjustments,
            last_adjustment_timestamp: timestamp,
        }
    }
}

impl InterestRateModel {
    pub fn adjust_rate_at_target(
        &mut self,
        utilization_rate_e6: u32,
        timestamp: Timestamp,
    ) -> Result<u64, MathError> {
        let current_rate_e18 =
            utilization_rate_to_interest_rate_e18(utilization_rate_e6, self)?;

        if current_rate_e18 < self.min_rate_at_target_e18 {
            self.rate_at_target_ur_e18 = self.min_rate_at_target_e18;
        } else if current_rate_e18 > self.max_rate_at_target_e18 {
            self.rate_at_target_ur_e18 = self.max_rate_at_target_e18;
        } else {
            self.rate_at_target_ur_e18 = current_rate_e18;
        }

        self.last_adjustment_timestamp = timestamp;

        Ok(self.rate_at_target_ur_e18)
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    const ONE_PERCENT_APR_E18: u64 = 3_170_979;
    const TEN_PERCENT_APR: u64 = 10 * ONE_PERCENT_APR_E18;
    const INTEREST_RATE_MDOEL: InterestRateModel = InterestRateModel {
        target_ur_e6: 900_000,                         // 90%
        min_rate_at_target_e18: ONE_PERCENT_APR_E18,   // 1%,
        max_rate_at_target_e18: 2 * TEN_PERCENT_APR,   // 10%,
        rate_at_target_ur_e18: TEN_PERCENT_APR,        // 10%
        rate_at_max_ur_e18: 100 * ONE_PERCENT_APR_E18, // 100%
        minimal_time_between_adjustments: 0,
        last_adjustment_timestamp: 0,
    };

    #[test]
    fn adjust_rate_at_target() {
        //0%
        assert_eq!(
            INTEREST_RATE_MDOEL.clone().adjust_rate_at_target(0, 1),
            Ok(INTEREST_RATE_MDOEL.min_rate_at_target_e18)
        );
        //100%
        assert_eq!(
            INTEREST_RATE_MDOEL
                .clone()
                .adjust_rate_at_target(1_000_000, 1),
            Ok(INTEREST_RATE_MDOEL.max_rate_at_target_e18)
        );

        //45%
        assert_eq!(
            INTEREST_RATE_MDOEL
                .clone()
                .adjust_rate_at_target(450_000, 1),
            Ok(TEN_PERCENT_APR / 2)
        );

        //91%
        assert_eq!(
            INTEREST_RATE_MDOEL
                .clone()
                .adjust_rate_at_target(910_000, 1),
            Ok(19 * ONE_PERCENT_APR_E18)
        );
    }
}
