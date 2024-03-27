use ink::prelude::vec::Vec;
use pendzl::{
    contracts::psp22::PSP22Error,
    traits::{AccountId, Balance},
};

use ink::contract_ref;
use ink::env::DefaultEnvironment;

use super::structs::TransferEventData;
pub type AbacusTokenRef = contract_ref!(AbacusToken, DefaultEnvironment);

#[ink::trait_definition]
pub trait AbacusToken {
    /// called by lending protocol whenever the state of user deposit or debt (aToken, vToken) is changed.
    #[ink(message)]
    fn emit_transfer_events(
        &mut self,
        transfer_event_data: Vec<TransferEventData>,
    ) -> Result<(), PSP22Error>;

    /// called whenever the state of user deposit or debt (aToken, vToken) is changed caller != on_behalf_of.
    /// case1: Alice has allowance on Bobs ATokens and Alice makes withdraw on behalf of Bob.
    /// case2: Alice has allowance on Bobs VTokens and Alice makes borrow on behalf of Bob.
    #[ink(message)]
    fn emit_transfer_event_and_decrease_allowance(
        &mut self,
        transfer_event_data: TransferEventData,
        from: AccountId,
        to: AccountId,
        decrease_allowance_by: Balance,
    ) -> Result<(), PSP22Error>;

    /// returns lending_pool AccountId
    #[ink(message)]
    fn get_lending_pool(&self) -> AccountId;
}
