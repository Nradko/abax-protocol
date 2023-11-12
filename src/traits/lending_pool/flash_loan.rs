use ink::{contract_ref, env::DefaultEnvironment, prelude::vec::Vec};
use pendzl::traits::{AccountId, Balance};

use crate::traits::lending_pool::errors::LendingPoolError;

pub type LendingPoolFlashRef =
    contract_ref!(LendingPoolFlash, DefaultEnvironment);

/// contains `flash_looan` function
#[ink::trait_definition]
pub trait LendingPoolFlash {
    /// is used to perform a flash loan. 1) take a loan. 2) perform actions. 3) repay loan + fee. All in one tx.
    ///
    ///  * `receiver_address` - AccountId (aka address) of a contract that takes loan and will perform actions before rapaying loan.
    ///  * `assets` -  vec of PSP22 AccountId (aka address) that one wants to borrow
    ///  * `amounts` -  vec of Blancwes that one wants to borrow, in the correspong order to `assets`
    ///  * `receiver_params` -  additional data passed to receiver.
    #[ink(message)]
    fn flash_loan(
        &mut self,
        receiver_address: AccountId,
        assets: Vec<AccountId>,
        amounts: Vec<Balance>,
        receiver_params: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
}
