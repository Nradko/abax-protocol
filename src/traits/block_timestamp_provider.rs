use openbrush::contracts::ownable::OwnableError;

use ink::contract_ref;
use ink::env::DefaultEnvironment;
pub type BlockTimestampProviderRef =
    contract_ref!(BlockTimestampProviderInterface, DefaultEnvironment);

#[ink::trait_definition]
pub trait BlockTimestampProviderInterface {
    #[ink(message)]
    fn get_block_timestamp(&self) -> u64;
    #[ink(message)]
    fn set_block_timestamp(
        &mut self,
        timestamp: u64,
    ) -> Result<(), OwnableError>;
    #[ink(message)]
    fn increase_block_timestamp(
        &mut self,
        delta_timestamp: u64,
    ) -> Result<(), OwnableError>;
    #[ink(message)]
    fn set_should_return_mock_value(
        &mut self,
        should_return_mock_value: bool,
    ) -> Result<(), OwnableError>;
    #[ink(message)]
    fn get_should_return_mock_value(&self) -> bool;
    #[ink(message)]
    fn set_speed_multiplier(
        &mut self,
        speed_multiplier: u64,
    ) -> Result<(), OwnableError>;
    #[ink(message)]
    fn get_speed_multiplier(&mut self) -> u64;
}
