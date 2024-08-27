// SPDX-License-Identifier: BUSL-1.1
#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(AccessControl)]
#[ink::contract]
pub mod price_feed_provider {
    use abax_contracts::dia_oracle::{OracleGetters, OracleGettersRef};
    use abax_contracts::price_feed::{PriceFeed, PriceFeedError};
    use ink::codegen::TraitCallBuilder;
    use ink::prelude::string::String;
    use ink::prelude::{vec::Vec, *};

    use ink::storage::{Lazy, Mapping};

    use pendzl::contracts::access_control;
    const PARAMETERS_ADMIN: RoleType = ink::selector_id!("PARAMETERS_ADMIN"); // 368_001_360_u32

    #[ink(storage)]
    #[derive(StorageFieldGetter, Default)]
    pub struct PriceFeedProvider {
        #[storage_field]
        access: access_control::AccessControlData,
        oracle: Lazy<OracleGettersRef>,
        account_to_symbol: Mapping<AccountId, String>,
    }

    impl PriceFeedProvider {
        #[ink(constructor)]
        pub fn new(oracle: AccountId, admin: AccountId) -> Self {
            let mut instance: PriceFeedProvider = Default::default();
            instance
                ._grant_role(Self::_default_admin(), Some(admin))
                .expect("default admin role should be granted");
            let oracle_ref: OracleGettersRef = oracle.into();
            instance.oracle.set(&oracle_ref);
            instance
        }

        #[ink(message)]
        pub fn set_account_symbol(
            &mut self,
            asset: AccountId,
            symbol: String,
        ) -> Result<(), AccessControlError> {
            let caller = Self::env().caller();
            self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

            self.account_to_symbol.insert(asset, &symbol);
            Ok(())
        }

        #[ink(message)]
        pub fn get_account_symbol(
            &mut self,
            asset: AccountId,
        ) -> Option<String> {
            self.account_to_symbol.get(asset)
        }
    }

    impl PriceFeed for PriceFeedProvider {
        #[ink(message)]
        fn get_latest_prices(
            &self,
            assets: Vec<AccountId>,
        ) -> Result<Vec<u128>, PriceFeedError> {
            let mut result: Vec<u128> = vec![];
            let mut symbols: Vec<String> = vec![];

            for asset in assets {
                let symbol = self
                    .account_to_symbol
                    .get(asset)
                    .ok_or(PriceFeedError::NoSuchAsset)?;
                symbols.push(symbol)
            }
            let mut oracle: OracleGettersRef = self.oracle.get().unwrap();
            for res in oracle
                .call_mut()
                .get_latest_prices(symbols)
                .call_v1()
                .invoke()
            {
                match res {
                    Some(r) => result.push(r.1),
                    None => return Err(PriceFeedError::NoPriceFeed),
                }
            }
            Ok(result)
        }
    }
}
