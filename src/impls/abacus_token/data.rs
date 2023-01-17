use openbrush::{
    storage::Mapping,
    traits::{
        AccountId,
        Balance,
    },
};

pub const STORAGE_KEY: u32 = openbrush::storage_unique_key!(Data);

// here all the prices of reserves underlaying asssets are stored.
#[derive(Default, Debug)]
#[openbrush::upgradeable_storage(STORAGE_KEY)]
pub struct AbacusTokenData {
    pub lending_pool: AccountId,
    pub underlying_asset: AccountId,
    pub allowances: Mapping<(AccountId, AccountId), Balance>,
}
