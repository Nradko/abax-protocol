use ink::prelude::vec::Vec;
use pendzl::{
    contracts::psp22::PSP22Error,
    traits::{AccountId, Balance},
};
use scale::{Decode, Encode};

use ink::contract_ref;
use ink::env::DefaultEnvironment;
pub type AbacusTokenRef = contract_ref!(AbacusToken, DefaultEnvironment);

#[derive(Default, Debug, Decode, Encode, Clone)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub struct TransferEventData {
    pub from: Option<AccountId>,
    pub to: Option<AccountId>,
    pub amount: Balance,
}

#[ink::trait_definition]
pub trait AbacusToken {
    /// called whenever the state of user deposit or debt (aToken, vToken) is changed.
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
