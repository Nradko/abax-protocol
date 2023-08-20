#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[openbrush::implementation(PSP22, PSP22Metadata, PSP22Mintable)]
#[openbrush::contract]
pub mod psp22_emitable {
    use openbrush::{
        contracts::psp22::extensions::{burnable::*, metadata::*, mintable::*},
        traits::Storage,
    };

    use ink::prelude::string::String;

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct PSP22EmitableContract {
        #[storage_field]
        psp22: psp22::Data,
        #[storage_field]
        metadata: metadata::Data,
    }

    impl PSP22EmitableContract {
        #[ink(constructor)]
        pub fn new(name: String, symbol: String, decimal: u8) -> Self {
            let mut instance = Self::default();
            instance.metadata.name.set(&name.into());
            instance.metadata.symbol.set(&symbol.into());
            instance.metadata.decimals.set(&decimal);
            instance
        }
    }
}
