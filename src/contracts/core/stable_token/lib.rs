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
    use ink::{
        codegen::{EmitEvent, Env},
        prelude::string::String,
    };

    use abax_traits::lending_pool::{BURNER, MINTER};
    use pendzl::{
        contracts::{
            access_control,
            psp22::{
                extensions::{metadata::*, mintable::PSP22MintableImpl},
                PSP22Error,
            },
        },
        traits::Storage,
    };

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct StableToken {
        #[storage_field]
        access: access_control::Data,
        #[storage_field]
        psp22: psp22::Data,
        #[storage_field]
        metadata: metadata::Data,
    }

    impl StableToken {
        #[ink(constructor)]
        pub fn new(name: String, symbol: String, decimal: u8) -> Self {
            let mut instance = Self::default();
            instance.metadata.name.set(&name.into());
            instance.metadata.symbol.set(&symbol.into());
            instance.metadata.decimals.set(&decimal);
            instance._init_with_caller();
            instance
        }
    }

    #[overrider(PSP22Mintable)]
    pub fn mint(
        &mut self,
        account: AccountId,
        amount: Balance,
    ) -> Result<(), PSP22Error> {
        self._ensure_has_role(MINTER, Some(self.env().caller()))?;
        self._mint_to(account, amount)
    }

    #[overrider(PSP22Burnable)]
    pub fn burn(
        &mut self,
        account: AccountId,
        amount: Balance,
    ) -> Result<(), PSP22Error> {
        self._ensure_has_role(BURNER, Some(self.env().caller()))?;
        self._burn_from(account, amount)
    }

    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        from: Option<AccountId>,
        #[ink(topic)]
        to: Option<AccountId>,
        value: Balance,
    }

    #[ink(event)]
    pub struct Approval {
        #[ink(topic)]
        owner: AccountId,
        #[ink(topic)]
        spender: AccountId,
        value: Balance,
    }

    #[overrider(psp22::Internal)]
    fn _emit_transfer_event(
        &self,
        from: Option<AccountId>,
        to: Option<AccountId>,
        amount: Balance,
    ) {
        self.env().emit_event(Transfer {
            from,
            to,
            value: amount,
        })
    }
    #[overrider(psp22::Internal)]
    fn _emit_approval_event(
        &self,
        owner: AccountId,
        spender: AccountId,
        amount: Balance,
    ) {
        self.env().emit_event(Approval {
            owner,
            spender,
            value: amount,
        })
    }
}
