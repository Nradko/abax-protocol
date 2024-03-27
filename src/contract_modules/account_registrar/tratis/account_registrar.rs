use ink::primitives::AccountId;

#[ink::trait_definition]
pub trait AccountRegistrarView {
    #[ink(message)]
    fn view_counter_to_user(&self, counter: u128) -> Option<AccountId>;
    #[ink(message)]
    fn view_user_to_counter(&self, user: AccountId) -> Option<u128>;
    #[ink(message)]
    fn view_next_counter(&self) -> u128;
}
