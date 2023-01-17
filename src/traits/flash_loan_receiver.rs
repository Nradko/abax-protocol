use ink_prelude::{
    string::String,
    vec::Vec,
};
use openbrush::traits::AccountId;

#[openbrush::wrapper]
pub type FlashLoanReceiverRef = dyn FlashLoanReceiver;

#[openbrush::trait_definition]
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

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum FlashLoanReceiverError {
    Custom(String),
    ExecuteOperationFailed,
}
