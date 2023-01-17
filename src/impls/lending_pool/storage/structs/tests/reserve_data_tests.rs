/// Unit tests.
#[cfg(not(feature = "ink-experimental-engine"))]
#[cfg(test)]
pub mod reserve_data_tests {
    use openbrush::traits::Timestamp;

    use crate::impls::{
        constants::{
            DAY,
            E12,
            E18,
            E6,
        },
        lending_pool::storage::structs::{
            reserve_data::ReserveData,
            tests::helpers::*,
        },
    };

    use ink_lang as ink;

    use openbrush::traits::Balance;

    const YEAR: Timestamp = 365 * 24 * 60 * 60;
    const SUPPLY: Balance = E12;

    #[ink::test]
    fn xxx_recalculate() {
        let init_reserve_data = ReserveData::my_default();
        let mut final_reserve_data = init_reserve_data.clone();
        final_reserve_data._recalculate_current_rates().unwrap_or_default();
        //
        assert_reserve_data_difference(init_reserve_data, final_reserve_data, ReserveDataDifference::default());
    }
    #[ink::test]

    fn xxx_accumulate() {
        let init_reserve_data = ReserveData::my_default();
        let mut final_reserve_data = init_reserve_data.clone();

        final_reserve_data._accumulate_interest(YEAR);

        let mut differences = ReserveDataDifference::default();
        differences.indexes_update_timestamp += YEAR;
        assert_reserve_data_difference(init_reserve_data, final_reserve_data, differences);
    }

    #[ink::test]
    fn dxx_recalculate() {
        let mut init_reserve_data = ReserveData::my_default();
        init_reserve_data.total_supplied += SUPPLY;
        let mut final_reserve_data = init_reserve_data.clone();

        final_reserve_data._recalculate_current_rates().unwrap_or_default();

        assert_reserve_data_difference(init_reserve_data, final_reserve_data, ReserveDataDifference::default());
    }

    #[ink::test]
    fn dxx_accumulate() {
        let mut init_reserve_data = ReserveData::my_default();
        init_reserve_data.total_supplied += SUPPLY;
        let mut final_reserve_data = init_reserve_data.clone();

        final_reserve_data._accumulate_interest(YEAR);

        let mut differences = ReserveDataDifference::default();
        differences.indexes_update_timestamp += YEAR;
        assert_reserve_data_difference(init_reserve_data, final_reserve_data, differences);
    }

    pub struct DvxR {
        total_supplied: Balance,
        total_variable_borrowed: Balance,
        expected_current_variable_rate_difference_e18: u128,
        expected_current_supply_rate_difference_e18: u128,
    }
    #[ink::test]
    fn dvx_recalculate() {
        let [t50, t60, t70, t80, t90, t95, t100] = ReserveData::my_default().interest_rate_model;
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
                total_supplied: SUPPLY,
                total_variable_borrowed: t.ur * SUPPLY / 100,
                expected_current_variable_rate_difference_e18: t.evr_e18,
                expected_current_supply_rate_difference_e18: t.ur * t.evr_e18 / 100,
            });
        }

        for case in test_cases {
            let mut init_reserve_data = ReserveData::my_default();
            init_reserve_data.total_supplied = case.total_supplied;
            init_reserve_data.total_variable_borrowed = case.total_variable_borrowed;
            let mut final_reserve_data = init_reserve_data.clone();

            final_reserve_data._recalculate_current_rates().unwrap_or_default();

            let mut differences = ReserveDataDifference::default();
            differences.current_supply_rate_e24 = case.expected_current_supply_rate_difference_e18;
            differences.current_variable_borrow_rate_e24 = case.expected_current_variable_rate_difference_e18;
            assert_reserve_data_difference(init_reserve_data, final_reserve_data, differences);
        }
    }

    pub struct DvxA {
        init_total_supplied: Balance,
        init_total_variable_borrowed: Balance,

        time_travel: Timestamp,

        expected_current_supply_rate_difference_e18: u128,
        expected_current_variable_rate_difference_e18: u128,
        expected_cummulative_suply_rate_index_difference_e12: u128,
        expected_cummulative_variable_borrow_rate_index_difference_e12: u128,
        expected_total_supplied_difference: Balance,
        expected_total_variable_borrowed_difference: Balance,
    }
    #[ink::test]
    fn dvx_accumulate() {
        let [t50, t60, t70, t80, t90, t95, t100] = ReserveData::my_default().interest_rate_model;
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
                init_total_supplied: SUPPLY,
                init_total_variable_borrowed: t.ur * SUPPLY / 100,

                time_travel: DAY as Timestamp,
                expected_current_variable_rate_difference_e18: t.evr_e18,
                expected_current_supply_rate_difference_e18: t.ur * t.evr_e18 / 100,
                expected_cummulative_variable_borrow_rate_index_difference_e12: t.evr_e18 * DAY / E6,
                expected_cummulative_suply_rate_index_difference_e12: t.ur * t.evr_e18 / 100 * DAY / E6,
                expected_total_variable_borrowed_difference: SUPPLY * t.ur / 100 * (t.evr_e18 * DAY / E6) / E12,
                expected_total_supplied_difference: SUPPLY * (t.ur * t.evr_e18 / 100 * DAY / E6) / E12,
            });
        }
        for case in test_cases {
            let mut init_reserve_data = ReserveData::my_default();
            init_reserve_data.total_supplied = case.init_total_supplied;
            init_reserve_data.total_variable_borrowed = case.init_total_variable_borrowed;

            let mut final_reserve_data = init_reserve_data.clone();

            final_reserve_data._recalculate_current_rates().unwrap_or_default();
            final_reserve_data._accumulate_interest(case.time_travel);

            let mut differences = ReserveDataDifference::default();
            differences.current_supply_rate_e24 = case.expected_current_supply_rate_difference_e18;
            differences.current_variable_borrow_rate_e24 = case.expected_current_variable_rate_difference_e18;
            differences.cumulative_supply_rate_index_e12 = case.expected_cummulative_suply_rate_index_difference_e12;
            differences.cumulative_variable_borrow_rate_index_e12 =
                case.expected_cummulative_variable_borrow_rate_index_difference_e12;
            differences.total_supplied = case.expected_total_supplied_difference as i128;
            differences.total_variable_borrowed = case.expected_total_variable_borrowed_difference as i128;
            differences.indexes_update_timestamp = case.time_travel;
            assert_reserve_data_difference(init_reserve_data, final_reserve_data, differences);
        }
    }

    pub struct DvsR {
        total_supplied: Balance,
        total_variable_borrowed: Balance,
        sum_stable_debt: Balance,
        accumulated_stable_borrow: Balance,
        avarage_stable_rate_e18: u128,

        expected_current_supply_rate_e24: u128,
        expected_current_variable_rate_e18: u128,
    }
    #[ink::test]
    fn dvs_recalculate() {
        let [t50, t60, t70, t80, t90, t95, t100] = ReserveData::my_default().interest_rate_model;
        // (varaible_deposit_part, stable_deposit_part, accumulated_stable_debt_part, variable_interest_rate, average_stable_rate_base)
        pub struct TestData {
            // variable to suply rate * 100
            vts: u128,
            // sum_stable to suply rate * 100
            ssts: u128,
            // accumulated_stable to suply rate * 100
            asts: u128,
            // curent variable rate
            vr_e18: u128,
            // base  stable rate
            bsr_e18: u128,
        }
        let tv: Vec<TestData> = vec![
            TestData {
                vts: 1,
                ssts: 0,
                asts: 0,
                vr_e18: 1 * t50 / 50 + 1,
                bsr_e18: 1000,
            },
            TestData {
                vts: 0,
                ssts: 1,
                asts: 0,
                vr_e18: 1 * t50 / 50 + 1,
                bsr_e18: 2000,
            },
            TestData {
                vts: 1,
                ssts: 1,
                asts: 0,
                vr_e18: 2 * t50 / 50 + 1,
                bsr_e18: 3000,
            },
            TestData {
                vts: 0,
                ssts: 1,
                asts: 1,
                vr_e18: 2 * t50 / 50 + 1,
                bsr_e18: 4000,
            },
            TestData {
                vts: 1,
                ssts: 1,
                asts: 1,
                vr_e18: 3 * t50 / 50 + 1,
                bsr_e18: 5000,
            },
            TestData {
                vts: 25,
                ssts: 0,
                asts: 0,
                vr_e18: 25 * t50 / 50 + 1,
                bsr_e18: 1000,
            },
            TestData {
                vts: 25,
                ssts: 10,
                asts: 0,
                vr_e18: 35 * t50 / 50 + 1,
                bsr_e18: 2000,
            },
            TestData {
                vts: 25,
                ssts: 10,
                asts: 10,
                vr_e18: 45 * t50 / 50 + 1,
                bsr_e18: 3000,
            },
            TestData {
                vts: 0,
                ssts: 25,
                asts: 0,
                vr_e18: 25 * t50 / 50 + 1,
                bsr_e18: 4000,
            },
            TestData {
                vts: 0,
                ssts: 13,
                asts: 13,
                vr_e18: 26 * t50 / 50 + 1,
                bsr_e18: 5000,
            },
            TestData {
                vts: 50,
                ssts: 0,
                asts: 0,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 1000,
            },
            TestData {
                vts: 25,
                ssts: 25,
                asts: 0,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 2000,
            },
            TestData {
                vts: 0,
                ssts: 25,
                asts: 25,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 3000,
            },
            TestData {
                vts: 25,
                ssts: 20,
                asts: 5,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 4000,
            },
            TestData {
                vts: 55,
                ssts: 0,
                asts: 0,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 15,
                ssts: 40,
                asts: 0,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 20,
                ssts: 20,
                asts: 15,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 30,
                ssts: 24,
                asts: 1,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 60,
                ssts: 0,
                asts: 0,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 40,
                ssts: 20,
                asts: 0,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 30,
                ssts: 20,
                asts: 10,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 20,
                ssts: 20,
                asts: 20,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 15,
                ssts: 30,
                asts: 20,
                vr_e18: t60 + 5 * (t70 - t60) / 10 + 1,
                bsr_e18: 11111,
            },
            TestData {
                vts: 50,
                ssts: 10,
                asts: 10,
                vr_e18: t70 + 1,
                bsr_e18: 5112,
            },
            TestData {
                vts: 70,
                ssts: 0,
                asts: 5,
                vr_e18: t70 + 5 * (t80 - t70) / 10 + 1,
                bsr_e18: 777,
            },
            TestData {
                vts: 30,
                ssts: 30,
                asts: 20,
                vr_e18: t80 + 1,
                bsr_e18: 134321,
            },
            TestData {
                vts: 75,
                ssts: 9,
                asts: 1,
                vr_e18: t80 + 5 * (t90 - t80) / 10 + 1,
                bsr_e18: 111,
            },
            TestData {
                vts: 88,
                ssts: 2,
                asts: 0,
                vr_e18: t90 + 1,
                bsr_e18: 0,
            },
            TestData {
                vts: 82,
                ssts: 8,
                asts: 2,
                vr_e18: t90 + 2 * (t95 - t90) / 5 + 1,
                bsr_e18: 92929292,
            },
            TestData {
                vts: 0,
                ssts: 85,
                asts: 10,
                vr_e18: t95 + 1,
                bsr_e18: 95959595959,
            },
            TestData {
                vts: 90,
                ssts: 6,
                asts: 1,
                vr_e18: t95 + 2 * (t100 - t95) / 5 + 1,
                bsr_e18: 961961961,
            },
            TestData {
                vts: 44,
                ssts: 33,
                asts: 23,
                vr_e18: t100 + 1,
                bsr_e18: 44332211,
            },
            TestData {
                vts: 80,
                ssts: 40,
                asts: 10,
                vr_e18: 130 * t100 / 100 + 1,
                bsr_e18: 44332211,
            },
        ];
        // (sum_stable_debt, avarage_stable_rate_e18)
        let mut test_cases: Vec<DvsR> = vec![];

        for t in tv {
            test_cases.push(DvsR {
                total_supplied: SUPPLY,
                total_variable_borrowed: t.vts * SUPPLY / 100,
                sum_stable_debt: t.ssts * SUPPLY / 100,
                accumulated_stable_borrow: t.asts * SUPPLY / 100,
                avarage_stable_rate_e18: t.vr_e18 + t.bsr_e18,

                expected_current_variable_rate_e18: t.vr_e18,
                expected_current_supply_rate_e24: (t.vts * t.vr_e18 + t.ssts * (t.vr_e18 + t.bsr_e18)) / 100,
            });
        }

        for case in test_cases {
            print!("x");
            let mut init_reserve_data = ReserveData::my_default();
            init_reserve_data.total_supplied = case.total_supplied;
            init_reserve_data.total_variable_borrowed = case.total_variable_borrowed;
            init_reserve_data.sum_stable_debt = case.sum_stable_debt;
            init_reserve_data.accumulated_stable_borrow = case.accumulated_stable_borrow;
            init_reserve_data.avarage_stable_rate_e24 = case.avarage_stable_rate_e18;
            let mut final_reserve_data = init_reserve_data.clone();

            final_reserve_data._recalculate_current_rates().unwrap_or_default();

            let mut differences = ReserveDataDifference::default();
            differences.current_supply_rate_e24 = case.expected_current_supply_rate_e24;
            differences.current_variable_borrow_rate_e24 = case.expected_current_variable_rate_e18;
            assert_reserve_data_difference(init_reserve_data, final_reserve_data, differences);
        }
    }

    pub struct DvsA {
        init_total_supplied: Balance,
        init_total_variable_borrowed: Balance,
        sum_stable_debt: Balance,
        init_accumulated_stable_borrow: Balance,
        avarage_stable_rate_e18: u128,

        time_travel: Timestamp,

        expected_current_supply_rate_difference_e18: u128,
        expected_current_variable_rate_difference_e18: u128,
        expected_cummulative_suply_rate_index_difference_e12: u128,
        expected_cummulative_variable_borrow_rate_index_difference_e12: u128,
        expected_total_supplied_difference: i128,
        expected_total_variable_borrowed_difference: i128,
        expected_accumulated_stable_borrow_difference: i128,
    }
    #[ink::test]
    fn dvs_accumulate() {
        let [t50, t60, t70, t80, t90, t95, t100] = ReserveData::my_default().interest_rate_model;
        // (varaible_deposit_part, stable_deposit_part, accumulated_stable_debt_part, variable_interest_rate, average_stable_rate_base)
        pub struct TestData {
            // variable to suply rate * 100
            vts: u128,
            // sum_stable to suply rate * 100
            ssts: u128,
            // accumulated_stable to suply rate * 100
            asts: u128,
            // curent variable rate
            vr_e18: u128,
            // base  stable rate
            bsr_e18: u128,
        }
        let tv: Vec<TestData> = vec![
            TestData {
                vts: 1,
                ssts: 0,
                asts: 0,
                vr_e18: 1 * t50 / 50 + 1,
                bsr_e18: 1000,
            },
            TestData {
                vts: 0,
                ssts: 1,
                asts: 0,
                vr_e18: 1 * t50 / 50 + 1,
                bsr_e18: 2000,
            },
            TestData {
                vts: 1,
                ssts: 1,
                asts: 0,
                vr_e18: 2 * t50 / 50 + 1,
                bsr_e18: 3000,
            },
            TestData {
                vts: 0,
                ssts: 1,
                asts: 1,
                vr_e18: 2 * t50 / 50 + 1,
                bsr_e18: 4000,
            },
            TestData {
                vts: 1,
                ssts: 1,
                asts: 1,
                vr_e18: 3 * t50 / 50 + 1,
                bsr_e18: 5000,
            },
            TestData {
                vts: 25,
                ssts: 0,
                asts: 0,
                vr_e18: 25 * t50 / 50 + 1,
                bsr_e18: 1000,
            },
            TestData {
                vts: 25,
                ssts: 10,
                asts: 0,
                vr_e18: 35 * t50 / 50 + 1,
                bsr_e18: 2000,
            },
            TestData {
                vts: 25,
                ssts: 10,
                asts: 10,
                vr_e18: 45 * t50 / 50 + 1,
                bsr_e18: 3000,
            },
            TestData {
                vts: 0,
                ssts: 25,
                asts: 0,
                vr_e18: 25 * t50 / 50 + 1,
                bsr_e18: 4000,
            },
            TestData {
                vts: 0,
                ssts: 13,
                asts: 13,
                vr_e18: 26 * t50 / 50 + 1,
                bsr_e18: 5000,
            },
            TestData {
                vts: 50,
                ssts: 0,
                asts: 0,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 1000,
            },
            TestData {
                vts: 25,
                ssts: 25,
                asts: 0,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 2000,
            },
            TestData {
                vts: 0,
                ssts: 25,
                asts: 25,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 3000,
            },
            TestData {
                vts: 25,
                ssts: 20,
                asts: 5,
                vr_e18: 50 * t50 / 50 + 1,
                bsr_e18: 4000,
            },
            TestData {
                vts: 55,
                ssts: 0,
                asts: 0,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 15,
                ssts: 40,
                asts: 0,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 20,
                ssts: 20,
                asts: 15,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 30,
                ssts: 24,
                asts: 1,
                vr_e18: t50 + 5 * (t60 - t50) / 10 + 1,
                bsr_e18: 1234,
            },
            TestData {
                vts: 60,
                ssts: 0,
                asts: 0,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 40,
                ssts: 20,
                asts: 0,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 30,
                ssts: 20,
                asts: 10,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 20,
                ssts: 20,
                asts: 20,
                vr_e18: t60 + 1,
                bsr_e18: 1,
            },
            TestData {
                vts: 15,
                ssts: 30,
                asts: 20,
                vr_e18: t60 + 5 * (t70 - t60) / 10 + 1,
                bsr_e18: 11111,
            },
            TestData {
                vts: 50,
                ssts: 10,
                asts: 10,
                vr_e18: t70 + 1,
                bsr_e18: 5112,
            },
            TestData {
                vts: 70,
                ssts: 0,
                asts: 5,
                vr_e18: t70 + 5 * (t80 - t70) / 10 + 1,
                bsr_e18: 777,
            },
            TestData {
                vts: 30,
                ssts: 30,
                asts: 20,
                vr_e18: t80 + 1,
                bsr_e18: 134321,
            },
            TestData {
                vts: 75,
                ssts: 9,
                asts: 1,
                vr_e18: t80 + 5 * (t90 - t80) / 10 + 1,
                bsr_e18: 111,
            },
            TestData {
                vts: 88,
                ssts: 2,
                asts: 0,
                vr_e18: t90 + 1,
                bsr_e18: 0,
            },
            TestData {
                vts: 82,
                ssts: 8,
                asts: 2,
                vr_e18: t90 + 2 * (t95 - t90) / 5 + 1,
                bsr_e18: 92929292,
            },
            TestData {
                vts: 0,
                ssts: 85,
                asts: 10,
                vr_e18: t95 + 1,
                bsr_e18: 95959595959,
            },
            TestData {
                vts: 90,
                ssts: 6,
                asts: 1,
                vr_e18: t95 + 2 * (t100 - t95) / 5 + 1,
                bsr_e18: 961961961,
            },
            TestData {
                vts: 44,
                ssts: 33,
                asts: 23,
                vr_e18: t100 + 1,
                bsr_e18: 44332211,
            },
            TestData {
                vts: 80,
                ssts: 40,
                asts: 10,
                vr_e18: 130 * t100 / 100 + 1,
                bsr_e18: 44332211,
            },
        ];
        // (sum_stable_debt, avarage_stable_rate_e18)
        let mut test_cases: Vec<DvsA> = vec![];

        for t in tv {
            test_cases.push(DvsA {
                init_total_supplied: SUPPLY,
                init_total_variable_borrowed: t.vts * SUPPLY / 100,
                sum_stable_debt: t.ssts * SUPPLY / 100,
                init_accumulated_stable_borrow: t.asts * SUPPLY / 100,
                avarage_stable_rate_e18: t.vr_e18 + t.bsr_e18,

                time_travel: DAY as Timestamp,

                expected_current_variable_rate_difference_e18: t.vr_e18,
                expected_current_supply_rate_difference_e18: (t.vts * t.vr_e18 + t.ssts * (t.vr_e18 + t.bsr_e18)) / 100,
                expected_cummulative_variable_borrow_rate_index_difference_e12: t.vr_e18 * DAY / E6,
                expected_cummulative_suply_rate_index_difference_e12: (t.vts * t.vr_e18
                    + t.ssts * (t.vr_e18 + t.bsr_e18))
                    / 100
                    * DAY
                    / E6,
                expected_total_variable_borrowed_difference: (SUPPLY * (t.vts * (t.vr_e18 * DAY) / 100) / E18) as i128,
                expected_accumulated_stable_borrow_difference: (SUPPLY
                    * (t.ssts * (t.vr_e18 + t.bsr_e18) * DAY / 100 / E6)
                    / E12) as i128,
                expected_total_supplied_difference: (SUPPLY
                    * ((t.vts * t.vr_e18 + t.ssts * (t.vr_e18 + t.bsr_e18)) / 100 * DAY / E6)
                    / E12) as i128,
            });
        }
        // /(E12 * t.vts * (t.vts * t.vr_e18 + t.ssts * (t.vr_e18 + t.bsr_e18)) / 100 * DAY)as i128,
        for case in test_cases {
            print!("x");
            let mut init_reserve_data = ReserveData::my_default();
            init_reserve_data.total_supplied = case.init_total_supplied;
            init_reserve_data.total_variable_borrowed = case.init_total_variable_borrowed;
            init_reserve_data.sum_stable_debt = case.sum_stable_debt;
            init_reserve_data.accumulated_stable_borrow = case.init_accumulated_stable_borrow;
            init_reserve_data.avarage_stable_rate_e24 = case.avarage_stable_rate_e18;
            let mut final_reserve_data = init_reserve_data.clone();

            final_reserve_data._recalculate_current_rates().unwrap_or_default();
            final_reserve_data._accumulate_interest(DAY as Timestamp);

            let mut differences = ReserveDataDifference::default();
            differences.indexes_update_timestamp = case.time_travel;
            differences.current_variable_borrow_rate_e24 = case.expected_current_variable_rate_difference_e18;
            differences.current_supply_rate_e24 = case.expected_current_supply_rate_difference_e18;
            differences.cumulative_variable_borrow_rate_index_e12 =
                case.expected_cummulative_variable_borrow_rate_index_difference_e12;
            differences.cumulative_supply_rate_index_e12 = case.expected_cummulative_suply_rate_index_difference_e12;
            differences.total_supplied = case.expected_total_supplied_difference;
            differences.total_variable_borrowed = case.expected_total_variable_borrowed_difference;
            differences.accumulated_stable_borrow = case.expected_accumulated_stable_borrow_difference;
            assert_reserve_data_difference(init_reserve_data, final_reserve_data, differences);
        }
    }

    #[derive(Debug, Default)]
    pub struct ReserveDataDifference {
        total_supplied: i128,
        cumulative_supply_rate_index_e12: u128,
        current_supply_rate_e24: u128,
        total_variable_borrowed: i128,
        cumulative_variable_borrow_rate_index_e12: u128,
        current_variable_borrow_rate_e24: u128,
        sum_stable_debt: i128,
        accumulated_stable_borrow: i128,
        avarage_stable_rate_e12: i128,
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
            initital_reserve_data.current_variable_borrow_rate_e24,
            final_reserve_data.current_variable_borrow_rate_e24,
            differences.current_variable_borrow_rate_e24,
            "current_variable_borrow_rate_e24".to_string(),
        );
        assert(
            initital_reserve_data.current_supply_rate_e24,
            final_reserve_data.current_supply_rate_e24,
            differences.current_supply_rate_e24,
            "current_supply_rate_e24".to_string(),
        );
        assert(
            initital_reserve_data.cumulative_variable_borrow_rate_index_e18,
            final_reserve_data.cumulative_variable_borrow_rate_index_e18,
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
            initital_reserve_data.total_variable_borrowed,
            final_reserve_data.total_variable_borrowed,
            differences.total_variable_borrowed,
            "total_variable_borrowed".to_string(),
        );
        assert(
            initital_reserve_data.total_supplied,
            final_reserve_data.total_supplied,
            differences.total_supplied,
            "total_supply".to_string(),
        );
        assert(
            initital_reserve_data.avarage_stable_rate_e24,
            final_reserve_data.avarage_stable_rate_e24,
            differences.avarage_stable_rate_e12,
            "avarage_stable_rate_e12".to_string(),
        );
        assert(
            initital_reserve_data.sum_stable_debt,
            final_reserve_data.sum_stable_debt,
            differences.sum_stable_debt,
            "sum_stable_debt".to_string(),
        );
        assert(
            initital_reserve_data.accumulated_stable_borrow,
            final_reserve_data.accumulated_stable_borrow,
            differences.accumulated_stable_borrow,
            "accumulated_stable_borrow".to_string(),
        );
    }
}
