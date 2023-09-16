use pendzl::{
    storage::Mapping,
    traits::{AccountId, Balance},
};

// here all the prices of reserves underlaying asssets are stored.
#[derive(Debug)]
#[pendzl::storage_item]
pub struct AbacusTokenData {
    pub lending_pool: pendzl::traits::AccountId,
    pub underlying_asset: pendzl::traits::AccountId,
    pub allowances: Mapping<(AccountId, AccountId), Balance>,
}

impl Default for AbacusTokenData {
    fn default() -> Self {
        Self {
            lending_pool: ink::blake2x256!("ZERO_ADRESS").into(),
            underlying_asset: ink::blake2x256!("ZERO_ADRESS").into(),
            allowances: Default::default(),
        }
    }
}
