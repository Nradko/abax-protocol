// SPDX-License-Identifier: BUSL-1.1
use ink::contract_ref;
use ink::env::DefaultEnvironment;
use ink::prelude::vec::Vec;
use pendzl::traits::AccountId;

use super::FlashLoanReceiverError;
pub type FlashLoanReceiverRef =
    contract_ref!(FlashLoanReceiver, DefaultEnvironment);

#[ink::trait_definition]
pub trait FlashLoanReceiver {
    /// Called by lending protocol to execute the operation after flash loan is given and before it is paid back.
    ///
    /// # Note
    /// - The function should not pay the tokens back to the lending protocol. The tokens are automatically paid back after the function is executed.
    /// - After the function is executed, the contract should have enough tokens to cover the flash loan amount and fees.
    /// - After the function is executed, the lending pool should have allowance to transfer appropriate amount of each asset.
    ///
    /// # Errors
    /// May return FlashLoanReceiverError.
    #[ink(message)]
    fn execute_operation(
        &mut self,
        assets: Vec<AccountId>,
        amounts: Vec<u128>,
        fees: Vec<u128>,
        receiver_params: Vec<u8>,
    ) -> Result<(), FlashLoanReceiverError>;
}
