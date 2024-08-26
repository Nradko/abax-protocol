// SPDX-License-Identifier: BUSL-1.1
use ink::prelude::vec::Vec;
use ink::primitives::AccountId;

use ink::contract_ref;
use ink::env::DefaultEnvironment;

use super::PriceFeedError;
pub type PriceFeedRef = contract_ref!(PriceFeed, DefaultEnvironment);

#[ink::trait_definition]
pub trait PriceFeed {
    /// Returns the latest price of the given 'assets'.
    #[ink(message)]
    fn get_latest_prices(
        &self,
        assets: Vec<AccountId>,
    ) -> Result<Vec<u128>, PriceFeedError>;
}
