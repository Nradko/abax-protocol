#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod fee_reduction_provider_mock {

    use abax_contracts::fee_reduction::FeeReduction;
    use ink::storage::Mapping;

    #[ink(storage)]
    #[derive(Default)]
    pub struct FeeReductionProvider {
        fee_reductions: Mapping<Option<AccountId>, (u32, u32)>,
    }

    impl FeeReductionProvider {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
        }

        #[ink(message)]
        pub fn set_fee_reduction(
            &mut self,
            account_id: Option<AccountId>,
            fee_reductions: (u32, u32),
        ) {
            self.fee_reductions.insert(account_id, &fee_reductions);
        }
    }

    impl FeeReduction for FeeReductionProvider {
        #[ink(message)]
        fn get_fee_reductions(&self, account: AccountId) -> (u32, u32) {
            match self.fee_reductions.get(Some(account)) {
                Some(fee_reductions) => fee_reductions,
                None => self
                    .fee_reductions
                    .get::<Option<AccountId>>(None)
                    .unwrap_or((0, 0)),
            }
        }
    }
}
