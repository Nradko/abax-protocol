use abax_library::structs::FeeReductions;
use ink::primitives::AccountId;

use ink::contract_ref;
use ink::env::DefaultEnvironment;

pub type FeeReductionRef = contract_ref!(FeeReduction, DefaultEnvironment);

#[ink::trait_definition]
pub trait FeeReduction {
    /// Returns (deposit_fee_reduction_e6, debt_fee_reduction_e6).
    #[ink(message)]
    fn get_fee_reductions(&self, account: AccountId) -> FeeReductions;

    /// Returns flash_loan_fee_reduction_e6.
    #[ink(message)]
    fn get_flash_loan_fee_reduction(&self, account: AccountId) -> u32;
}
