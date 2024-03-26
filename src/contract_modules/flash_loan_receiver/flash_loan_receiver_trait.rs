use ink::contract_ref;
use ink::env::DefaultEnvironment;
use ink::prelude::vec::Vec;
use pendzl::traits::AccountId;

use super::FlashLoanReceiverError;
pub type FlashLoanReceiverRef =
    contract_ref!(FlashLoanReceiver, DefaultEnvironment);

#[ink::trait_definition]
pub trait FlashLoanReceiver {
    #[ink(message)]
    fn execute_operation(
        &mut self,
        assets: Vec<AccountId>,
        amounts: Vec<u128>,
        fees: Vec<u128>,
        receiver_params: Vec<u8>,
    ) -> Result<(), FlashLoanReceiverError>;
}
