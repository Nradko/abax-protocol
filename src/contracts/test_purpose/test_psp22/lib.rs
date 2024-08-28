// SPDX-License-Identifier: BUSL-1.1
#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(PSP22, PSP22Mintable, PSP22Metadata, Ownable)]
#[ink::contract]
pub mod test_psp22 {

    use pendzl::contracts::ownable;
    use pendzl::contracts::psp22;
    use pendzl::contracts::psp22::PSP22Error;

    use ink::prelude::string::String;

    #[ink(storage)]
    #[derive(Default, pendzl::traits::StorageFieldGetter)]
    pub struct TestPSP22Contract {
        #[storage_field]
        ownable: ownable::OwnableData,
        #[storage_field]
        psp22: psp22::PSP22Data,
        #[storage_field]
        metadata: psp22::metadata::PSP22MetadataData,
    }

    impl TestPSP22Contract {
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
            ownable::OwnableInternal::_update_owner(
                &mut instance,
                &Some(owner),
            );
            instance
        }

        //expose approve from to
        #[ink(message)]
        pub fn t_approve(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: u128,
        ) -> Result<(), PSP22Error> {
            self._approve(&from, &to, &value)
        }
    }
}
