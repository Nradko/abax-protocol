#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[pendzl::implementation(PSP22, PSP22Metadata)]
#[ink::contract]
pub mod v_token {
    use ink::{
        codegen::{EmitEvent, Env},
        prelude::string::String,
    };

    use lending_project::impls::abacus_token::{
        storage::AbacusTokenStorage, AbacusTokenImpl,
    };
    use lending_project::traits::{
        abacus_token::AbacusToken, abacus_token::*,
        lending_pool::LendingPoolVTokenInterface,
        lending_pool::LendingPoolVTokenInterfaceRef,
    };
    use pendzl::{
        contracts::psp22::{extensions::metadata::*, PSP22Error},
        traits::Storage,
    };

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct VToken {
        #[storage_field]
        psp22: psp22::Data,
        #[storage_field]
        abacus_token: AbacusTokenStorage,
        #[storage_field]
        metadata: metadata::Data,
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

    #[overrider(psp22::Internal)]
    fn _balance_of(&self, owner: &AccountId) -> Balance {
        let lending_pool: LendingPoolVTokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        lending_pool.user_debt_of(self.abacus_token.underlying_asset, *owner)
    }

    #[overrider(psp22::Internal)]
    fn _allowance(&self, owner: &AccountId, spender: &AccountId) -> Balance {
        self.abacus_token
            .allowances
            .get(&(*owner, *spender))
            .unwrap_or(0)
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
        let allowance = psp22::Internal::_allowance(self, &to, &from);
        if allowance < value {
            return Err(PSP22Error::InsufficientAllowance);
        }

        psp22::Internal::_approve_from_to(self, to, from, allowance - value)?;
        psp22::Internal::_transfer_from_to(self, from, to, value, data)?;
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
        let allowance = psp22::Internal::_allowance(self, &from, &caller);
        if allowance < value {
            return Err(PSP22Error::InsufficientAllowance);
        }

        psp22::Internal::_approve_from_to(self, to, caller, allowance - value)?;
        psp22::Internal::_transfer_from_to(self, from, to, value, data)?;
        Ok(())
    }

    #[overrider(psp22::Internal)]
    fn _total_supply(&self) -> Balance {
        let lending_pool: LendingPoolVTokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        lending_pool.total_debt_of(self.abacus_token.underlying_asset)
    }

    #[overrider(psp22::Internal)]
    #[allow(unused_variables)]
    fn _transfer_from_to(
        &mut self,
        from: AccountId,
        to: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), PSP22Error> {
        // self._before_token_transfer(Some(&from), Some(&to), &amount)?;
        let mut lending_pool: LendingPoolVTokenInterfaceRef =
            self.abacus_token.lending_pool.into();
        let (mint_from_amount, mint_to_amount): (Balance, Balance) =
            lending_pool.transfer_debt_from_to(
                self.abacus_token.underlying_asset,
                from,
                to,
                amount,
            )?;
        // self._after_token_transfer(Some(&from), Some(&to), &amount)?;
        if mint_from_amount > 0 {
            psp22::Internal::_emit_transfer_event(
                self,
                None,
                Some(from),
                mint_from_amount,
            );
        }
        if mint_to_amount > 0 {
            psp22::Internal::_emit_transfer_event(
                self,
                None,
                Some(to),
                mint_to_amount,
            );
        }

        psp22::Internal::_emit_transfer_event(
            self,
            Some(from),
            Some(to),
            amount,
        );

        Ok(())
    }

    #[overrider(psp22::Internal)]
    fn _approve_from_to(
        &mut self,
        owner: AccountId,
        spender: AccountId,
        amount: Balance,
    ) -> Result<(), PSP22Error> {
        self.abacus_token
            .allowances
            .insert(&(owner, spender), &amount);
        psp22::Internal::_emit_approval_event(self, owner, spender, amount);
        Ok(())
    }

    #[overrider(psp22::Internal)]
    fn _mint_to(
        &mut self,
        _account: AccountId,
        _amount: Balance,
    ) -> Result<(), PSP22Error> {
        panic!("Unsupported operation!")
    }

    #[overrider(psp22::Internal)]
    fn _burn_from(
        &mut self,
        _account: AccountId,
        _amount: Balance,
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
