use openbrush::{
    storage::Mapping,
    traits::{AccountId, Balance},
};

// here all the prices of reserves underlaying asssets are stored.
#[derive(Debug)]
#[openbrush::storage_item]
pub struct AbacusTokenData {
    pub lending_pool: openbrush::traits::AccountId,
    pub underlying_asset: openbrush::traits::AccountId,
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
