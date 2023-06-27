#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod psp22_emitable {

    use openbrush::{
        contracts::{
            ownable::*,
            psp22::{
                extensions::{
                    metadata::*,
                    mintable::*,
                },
                PSP22Error,
            },
        },
        modifiers,
        traits::Storage,
    };

    use ink::prelude::string::String;

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct PSP22OwnableContract {
        #[storage_field]
        ownable: ownable::Data,
        #[storage_field]
        psp22: psp22::Data,
        #[storage_field]
        metadata: metadata::Data,
    }

    impl PSP22 for PSP22OwnableContract {}

    impl PSP22Metadata for PSP22OwnableContract {}

    impl PSP22OwnableContract {
        #[ink(constructor)]
        pub fn new(name: String, symbol: String, decimal: u8, owner: AccountId) -> Self {
            let mut instance = Self::default();
            instance.metadata.name = Some(name.into());
            instance.metadata.symbol = Some(symbol.into());
            instance.metadata.decimals = decimal;
            instance._init_with_owner(owner);
            instance
        }
    }

    impl PSP22Mintable for PSP22OwnableContract {
        #[ink(message)]
        #[modifiers(only_owner)]
        fn mint(&mut self, account: AccountId, amount: Balance) -> Result<(), PSP22Error> {
            self._mint_to(account, amount)
        }
    }
    impl Ownable for PSP22OwnableContract {}
}
