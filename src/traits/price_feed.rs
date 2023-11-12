use ink::prelude::vec::Vec;
use ink::primitives::AccountId;

use ink::contract_ref;
use ink::env::DefaultEnvironment;
pub type PriceFeedRef = contract_ref!(PriceFeed, DefaultEnvironment);

#[ink::trait_definition]
pub trait PriceFeed {
    #[ink(message)]
    fn get_latest_prices(
        &self,
        assets: Vec<AccountId>,
    ) -> Result<Vec<u128>, PriceFeedError>;
}

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum PriceFeedError {
    NoSuchAsset,
    NoPriceFeed,
}
