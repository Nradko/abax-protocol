pub type LendingPoolFlashRef =
    contract_ref!(LendingPoolFlash, DefaultEnvironment);

/// Trait containing flash_loan message. Used by **flash loaners**.
#[ink::trait_definition]
pub trait LendingPoolFlash {
    /// is used to perform a flash loan. 1) take a loan. 2) perform actions. 3) repay loan + fee. All in one tx.
    ///
    ///  * `receiver` - AccountId (aka address) of a contract that takes loan and will perform actions before rapaying loan. Must implement `FlashLoanReceiver`.
    ///  * `assets` -  vec of PSP22 AccountId (aka address) that one wants to borrow
    ///  * `amounts` -  vec of amounts that one wants to borrow, in the correspong order to `assets`
    ///  * `receiver_params` -  additional data passed to receiver.
    /// # Errors
    /// * `FlashLoanAmountsAssetsInconsistentLengths` returned when `assets`.len != `amounts`.len()
    /// * `PSP22Error` if transfer fails
    /// * `FlashLoanReceiverError` if call to `receiver` fails.
    #[ink(message)]
    fn flash_loan(
        &mut self,
        receiver: AccountId,
        assets: Vec<AccountId>,
        amounts: Vec<Balance>,
        receiver_params: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
}
