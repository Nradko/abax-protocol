#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(PSP22, PSP22Mintable, PSP22Metadata, Ownable)]
#[ink::contract]
pub mod psp22_emitable {

    use pendzl::contracts::ownable;
    use pendzl::contracts::psp22;
    use pendzl::contracts::psp22::PSP22Error;

    use ink::prelude::string::String;

    #[ink(storage)]
    #[derive(Default, pendzl::traits::StorageFieldGetter)]
    pub struct PSP22OwnableContract {
        #[storage_field]
        ownable: ownable::OwnableData,
        #[storage_field]
        psp22: psp22::PSP22Data,
        #[storage_field]
        metadata: psp22::metadata::PSP22MetadataData,
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
            ownable::OwnableInternal::_update_owner(
                &mut instance,
                &Some(owner),
            );
            instance
        }
    }
}
