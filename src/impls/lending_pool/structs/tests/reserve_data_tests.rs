/// Unit tests.
#[cfg(not(feature = "ink-experimental-engine"))]
#[cfg(test)]
pub mod reserve_data_tests {
    use pendzl::traits::Timestamp;

    use crate::impls::{
        constants::{DAY, E12, E6},
        lending_pool::storage::structs::{
            reserve_data::ReserveData, tests::helpers::*,
        },
    };
    use pendzl::traits::Balance;

    const YEAR: Timestamp = 365 * 24 * 60 * 60;
    const SUPPLY: Balance = E12;

    #[ink::test]
    fn xxx_recalculate() {
        let init_reserve_data = ReserveData::default();
        let mut final_reserve_data = init_reserve_data.clone();
        final_reserve_data._recalculate_current_rates();
        //
        assert_reserve_data_difference(
            init_reserve_data,
            final_reserve_data,
            ReserveDataDifference::default(),
        );
    }
    #[ink::test]

    fn xxx_accumulate() {
        let init_reserve_data = ReserveData::default();
        let mut final_reserve_data = init_reserve_data.clone();

        final_reserve_data._accumulate_interest(YEAR);

        let mut differences = ReserveDataDifference::default();
        differences.indexes_update_timestamp += YEAR;
        assert_reserve_data_difference(
            init_reserve_data,
            final_reserve_data,
            differences,
        );
    }

    #[ink::test]
    fn dxx_recalculate() {
        let mut init_reserve_data = ReserveData::default();
        init_reserve_data.total_deposit += SUPPLY;
        let mut final_reserve_data = init_reserve_data.clone();

        final_reserve_data._recalculate_current_rates();

        assert_reserve_data_difference(
            init_reserve_data,
            final_reserve_data,
            ReserveDataDifference::default(),
        );
    }

    #[ink::test]
    fn dxx_accumulate() {
        let mut init_reserve_data = ReserveData::default();
        init_reserve_data.total_deposit += SUPPLY;
        let mut final_reserve_data = init_reserve_data.clone();

        final_reserve_data._accumulate_interest(YEAR);

        let mut differences = ReserveDataDifference::default();
        differences.indexes_update_timestamp += YEAR;
        assert_reserve_data_difference(
            init_reserve_data,
            final_reserve_data,
            differences,
        );
    }

    pub struct DvxR {
        total_deposit: Balance,
        total_debt: Balance,
        expected_current_variable_rate_difference_e18: u128,
        expected_current_supply_rate_difference_e18: u128,
    }
    #[ink::test]
    fn dvx_recalculate() {
        let [t50, t60, t70, t80, t90, t95, t100] =
            ReserveData::default().interest_rate_model;
        pub struct TestData {
            // utilization_rate
            ur: u128,
            // expected_variable_rate
            evr_e18: u128,
        }
        let tv: Vec<TestData> = vec![
            TestData {
                ur: 1,
                evr_e18: t50 / 50 + 1,
            },
            TestData {
                ur: 25,
                evr_e18: 25 * t50 / 50 + 1,
            },
            TestData {
                ur: 50,
                evr_e18: 50 * t50 / 50 + 1,
            },
            TestData {
                ur: 55,
                evr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
            },
            TestData {
                ur: 60,
                evr_e18: t60 + 1,
            },
            TestData {
                ur: 65,
                evr_e18: t60 + 5 * (t70 - t60) / 10 + 1,
            },
            TestData {
                ur: 70,
                evr_e18: t70 + 1,
            },
            TestData {
                ur: 75,
                evr_e18: t70 + 5 * (t80 - t70) / 10 + 1,
            },
            TestData {
                ur: 80,
                evr_e18: t80 + 1,
            },
            TestData {
                ur: 85,
                evr_e18: t80 + 5 * (t90 - t80) / 10 + 1,
            },
            TestData {
                ur: 90,
                evr_e18: t90 + 1,
            },
            TestData {
                ur: 92,
                evr_e18: t90 + 2 * (t95 - t90) / 5 + 1,
            },
            TestData {
                ur: 95,
                evr_e18: t95 + 1,
            },
            TestData {
                ur: 97,
                evr_e18: t95 + 2 * (t100 - t95) / 5 + 1,
            },
            TestData {
                ur: 100,
                evr_e18: t100 + 1,
            },
            TestData {
                ur: 105,
                evr_e18: 105 * t100 / 100 + 1,
            },
        ];
        let mut test_cases: Vec<DvxR> = vec![];

        for t in tv {
            test_cases.push(DvxR {
                total_deposit: SUPPLY,
                total_debt: t.ur * SUPPLY / 100,
                expected_current_variable_rate_difference_e18: t.evr_e18,
                expected_current_supply_rate_difference_e18: t.ur * t.evr_e18
                    / 100,
            });
        }

        for case in test_cases {
            let mut init_reserve_data = ReserveData::default();
            init_reserve_data.total_deposit = case.total_deposit;
            init_reserve_data.total_debt = case.total_debt;
            let mut final_reserve_data = init_reserve_data.clone();

            final_reserve_data._recalculate_current_rates();

            let mut differences = ReserveDataDifference::default();
            differences.current_supply_rate_e24 =
                case.expected_current_supply_rate_difference_e18;
            differences.current_debt_rate_e24 =
                case.expected_current_variable_rate_difference_e18;
            assert_reserve_data_difference(
                init_reserve_data,
                final_reserve_data,
                differences,
            );
        }
    }

    pub struct DvxA {
        init_total_deposit: Balance,
        init_total_debt: Balance,

        time_travel: Timestamp,

        expected_current_supply_rate_difference_e18: u128,
        expected_current_variable_rate_difference_e18: u128,
        expected_cummulative_suply_rate_index_difference_e12: u128,
        expected_cummulative_variable_borrow_rate_index_difference_e12: u128,
        expected_total_deposit_difference: Balance,
        expected_total_debt_difference: Balance,
    }
    #[ink::test]
    fn dvx_accumulate() {
        let [t50, t60, t70, t80, t90, t95, t100] =
            ReserveData::default().interest_rate_model;
        pub struct TestData {
            // utilization_rate
            ur: u128,
            // expected_variable_rate
            evr_e18: u128,
        }
        let tv: Vec<TestData> = vec![
            TestData {
                ur: 1,
                evr_e18: t50 / 50 + 1,
            },
            TestData {
                ur: 25,
                evr_e18: 25 * t50 / 50 + 1,
            },
            TestData {
                ur: 50,
                evr_e18: 50 * t50 / 50 + 1,
            },
            TestData {
                ur: 55,
                evr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
            },
            TestData {
                ur: 60,
                evr_e18: t60 + 1,
            },
            TestData {
                ur: 65,
                evr_e18: t60 + 5 * (t70 - t60) / 10 + 1,
            },
            TestData {
                ur: 70,
                evr_e18: t70 + 1,
            },
            TestData {
                ur: 75,
                evr_e18: t70 + 5 * (t80 - t70) / 10 + 1,
            },
            TestData {
                ur: 80,
                evr_e18: t80 + 1,
            },
            TestData {
                ur: 85,
                evr_e18: t80 + 5 * (t90 - t80) / 10 + 1,
            },
            TestData {
                ur: 90,
                evr_e18: t90 + 1,
            },
            TestData {
                ur: 92,
                evr_e18: t90 + 2 * (t95 - t90) / 5 + 1,
            },
            TestData {
                ur: 95,
                evr_e18: t95 + 1,
            },
            TestData {
                ur: 97,
                evr_e18: t95 + 2 * (t100 - t95) / 5 + 1,
            },
            TestData {
                ur: 100,
                evr_e18: t100 + 1,
            },
            TestData {
                ur: 105,
                evr_e18: 105 * t100 / 100 + 1,
            },
        ];
        let mut test_cases: Vec<DvxA> = vec![];

        for t in tv {
            test_cases.push(DvxA {
                init_total_deposit: SUPPLY,
                init_total_debt: t.ur * SUPPLY / 100,

                time_travel: DAY as Timestamp,
                expected_current_variable_rate_difference_e18: t.evr_e18,
                expected_current_supply_rate_difference_e18: t.ur * t.evr_e18 / 100,
                expected_cummulative_variable_borrow_rate_index_difference_e12: t.evr_e18 * DAY / E6,
                expected_cummulative_suply_rate_index_difference_e12: t.ur * t.evr_e18 / 100 * DAY / E6,
                expected_total_debt_difference: SUPPLY * t.ur / 100 * (t.evr_e18 * DAY / E6) / E12,
                expected_total_deposit_difference: SUPPLY * (t.ur * t.evr_e18 / 100 * DAY / E6) / E12,
            });
        }
        for case in test_cases {
            let mut init_reserve_data = ReserveData::default();
            init_reserve_data.total_deposit = case.init_total_deposit;
            init_reserve_data.total_debt = case.init_total_debt;

            let mut final_reserve_data = init_reserve_data.clone();

            final_reserve_data._recalculate_current_rates();
            final_reserve_data._accumulate_interest(case.time_travel);

            let mut differences = ReserveDataDifference::default();
            differences.current_supply_rate_e24 =
                case.expected_current_supply_rate_difference_e18;
            differences.current_debt_rate_e24 =
                case.expected_current_variable_rate_difference_e18;
            differences.cumulative_supply_rate_index_e12 =
                case.expected_cummulative_suply_rate_index_difference_e12;
            differences.cumulative_variable_borrow_rate_index_e12 = case
                .expected_cummulative_variable_borrow_rate_index_difference_e12;
            differences.total_deposit =
                case.expected_total_deposit_difference as i128;
            differences.total_debt =
                case.expected_total_debt_difference as i128;
            differences.indexes_update_timestamp = case.time_travel;
            assert_reserve_data_difference(
                init_reserve_data,
                final_reserve_data,
                differences,
            );
        }
    }

    #[derive(Debug, Default)]
    pub struct ReserveDataDifference {
        total_deposit: i128,
        cumulative_supply_rate_index_e12: u128,
        current_supply_rate_e24: u128,
        total_debt: i128,
        cumulative_variable_borrow_rate_index_e12: u128,
        current_debt_rate_e24: u128,
        indexes_update_timestamp: Timestamp,
    }

    pub fn assert_reserve_data_difference(
        initital_reserve_data: ReserveData,
        final_reserve_data: ReserveData,
        differences: ReserveDataDifference,
    ) {
        assert_timestamp(
            initital_reserve_data.indexes_update_timestamp,
            final_reserve_data.indexes_update_timestamp,
            differences.indexes_update_timestamp,
            "indexes_update_timestamp".to_string(),
        );
        assert(
            initital_reserve_data.current_debt_rate_e24,
            final_reserve_data.current_debt_rate_e24,
            differences.current_debt_rate_e24,
            "current_debt_rate_e24".to_string(),
        );
        assert(
            initital_reserve_data.current_supply_rate_e24,
            final_reserve_data.current_supply_rate_e24,
            differences.current_supply_rate_e24,
            "current_supply_rate_e24".to_string(),
        );
        assert(
            initital_reserve_data.cumulative_debt_rate_index_e18,
            final_reserve_data.cumulative_debt_rate_index_e18,
            differences.cumulative_variable_borrow_rate_index_e12,
            "cumulative_variable_borrow_rate_index_e12".to_string(),
        );
        assert(
            initital_reserve_data.cumulative_supply_rate_index_e18,
            final_reserve_data.cumulative_supply_rate_index_e18,
            differences.cumulative_supply_rate_index_e12,
            "cumulative_supply_rate_index_e12".to_string(),
        );
        assert(
            initital_reserve_data.total_debt,
            final_reserve_data.total_debt,
            differences.total_debt,
            "total_debt".to_string(),
        );
        assert(
            initital_reserve_data.total_deposit,
            final_reserve_data.total_deposit,
            differences.total_deposit,
            "total_supply".to_string(),
        );
    }
}
