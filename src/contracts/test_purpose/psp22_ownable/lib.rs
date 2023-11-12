#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(PSP22, PSP22Mintable, PSP22Metadata, Ownable)]
#[ink::contract]
pub mod psp22_emitable {

    use pendzl::{
        contracts::{
            ownable::*,
            psp22::{
                extensions::{metadata::*, mintable::*},
                PSP22Error,
            },
        },
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

    impl PSP22OwnableContract {
        #[ink(constructor)]
        pub fn new(
            name: String,
            symbol: String,
            decimal: u8,
            owner: AccountId,
        ) -> Self {
            let mut instance = Self::default();
            instance.metadata.name.set(&name.into());
            instance.metadata.symbol.set(&symbol.into());
            instance.metadata.decimals.set(&decimal);
            ownable::Internal::_init_with_owner(&mut instance, owner);
            instance
        }
    }

    #[overrider(PSP22MintableImpl)]
    #[ink(message)]
    #[modifiers(only_owner)]
    fn mint(
        &mut self,
        account: AccountId,
        amount: Balance,
    ) -> Result<(), PSP22Error> {
        self._mint_to(account, amount)
    }
}
