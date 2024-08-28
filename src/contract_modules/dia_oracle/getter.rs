// SPDX-License-Identifier: BUSL-1.1
use ink::prelude::string::String;
use ink::prelude::vec::Vec;
use ink::primitives::AccountId;

use ink::contract_ref;
use ink::env::DefaultEnvironment;
pub type OracleGettersRef = contract_ref!(OracleGetters, DefaultEnvironment);

#[ink::trait_definition]
pub trait OracleGetters {
    #[ink(message)]
    fn get_updater(&self) -> AccountId;

    #[ink(message)]
    fn get_latest_price(&self, pair: String) -> Option<(u64, u128)>;

    #[ink(message)]
    fn get_latest_prices(&self, pairs: Vec<String>)
        -> Vec<Option<(u64, u128)>>;
}
