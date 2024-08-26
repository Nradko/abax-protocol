// SPDX-License-Identifier: BUSL-1.1
use ink::primitives::AccountId;

#[ink::trait_definition]
pub trait AccountRegistrarView {
    /// Returns the current counter value.
    /// Represents the number of registered accounts.
    #[ink(message)]
    fn view_next_counter(&self) -> u128;
    /// Returns the account associated with the given `counter`.
    #[ink(message)]
    fn view_counter_to_account(&self, counter: u128) -> Option<AccountId>;
    /// Returns the counter associated with the given `account`.
    #[ink(message)]
    fn view_account_to_counter(&self, account: AccountId) -> Option<u128>;
}
