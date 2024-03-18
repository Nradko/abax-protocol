#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(PSP22, PSP22Metadata)]
#[ink::contract]
pub mod v_token {
    use abax_impls::abacus_token::{
        storage::AbacusTokenStorage, AbacusTokenImpl,
    };
    use abax_traits::{
        abacus_token::{AbacusToken, TransferEventData},
        lending_pool::{
            LendingPoolVTokenInterface, LendingPoolVTokenInterfaceRef,
        },
    };
    use ink::codegen::Env;
    use ink::prelude::string::String;

    use pendzl::contracts::psp22::{self, PSP22Error};

    #[ink(storage)]
    #[derive(Default, pendzl::traits::StorageFieldGetter)]
    pub struct VToken {
        #[storage_field]
        psp22: psp22::PSP22Data,
        #[storage_field]
        abacus_token: AbacusTokenStorage,
        #[storage_field]
        metadata: psp22::metadata::PSP22MetadataData,
    }

    #[overrider(PSP22Internal)]
    fn _balance_of(&self, owner: &AccountId) -> Balance {
        let lending_pool: LendingPoolVTokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        lending_pool.user_debt_of(self.abacus_token.underlying_asset, *owner)
    }

    #[overrider(PSP22Internal)]
    fn _allowance(&self, owner: &AccountId, spender: &AccountId) -> Balance {
        self.abacus_token
            .allowances
            .get((*owner, *spender))
            .unwrap_or(0)
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

    /// Transfers `value` amount of tokens from the caller's account to account `to`
    /// with additional `data` in unspecified format.
    ///
    /// On success a `Transfer` event is emitted.
    ///
    /// # Errors
    ///
    /// Returns `InsufficientBalance` error if there are not enough tokens on
    /// the caller's account Balance.
    ///
    /// !!!IMPORTANT!!!
    /// Returns `InsufficientAllowance` error if there are not enough tokens allowed
    ///  for the caller to !!! TRANSFER TO `to` !!!
    #[overrider(PSP22)]
    fn transfer(
        &mut self,
        to: AccountId,
        value: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error> {
        let from: AccountId = self.env().caller();
        let allowance = psp22::PSP22Internal::_allowance(self, &to, &from);
        if allowance < value {
            return Err(PSP22Error::InsufficientAllowance);
        }

        psp22::PSP22Internal::_decrease_allowance_from_to(
            self, &to, &from, &value,
        )?;
        psp22::PSP22Internal::_update(self, Some(&from), Some(&to), &value)?;
        Ok(())
    }
    /// Transfers `value` tokens on the behalf of `from` to the account `to`
    /// with additional `data` in unspecified format.
    ///
    /// This can be used to allow a contract to transfer tokens on ones behalf and/or
    /// to charge fees in sub-currencies, for example.
    ///
    /// On success a `Transfer` and `Approval` events are emitted.
    ///
    /// # Errors
    ///
    /// !!!IMPORTANT!!!
    /// Returns `InsufficientAllowance` error if there are not enough tokens allowed
    /// for the caller to !!! TRANSFER TO  `to` !!!.
    ///
    /// Returns `InsufficientBalance` error if there are not enough tokens on
    /// the the account Balance of `from`.
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
            self, &to, &caller, &value,
        )?;
        psp22::PSP22Internal::_update(self, Some(&from), Some(&to), &value)?;
        Ok(())
    }

    #[overrider(PSP22Internal)]
    fn _total_supply(&self) -> Balance {
        let lending_pool: LendingPoolVTokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        lending_pool.total_debt_of(self.abacus_token.underlying_asset)
    }

    #[overrider(PSP22Internal)]
    fn _update(
        &mut self,
        from: Option<&AccountId>,
        to: Option<&AccountId>,
        amount: &Balance,
    ) -> Result<(), PSP22Error> {
        let mut lending_pool: LendingPoolVTokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        let (mint_from_amount, mint_to_amount): (Balance, Balance) =
            lending_pool.transfer_debt_from_to(
                self.abacus_token.underlying_asset,
                *from.unwrap(),
                *to.unwrap(),
                *amount,
            )?;
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
                value: mint_from_amount,
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

    impl AbacusTokenImpl for VToken {}
    impl AbacusToken for VToken {
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

    impl VToken {
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
    }
}
