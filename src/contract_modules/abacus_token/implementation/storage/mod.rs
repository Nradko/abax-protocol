use ink::storage::Mapping;
use pendzl::traits::{AccountId, Balance};

// here all the prices of reserves underlaying asssets are stored.
#[derive(Debug)]
#[pendzl::storage_item]
pub struct AbacusTokenStorage {
    pub lending_pool: pendzl::traits::AccountId,
    pub underlying_asset: pendzl::traits::AccountId,
    pub allowances: Mapping<(AccountId, AccountId), Balance>,
}

impl Default for AbacusTokenStorage {
    fn default() -> Self {
        Self {
            lending_pool: ink::blake2x256!("ZERO_ADRESS").into(),
            underlying_asset: ink::blake2x256!("ZERO_ADRESS").into(),
            allowances: Default::default(),
        }
    }
}
