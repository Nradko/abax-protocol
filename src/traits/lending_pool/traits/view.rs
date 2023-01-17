use crate::impls::lending_pool::storage::structs::{
    reserve_data::ReserveData, user_reserve_data::UserReserveData,
};

use openbrush::traits::AccountId;

use ink_prelude::vec::Vec;

#[openbrush::wrapper]
pub type LendingPoolViewRef = dyn LendingPoolView;

#[openbrush::trait_definition]
pub trait LendingPoolView {
    #[ink(message)]
    fn view_registered_asset(&self) -> Vec<AccountId>;
    #[ink(message)]
    fn view_reserve_data(&self, asset: AccountId) -> Option<ReserveData>;
    #[ink(message)]
    fn view_user_reserve_data(
        &self,
        asset: AccountId,
        account: AccountId,
    ) -> Option<UserReserveData>;
    #[ink(message)]
    fn get_user_free_collateral_coefficient(&self, user_address: AccountId) -> (bool, u128);
    #[ink(message)]
    fn get_block_timestamp_provider_address(&self) -> AccountId;
    #[ink(message)]
    fn get_reserve_token_price_e8(&self, reserve_token_address: AccountId) -> Option<u128>;

    #[ink(message)]
    fn view_protocol_income(&self, assets: Option<Vec<AccountId>>) -> Vec<(AccountId, i128)>;
}
