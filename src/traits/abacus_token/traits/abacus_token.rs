use ink_prelude::vec::Vec;
use openbrush::{
    contracts::psp22::PSP22Error,
    traits::{
        AccountId,
        Balance,
    },
};
use scale::{
    Decode,
    Encode,
};

#[openbrush::wrapper]
pub type AbacusTokenRef = dyn AbacusToken;

#[derive(Default, Debug, Decode, Encode, Clone)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub struct TransferEventData {
    pub from: Option<AccountId>,
    pub to: Option<AccountId>,
    pub amount: Balance,
}

#[openbrush::trait_definition]
pub trait AbacusToken {
    /// called whenever the state of user supply, variable_borrow, stable_borrow (aToken, vToken, sToken) is changed.
    #[ink(message)]
    fn emit_transfer_events(&mut self, transfer_event_data: Vec<TransferEventData>) -> Result<(), PSP22Error>;

    #[ink(message)]
    fn emit_transfer_event_and_decrease_allowance(
        &mut self,
        transfer_event_data: TransferEventData,
        from: AccountId,
        to: AccountId,
        decrease_allowance_by: Balance,
    ) -> Result<(), PSP22Error>;

    #[ink(message)]
    fn get_lending_pool(&self) -> AccountId;
}

pub trait Internal {
    /// User must override those methods in their contract.
    fn _emit_transfer_event(&self, _from: Option<AccountId>, _to: Option<AccountId>, _amount: Balance);
    fn _emit_approval_event(&self, _owner: AccountId, _spender: AccountId, _amount: Balance);

    fn _allowance(&self, owner: &AccountId, spender: &AccountId) -> Balance;

    fn _do_safe_transfer_check(
        &mut self,
        from: &AccountId,
        to: &AccountId,
        value: &Balance,
        data: &Vec<u8>,
    ) -> Result<(), PSP22Error>;

    fn _transfer_from_to(
        &mut self,
        from: AccountId,
        to: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error>;

    fn _approve_from_to(&mut self, owner: AccountId, spender: AccountId, amount: Balance) -> Result<(), PSP22Error>;
}
