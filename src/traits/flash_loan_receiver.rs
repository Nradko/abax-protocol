use ink::contract_ref;
use ink::env::DefaultEnvironment;
use ink::prelude::vec::Vec;
use pendzl::math::errors::MathError;
use pendzl::traits::AccountId;
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

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum FlashLoanReceiverError {
    MathErorr(MathError),
    InsufficientBalance,
    AssetNotMintable,
    CantApprove,
    ExecuteOperationFailed,
}

impl From<MathError> for FlashLoanReceiverError {
    fn from(error: MathError) -> Self {
        FlashLoanReceiverError::MathErorr(error)
    }
}
