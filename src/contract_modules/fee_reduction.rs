use abax_library::structs::FeeReductions;
use ink::primitives::AccountId;

use ink::contract_ref;
use ink::env::DefaultEnvironment;

pub type FeeReductionRef = contract_ref!(FeeReduction, DefaultEnvironment);

#[ink::trait_definition]
pub trait FeeReduction {
    /// Returns the fee reductions for the given account.
    #[ink(message)]
    fn get_fee_reductions(&self, account: AccountId) -> FeeReductions;
}
