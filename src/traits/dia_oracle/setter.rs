pub type OracleSettersRef = contract_ref!(OracleSetters, DefaultEnvironment);

#[ink::trait_definition]
pub trait OracleSetters {
    #[ink(message)]
    fn transfer_ownership(&mut self, new_owner: AccountId);

    #[ink(message)]
    fn set_updater(&mut self, updater: AccountId);

    #[ink(message)]
    fn set_price(&mut self, pair: String, price: u128);

    #[ink(message)]
    fn set_prices(&mut self, pairs: Vec<(String, u128)>);
}
