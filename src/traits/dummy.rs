use ink::{contract_ref, env::DefaultEnvironment};

pub type DummyRef = contract_ref!(Dummy, DefaultEnvironment);

#[ink::trait_definition]
pub trait Dummy {
    #[ink(message)]
    fn dummy(&self);
}
