#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(PSP22, PSP22Metadata)]
#[ink::contract]
pub mod a_token {
    use abax_contracts::abacus_token::implementation::{
        AbacusTokenImpl, AbacusTokenStorage,
    };
    use abax_contracts::abacus_token::{AbacusToken, TransferEventData};
    use abax_contracts::lending_pool::{
        LendingPoolATokenInterface, LendingPoolATokenInterfaceRef,
    };
    use ink::codegen::Env;
    use ink::prelude::string::String;

    use ink::codegen::TraitCallBuilder;
    use pendzl::contracts::psp22;
    use pendzl::contracts::psp22::PSP22Error;

    #[ink(storage)]
    #[derive(Default, pendzl::traits::StorageFieldGetter)]
    pub struct AToken {
        #[storage_field]
        psp22: psp22::PSP22Data,
        #[storage_field]
        abacus_token: AbacusTokenStorage,
        #[storage_field]
        metadata: psp22::metadata::PSP22MetadataData,
    }

    #[overrider(PSP22Internal)]
    fn _balance_of(&self, owner: &AccountId) -> Balance {
        let lending_pool: LendingPoolATokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        lending_pool
            .call()
            .account_deposit_of(self.abacus_token.underlying_asset, *owner)
            .call_v1()
            .invoke()
    }

    #[overrider(PSP22Internal)]
    fn _allowance(&self, owner: &AccountId, spender: &AccountId) -> Balance {
        self.abacus_token
            .allowances
            .get((*owner, *spender))
            .unwrap_or(0)
    }
    #[overrider(PSP22Internal)]
    fn _total_supply(&self) -> Balance {
        let lending_pool: LendingPoolATokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        lending_pool
            .call()
            .total_deposit_of(self.abacus_token.underlying_asset)
            .call_v1()
            .invoke()
    }

    #[overrider(PSP22)]
    fn transfer_from(
        &mut self,
        from: AccountId,
        to: AccountId,
        value: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error> {
        let caller = self.env().caller();
        let allowance = psp22::PSP22Internal::_allowance(self, &from, &caller);

        if allowance < value {
            return Err(PSP22Error::InsufficientAllowance);
        }

        psp22::PSP22Internal::_decrease_allowance_from_to(
            self, &from, &caller, &value,
        )?;
        psp22::PSP22Internal::_update(self, Some(&from), Some(&to), &value)?;
        Ok(())
    }

    #[overrider(PSP22)]
    fn transfer(
        &mut self,
        to: AccountId,
        value: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error> {
        let from = self.env().caller();
        psp22::PSP22Internal::_update(self, Some(&from), Some(&to), &value)?;
        Ok(())
    }

    #[overrider(PSP22Internal)]
    fn _update(
        &mut self,
        from: Option<&AccountId>,
        to: Option<&AccountId>,
        amount: &Balance,
    ) -> Result<(), PSP22Error> {
        let mut lending_pool: LendingPoolATokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        let (mint_from_amount, mint_to_amount): (Balance, Balance) =
            lending_pool
                .call_mut()
                .transfer_deposit_from_to(
                    self.abacus_token.underlying_asset,
                    *from.unwrap(),
                    *to.unwrap(),
                    *amount,
                )
                .call_v1()
                .invoke()?;
        // emitting accumulated interest events
        if mint_from_amount > 0 {
            self.env().emit_event(psp22::Transfer {
                from: None,
                to: from.copied(),
                value: mint_from_amount,
            });
        }
        if mint_to_amount > 0 {
            self.env().emit_event(psp22::Transfer {
                from: None,
                to: to.copied(),
                value: mint_to_amount,
            });
        }
        // emitting transfer event
        self.env().emit_event(psp22::Transfer {
            from: from.copied(),
            to: to.copied(),
            value: *amount,
        });

        Ok(())
    }

    #[overrider(PSP22Internal)]
    fn _approve(
        &mut self,
        owner: &AccountId,
        spender: &AccountId,
        amount: &Balance,
    ) -> Result<(), PSP22Error> {
        self.abacus_token
            .allowances
            .insert((owner, spender), amount);
        self.env().emit_event(psp22::Approval {
            owner: *owner,
            spender: *spender,
            value: *amount,
        });
        Ok(())
    }

    #[overrider(PSP22Internal)]
    fn _decrease_allowance_from_to(
        &mut self,
        owner: &AccountId,
        spender: &AccountId,
        amount: &Balance,
    ) -> Result<(), PSP22Error> {
        let new_allowance = self
            ._allowance(owner, spender)
            .checked_sub(*amount)
            .ok_or(PSP22Error::InsufficientAllowance)?;
        self.abacus_token
            .allowances
            .insert((*owner, *spender), &new_allowance);
        self.env().emit_event(psp22::Approval {
            owner: *owner,
            spender: *spender,
            value: new_allowance,
        });
        Ok(())
    }

    #[overrider(PSP22Internal)]
    fn _increase_allowance_from_to(
        &mut self,
        owner: &AccountId,
        spender: &AccountId,
        amount: &Balance,
    ) -> Result<(), PSP22Error> {
        let new_allowance = self
            ._allowance(owner, spender)
            .checked_add(*amount)
            .ok_or(PSP22Error::Custom("Overflow".into()))?;
        self.abacus_token
            .allowances
            .insert((*owner, *spender), &new_allowance);
        self.env().emit_event(psp22::Approval {
            owner: *owner,
            spender: *spender,
            value: new_allowance,
        });
        Ok(())
    }

    #[overrider(PSP22Internal)]
    fn _mint_to(
        &mut self,
        to: &AccountId,
        amount: &Balance,
    ) -> Result<(), PSP22Error> {
        panic!("Unsupported operation!")
    }

    #[overrider(PSP22Internal)]
    fn _burn_from(
        &mut self,
        from: &AccountId,
        amount: &Balance,
    ) -> Result<(), PSP22Error> {
        panic!("Unsupported operation!")
    }

    impl AbacusTokenImpl for AToken {}
    impl AbacusToken for AToken {
        #[ink(message)]
        fn emit_transfer_events(
            &mut self,
            transfer_event_data: Vec<TransferEventData>,
        ) -> Result<(), PSP22Error> {
            AbacusTokenImpl::emit_transfer_events(self, transfer_event_data)
        }

        #[ink(message)]
        fn emit_transfer_event_and_decrease_allowance(
            &mut self,
            transfer_event_data: TransferEventData,
            from: AccountId,
            to: AccountId,
            decrease_allowance_by: Balance,
        ) -> Result<(), PSP22Error> {
            AbacusTokenImpl::emit_transfer_event_and_decrease_allowance(
                self,
                transfer_event_data,
                from,
                to,
                decrease_allowance_by,
            )
        }

        #[ink(message)]
        fn get_lending_pool(&self) -> AccountId {
            AbacusTokenImpl::get_lending_pool(self)
        }
    }

    impl AToken {
        #[ink(constructor)]
        pub fn new(
            name: String,
            symbol: String,
            decimal: u8,
            lending_pool: AccountId,
            underlying_asset: AccountId,
        ) -> Self {
            let mut instance = Self::default();
            instance.metadata.name.set(&name.into());
            instance.metadata.symbol.set(&symbol.into());
            instance.metadata.decimals.set(&decimal);

            instance.abacus_token.lending_pool = lending_pool;
            instance.abacus_token.underlying_asset = underlying_asset;
            instance
        }

        #[ink(message)]
        pub fn own_code_hash(&mut self) -> Hash {
            self.env().own_code_hash().unwrap_or_else(|err| {
                panic!("contract should have a code hash: {:?}", err)
            })
        }
    }
}
