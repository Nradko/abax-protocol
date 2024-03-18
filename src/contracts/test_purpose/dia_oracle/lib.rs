#![cfg_attr(not(feature = "std"), no_std, no_main)]

pub use self::oracle_anchor::TokenPriceStorageRef;

#[ink::contract]
pub mod oracle_anchor {
    use abax_traits::dia_oracle::{OracleGetters, OracleSetters};
    use ink::env::DefaultEnvironment;
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::{traits::ManualKey, Lazy, Mapping};

    #[ink::storage_item]
    struct TokenPriceStruct {
        owner: AccountId,
        updater: AccountId,
        pairs: Mapping<String, (u64, u128)>,
    }

    #[ink(storage)]
    pub struct TokenPriceStorage {
        data: Lazy<TokenPriceStruct, ManualKey<0x1>>,
    }

    #[ink::event]
    pub struct OwnershipTransferred {
        #[ink(topic)]
        previous_owner: Option<AccountId>,
        #[ink(topic)]
        new_owner: AccountId,
    }

    #[ink::event]
    pub struct UpdaterChanged {
        #[ink(topic)]
        old: Option<AccountId>,
        #[ink(topic)]
        new: AccountId,
    }

    #[ink::event]
    pub struct TokenPriceChanged {
        #[ink(topic)]
        pair: String,
        price: u128,
        timestamp: u64,
    }

    impl OracleSetters for TokenPriceStorage {
        #[ink(message)]
        fn transfer_ownership(&mut self, new_owner: AccountId) {
            let caller: AccountId = self.env().caller();

            let mut tps: TokenPriceStruct =
                self.data.get().expect("self.data not set");

            assert!(caller == tps.owner, "only owner can transfer ownership");
            tps.owner = new_owner;
            self.data.set(&tps);
            self.env().emit_event(OwnershipTransferred {
                previous_owner: Some(caller),
                new_owner,
            });
        }

        #[ink(message)]
        fn set_updater(&mut self, updater: AccountId) {
            let caller: AccountId = self.env().caller();

            let mut tps: TokenPriceStruct =
                self.data.get().expect("self.data not set");

            assert!(caller == tps.owner, "only owner can set updater");
            tps.updater = updater;
            self.data.set(&tps);
            self.env().emit_event(UpdaterChanged {
                old: Some(caller),
                new: updater,
            });
        }

        #[ink(message)]
        fn set_price(&mut self, pair: String, price: u128) {
            let caller: AccountId = self.env().caller();
            let mut tps: TokenPriceStruct =
                self.data.get().expect("self.data not set");
            assert!(caller == tps.updater, "only updater can set price");
            let current_timestamp: u64 = self.env().block_timestamp();

            // create new record

            tps.pairs.insert(pair.clone(), &(current_timestamp, price));

            self.data.set(&tps);

            self.env().emit_event(TokenPriceChanged {
                pair,
                price,
                timestamp: current_timestamp,
            });
        }

        #[ink(message)]
        fn set_prices(&mut self, pairs: Vec<(String, u128)>) {
            let caller: AccountId = self.env().caller();
            let mut tps: TokenPriceStruct =
                self.data.get().expect("self.data not set");
            assert!(caller == tps.updater, "only updater can set price");
            let current_timestamp: u64 = self.env().block_timestamp();

            // create new record
            for (pair, price) in pairs {
                tps.pairs.insert(pair.clone(), &(current_timestamp, price));
                self.env().emit_event(TokenPriceChanged {
                    pair,
                    price,
                    timestamp: current_timestamp,
                });
            }

            self.data.set(&tps);
        }
    }

    impl OracleGetters for TokenPriceStorage {
        #[ink(message)]
        fn get_updater(&self) -> AccountId {
            self.data.get().unwrap().updater
        }

        #[ink(message)]
        fn get_latest_price(&self, pair: String) -> Option<(u64, u128)> {
            self.data.get().unwrap().pairs.get(pair)
        }

        #[ink(message)]
        fn get_latest_prices(
            &self,
            pairs: Vec<String>,
        ) -> Vec<Option<(u64, u128)>> {
            let mut result = Vec::new();
            let data = self.data.get().unwrap();
            for pair in pairs {
                result.push(data.pairs.get(pair));
            }
            result
        }
    }

    impl Default for TokenPriceStorage {
        fn default() -> Self {
            Self::new()
        }
    }

    impl TokenPriceStorage {
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller: AccountId = Self::env().caller();
            Self::env().emit_event(OwnershipTransferred {
                previous_owner: None,
                new_owner: caller,
            });
            Self::env().emit_event(UpdaterChanged {
                old: None,
                new: caller,
            });

            let tps = TokenPriceStruct {
                owner: caller,
                updater: caller,
                pairs: Mapping::new(),
            };

            let mut ldata = Lazy::new();
            ldata.set(&tps);

            Self { data: ldata }
        }

        #[ink(message)]
        pub fn code_hash(&self) -> Hash {
            self.env().own_code_hash().unwrap_or_default()
        }

        #[ink(message)]
        pub fn set_code(&mut self, code_hash: [u8; 32]) {
            let caller: AccountId = self.env().caller();
            let tps: TokenPriceStruct =
                self.data.get().expect("self.data not set");
            assert!(caller == tps.owner, "only owner can set set code");

            ink::env::set_code_hash::<DefaultEnvironment>(&code_hash.into())
                .unwrap_or_else(|err| {
                    panic!(
                    "Failed to `set_code_hash` to {code_hash:?} due to {err:?}"
                )
                });
        }
    }
}
