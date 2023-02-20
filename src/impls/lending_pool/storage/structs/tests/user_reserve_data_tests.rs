/// Unit tests.
#[cfg(not(feature = "ink-experimental-engine"))]
#[cfg(test)]
pub mod user_reserve_data_tests {
    use crate::impls::{
        constants::{
            DAY,
            E12,
            E18,
        },
        lending_pool::storage::structs::{
            reserve_data::ReserveData,
            tests::helpers::*,
            user_reserve_data::UserReserveData,
        },
    };
    use openbrush::traits::{
        Balance,
        Timestamp,
    };

    pub struct DvsUA {
        pub init_user_supplied: Balance,
        pub init_user_variable_borrowed: Balance,
        pub init_user_stable_borrowed: Balance,
        pub init_user_stable_borrow_rate_e18: u128,
        pub cumulative_supply_rate_index_e12: u128,
        pub cumulative_variable_borrow_rate_index_e12: u128,
        pub expected_supplied_difference: Balance,
        pub expected_variable_borrowed_difference: Balance,
        pub expected_stable_borrowed_difference: Balance,
        pub expected_stable_borrow_rate_difference_e18: u128,
        pub update_timestamp: Timestamp,
    }
    #[ink::test]
    fn dvx_user_accumulate() {
        pub struct TestCase {
            // init_supply
            is: Balance,
            // init varriable borrow
            ivb: Balance,
            // intit stable borrow
            isb: Balance,
            // init cumulative variable borrow rate index e12
            icvbr_e12: u128,
            // init avarage_stable_rate_e18
            iasr_e18: u128,
        }
        let mut tv: Vec<TestCase> = vec![];
        for _i in 1..10 {
            tv.push(TestCase {
                is: random_u128(0, 100 * E12),
                // init -variable_borrow
                ivb: random_u128(0, 100 * E12),
                // init stable borrow
                isb: random_u128(0, 100 * E12),
                // init cumulative variable borrow rate index
                icvbr_e12: random_u128(E12 + 1, 2 * E12),
                // init avarage_stable_rate_e18
                iasr_e18: random_u128(0, 100_000),
            });
        }

        let mut test_cases: Vec<DvsUA> = vec![];

        for t in tv {
            // init cummulative_supply_rate_index
            let si_e12 = random_u128(E12, t.icvbr_e12);
            test_cases.push(DvsUA {
                init_user_supplied: t.is,
                init_user_variable_borrowed: t.ivb,
                init_user_stable_borrowed: t.isb,
                cumulative_variable_borrow_rate_index_e12: t.icvbr_e12,
                cumulative_supply_rate_index_e12: si_e12,
                init_user_stable_borrow_rate_e18: t.iasr_e18,
                expected_supplied_difference: t.is * si_e12 / E12 - t.is,
                expected_variable_borrowed_difference: t.ivb * t.icvbr_e12 / E12 + 1 - t.ivb,
                expected_stable_borrowed_difference: t.isb * t.iasr_e18 * DAY / E18 + 1,
                expected_stable_borrow_rate_difference_e18: 0,
                update_timestamp: DAY as Timestamp,
            })
        }

        for case in test_cases {
            let mut init_reserve_data = ReserveData::default();
            init_reserve_data.indexes_update_timestamp = case.update_timestamp;
            init_reserve_data.cumulative_supply_rate_index_e18 = case.cumulative_supply_rate_index_e12;
            init_reserve_data.cumulative_variable_borrow_rate_index_e18 =
                case.cumulative_variable_borrow_rate_index_e12;

            let mut init_user_reserve_data = UserReserveData::my_default();
            init_user_reserve_data.supplied = case.init_user_supplied;
            init_user_reserve_data.variable_borrowed = case.init_user_variable_borrowed;
            init_user_reserve_data.stable_borrowed = case.init_user_stable_borrowed;
            init_user_reserve_data.stable_borrow_rate_e24 = case.init_user_stable_borrow_rate_e18;

            let mut final_reserve_data = init_reserve_data.clone();
            let mut final_user_reserve_data = init_user_reserve_data.clone();

            final_user_reserve_data._accumulate_user_interest(&mut final_reserve_data);

            let user_reserve_difference = UserReserveDataDifference {
                supplied: case.expected_supplied_difference as i128,
                variable_borrowed: case.expected_variable_borrowed_difference as i128,
                stable_borrowed: case.expected_stable_borrowed_difference as i128,
                applied_cumulative_supply_rate_index_e18: final_reserve_data.cumulative_supply_rate_index_e18 - E12,
                applied_cumulative_variable_borrow_rate_index_e18: final_reserve_data
                    .cumulative_variable_borrow_rate_index_e18
                    - E12,
                stable_borrow_rate_e18: case.expected_stable_borrow_rate_difference_e18 as i128,
                update_timestamp: final_reserve_data.indexes_update_timestamp,
            };

            assert_user_reserve_data_difference(
                init_user_reserve_data,
                final_user_reserve_data,
                user_reserve_difference,
            );
        }
    }

    #[derive(Debug, Default)]
    pub struct UserReserveDataDifference {
        supplied: i128,
        variable_borrowed: i128,
        stable_borrowed: i128,
        applied_cumulative_supply_rate_index_e18: u128,
        applied_cumulative_variable_borrow_rate_index_e18: u128,
        stable_borrow_rate_e18: i128,
        update_timestamp: Timestamp,
    }

    pub fn assert_user_reserve_data_difference(
        initital_user_reserve_data: UserReserveData,
        final_user_reserve_data: UserReserveData,
        differences: UserReserveDataDifference,
    ) {
        assert(
            initital_user_reserve_data.supplied,
            final_user_reserve_data.supplied,
            differences.supplied,
            "supplied".to_string(),
        );
        assert(
            initital_user_reserve_data.variable_borrowed,
            final_user_reserve_data.variable_borrowed,
            differences.variable_borrowed,
            "variable_borrowed".to_string(),
        );
        assert(
            initital_user_reserve_data.stable_borrowed,
            final_user_reserve_data.stable_borrowed,
            differences.stable_borrowed,
            "stable_borrowed".to_string(),
        );
        assert(
            initital_user_reserve_data.applied_cumulative_supply_rate_index_e18,
            final_user_reserve_data.applied_cumulative_supply_rate_index_e18,
            differences.applied_cumulative_supply_rate_index_e18,
            "applied_cumulative_supply_rate_index_e18".to_string(),
        );
        assert(
            initital_user_reserve_data.applied_cumulative_variable_borrow_rate_index_e18,
            final_user_reserve_data.applied_cumulative_variable_borrow_rate_index_e18,
            differences.applied_cumulative_variable_borrow_rate_index_e18,
            "applied_cumulative_variable_borrow_rate_index_e18".to_string(),
        );
        assert(
            initital_user_reserve_data.stable_borrow_rate_e24,
            final_user_reserve_data.stable_borrow_rate_e24,
            differences.stable_borrow_rate_e18,
            "stable_borrow_rate_e18".to_string(),
        );
        assert_timestamp(
            initital_user_reserve_data.update_timestamp,
            final_user_reserve_data.update_timestamp,
            differences.update_timestamp,
            "update_timestamp".to_string(),
        );
    }
}
