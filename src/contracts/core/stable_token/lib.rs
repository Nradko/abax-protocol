// SPDX-License-Identifier: BUSL-1.1
#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(
    PSP22,
    PSP22Metadata,
    AccessControl,
    PSP22Mintable,
    PSP22Burnable
)]
#[ink::contract]
pub mod stable_token {
    use ink::prelude::string::String;

    use abax_contracts::lending_pool::{BURNER, MINTER};
    use pendzl::contracts::access_control;
    use pendzl::contracts::psp22;
    use pendzl::contracts::psp22::metadata;
    use pendzl::contracts::psp22::PSP22Error;

    #[ink(storage)]
    #[derive(Default, pendzl::traits::StorageFieldGetter)]
    pub struct StableToken {
        #[storage_field]
        access: access_control::AccessControlData,
        #[storage_field]
        psp22: psp22::PSP22Data,
        #[storage_field]
        metadata: metadata::PSP22MetadataData,
    }

    impl StableToken {
        #[ink(constructor)]
        pub fn new(name: String, symbol: String, decimal: u8) -> Self {
            let mut instance = Self::default();
            let caller = instance.env().caller();
            instance.metadata.name.set(&name.into());
            instance.metadata.symbol.set(&symbol.into());
            instance.metadata.decimals.set(&decimal);
            instance
                ._grant_role(Self::_default_admin(), Some(caller))
                .expect("caller should become admin");
            instance
        }
    }

    #[overrider(PSP22Mintable)]
    pub fn mint(
        &mut self,
        to: AccountId,
        amount: Balance,
    ) -> Result<(), PSP22Error> {
        self._ensure_has_role(MINTER, Some(self.env().caller()))?;
        psp22::PSP22Internal::_mint_to(self, &to, &amount)
    }

    #[overrider(PSP22Burnable)]
    pub fn burn(
        &mut self,
        from: AccountId,
        amount: Balance,
    ) -> Result<(), PSP22Error> {
        self._ensure_has_role(BURNER, Some(self.env().caller()))?;
        psp22::PSP22Internal::_burn_from(self, &from, &amount)
    }

    #[overrider(Internal)]
    fn _emit_transfer_event(
        &self,
        from: Option<AccountId>,
        to: Option<AccountId>,
        amount: Balance,
    ) {
        self.env().emit_event(psp22::Transfer {
            from,
            to,
            value: amount,
        })
    }
    #[overrider(Internal)]
    fn _emit_approval_event(
        &self,
        owner: AccountId,
        spender: AccountId,
        amount: Balance,
    ) {
        self.env().emit_event(psp22::Approval {
            owner,
            spender,
            value: amount,
        })
    }
}
