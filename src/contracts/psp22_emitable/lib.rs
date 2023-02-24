#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod psp22_emitable {

    // use lending_project::traits::managing::*;
    use openbrush::{
        contracts::psp22::extensions::{
            burnable::*,
            metadata::*,
            mintable::*,
        },
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

    impl PSP22 for PSP22EmitableContract {}

    impl PSP22Metadata for PSP22EmitableContract {}

    // impl Managing for PSP22EmitableContract {}

    impl PSP22EmitableContract {
        #[ink(constructor)]
        pub fn new(name: String, symbol: String, decimal: u8) -> Self {
            let mut instance = Self::default();
            instance.metadata.name = Some(name.into());
            instance.metadata.symbol = Some(symbol.into());
            instance.metadata.decimals = decimal;

            instance
        }
    }

    impl PSP22Mintable for PSP22EmitableContract {}
}
