#![cfg_attr(not(feature = "std"), no_std, no_main)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod psp22_emitable {

    use openbrush::{
        contracts::{
            ownable::*,
            psp22::{
                extensions::mintable::PSP22MintableRef,
                PSP22Error,
            },
        },
        storage::Mapping,
        traits::Storage,
    };

    use ink::prelude::vec::Vec;

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct TestReservesMinter {
        #[storage_field]
        ownable: ownable::Data,
        reserves_to_mint: Vec<AccountId>,
        already_minted: Mapping<AccountId, bool>,
    }

    impl TestReservesMinter {
        #[ink(constructor)]
        pub fn new() -> Self {
            let mut instance = Self::default();
            let caller = instance.env().caller();
            instance._init_with_owner(caller);
            instance
        }

        #[ink(message)]
        pub fn mint(
            &mut self,
            addreses_with_amounts: Vec<(AccountId, Balance)>,
            to: AccountId,
        ) -> Result<(), TestReservesMinterError> {
            if !self.already_minted.contains(&to) {
                for &(addr, amount) in addreses_with_amounts.iter() {
                    PSP22MintableRef::mint(&addr, to, amount)?;
                }
                self.already_minted.insert(&to, &true);
            } else {
                return Err(TestReservesMinterError::AlreadyMinted)
            }
            Ok(())
        }
    }

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum TestReservesMinterError {
        OwnableError(OwnableError),
        PSP22Error(PSP22Error),

        AlreadyMinted,
    }

    impl From<OwnableError> for TestReservesMinterError {
        fn from(error: OwnableError) -> Self {
            TestReservesMinterError::OwnableError(error)
        }
    }
    impl From<PSP22Error> for TestReservesMinterError {
        fn from(error: PSP22Error) -> Self {
            TestReservesMinterError::PSP22Error(error)
        }
    }
}
