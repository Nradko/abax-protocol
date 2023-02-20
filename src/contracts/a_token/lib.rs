#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

#[openbrush::contract]
pub mod a_token {
    // imports from ink!
    use ink::codegen::{
        EmitEvent,
        Env,
    };

    use ink::prelude::{
        string::String,
        vec::Vec,
    };

    use ink::env::CallFlags;
    use lending_project::{
        impls::abacus_token::data as abacus_token,
        traits::{
            abacus_token::traits::abacus_token::*,
            lending_pool::traits::a_token_interface::LendingPoolATokenInterfaceRef,
        },
    };
    use openbrush::{
        contracts::psp22::{
            extensions::metadata::*,
            PSP22Error,
        },
        traits::{
            AccountIdExt,
            DefaultEnv,
            Flush,
            Storage,
        },
    };

    #[ink(storage)]
    #[derive(Default, Storage)]
    pub struct AToken {
        #[storage_field]
        abacus_token: abacus_token::AbacusTokenData,
        #[storage_field]
        metadata: metadata::Data,
    }

    // Section contains default implementation without any modifications
    impl PSP22 for AToken {
        #[ink(message)]
        fn total_supply(&self) -> Balance {
            LendingPoolATokenInterfaceRef::total_supply_of(
                &self.abacus_token.lending_pool,
                self.abacus_token.underlying_asset,
            )
        }
        #[ink(message)]
        fn balance_of(&self, owner: AccountId) -> Balance {
            self._balance_of(&owner)
        }

        /// Returns the amount which `spender` is still allowed to withdraw from `owner`.
        ///
        /// Returns `0` if no allowance has been set `0`.
        #[ink(message)]
        fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance {
            self._allowance(&owner, &spender)
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
        /// Returns `ZeroSenderAddress` error if sender's address is zero.
        ///
        /// Returns `ZeroRecipientAddress` error if recipient's address is zero.
        #[ink(message)]
        fn transfer(&mut self, to: AccountId, value: Balance, data: Vec<u8>) -> Result<(), PSP22Error> {
            let from: AccountId = Self::env().caller();
            self._transfer_from_to(from, to, value, data)?;
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
        /// Returns `InsufficientAllowance` error if there are not enough tokens allowed
        /// for the caller to withdraw from `from`.
        ///
        /// Returns `InsufficientBalance` error if there are not enough tokens on
        /// the the account Balance of `from`.
        ///
        /// Returns `ZeroSenderAddress` error if sender's address is zero.
        ///
        /// Returns `ZeroRecipientAddress` error if recipient's address is zero.
        #[ink(message)]
        fn transfer_from(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
            data: Vec<u8>,
        ) -> Result<(), PSP22Error> {
            let caller = Self::env().caller();
            let allowance = self._allowance(&from, &caller);

            if allowance < value {
                return Err(PSP22Error::InsufficientAllowance)
            }

            self._approve_from_to(from, caller, allowance - value)?;
            self._transfer_from_to(from, to, value, data)?;
            Ok(())
        }

        /// Allows `spender` to withdraw from the caller's account multiple times, up to
        /// the `value` amount.
        ///
        /// If this function is called again it overwrites the current allowance with `value`.
        ///
        /// An `Approval` event is emitted.
        ///
        /// # Errors
        ///
        /// Returns `ZeroSenderAddress` error if sender's address is zero.
        ///
        /// Returns `ZeroRecipientAddress` error if recipient's address is zero.
        #[ink(message)]
        fn approve(&mut self, spender: AccountId, value: Balance) -> Result<(), PSP22Error> {
            let owner = Self::env().caller();
            self._approve_from_to(owner, spender, value)?;
            Ok(())
        }

        /// Atomically increases the allowance granted to `spender` by the caller.
        ///
        /// An `Approval` event is emitted.
        ///
        /// # Errors
        ///
        /// Returns `ZeroSenderAddress` error if sender's address is zero.
        ///
        /// Returns `ZeroRecipientAddress` error if recipient's address is zero.
        #[ink(message)]
        fn increase_allowance(&mut self, spender: AccountId, delta_value: Balance) -> Result<(), PSP22Error> {
            let owner = Self::env().caller();
            self._approve_from_to(owner, spender, self._allowance(&owner, &spender) + delta_value)
        }

        /// Atomically decreases the allowance granted to `spender` by the caller.
        ///
        /// An `Approval` event is emitted.
        ///
        /// # Errors
        ///
        /// Returns `InsufficientAllowance` error if there are not enough tokens allowed
        /// by owner for `spender`.
        ///
        /// Returns `ZeroSenderAddress` error if sender's address is zero.
        ///
        /// Returns `ZeroRecipientAddress` error if recipient's address is zero.
        #[ink(message)]
        fn decrease_allowance(&mut self, spender: AccountId, delta_value: Balance) -> Result<(), PSP22Error> {
            let owner = Self::env().caller();
            let allowance = self._allowance(&owner, &spender);

            if allowance < delta_value {
                return Err(PSP22Error::InsufficientAllowance)
            }

            self._approve_from_to(owner, spender, allowance - delta_value)
        }
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

    impl psp22::Internal for AToken {
        fn _emit_transfer_event(&self, _from: Option<AccountId>, _to: Option<AccountId>, _amount: Balance) {
            ink::env::debug_println!("[  AToken ] _emit_transfer_event START");

            self.env().emit_event(Transfer {
                from: _from,
                to: _to,
                value: _amount,
            });
            ink::env::debug_println!("[  AToken ] _emit_transfer_event STOP");
        }
        fn _emit_approval_event(&self, _owner: AccountId, _spender: AccountId, _amount: Balance) {
            self.env().emit_event(Approval {
                owner: _owner,
                spender: _spender,
                value: _amount,
            })
        }

        fn _balance_of(&self, owner: &AccountId) -> Balance {
            LendingPoolATokenInterfaceRef::user_supply_of(
                &(self.abacus_token.lending_pool),
                self.abacus_token.underlying_asset,
                *owner,
            )
        }

        fn _allowance(&self, owner: &AccountId, spender: &AccountId) -> Balance {
            self.abacus_token.allowances.get(&(*owner, *spender)).unwrap_or(0)
        }
        fn _do_safe_transfer_check(
            &mut self,
            from: &AccountId,
            to: &AccountId,
            value: &Balance,
            data: &Vec<u8>,
        ) -> Result<(), PSP22Error> {
            self.flush();
            // TODO:: possible vurnerability. Reentrancy attack????
            let builder = PSP22ReceiverRef::before_received_builder(
                to,
                Self::env().caller(),
                from.clone(),
                value.clone(),
                data.clone(),
            )
            .call_flags(CallFlags::default().set_allow_reentry(true));
            let result = match builder.try_invoke() {
                Ok(Ok(Ok(_))) => Ok(()),
                Ok(Ok(Err(e))) => Err(e.into()),
                // Means unknown method
                Ok(Err(ink::LangError::CouldNotReadInput)) => Ok(()),
                // `NotCallable` means that the receiver is not a contract.
                Err(ink::env::Error::NotCallable) => Ok(()),
                _ => {
                    Err(PSP22Error::SafeTransferCheckFailed(
                        String::from("Error during call to receiver").into(),
                    ))
                }
            };
            self.load();
            result?;
            Ok(())
        }

        fn _transfer_from_to(
            &mut self,
            from: AccountId,
            to: AccountId,
            amount: Balance,
            data: Vec<u8>,
        ) -> Result<(), PSP22Error> {
            if from.is_zero() {
                return Err(PSP22Error::ZeroSenderAddress)
            }
            if to.is_zero() {
                return Err(PSP22Error::ZeroRecipientAddress)
            }
            // self._before_token_transfer(Some(&from), Some(&to), &amount)?;

            self._do_safe_transfer_check(&from, &to, &amount, &data)?;

            let (mint_from_amount, mint_to_amount): (Balance, Balance) =
                LendingPoolATokenInterfaceRef::transfer_supply_from_to(
                    &(self.abacus_token.lending_pool),
                    self.abacus_token.underlying_asset,
                    from,
                    to,
                    amount,
                )?;

            // self._after_token_transfer(Some(&from), Some(&to), &amount)?;
            self._emit_transfer_event(None, Some(from), mint_from_amount);
            self._emit_transfer_event(None, Some(to), mint_to_amount);
            self._emit_transfer_event(Some(from), Some(to), amount);

            Ok(())
        }

        fn _approve_from_to(
            &mut self,
            owner: AccountId,
            spender: AccountId,
            amount: Balance,
        ) -> Result<(), PSP22Error> {
            if owner.is_zero() {
                return Err(PSP22Error::ZeroSenderAddress)
            }
            if spender.is_zero() {
                return Err(PSP22Error::ZeroRecipientAddress)
            }

            self.abacus_token.allowances.insert(&(owner, spender), &amount);
            self._emit_approval_event(owner, spender, amount);
            Ok(())
        }

        fn _mint_to(&mut self, _account: AccountId, _amount: Balance) -> Result<(), PSP22Error> {
            panic!("Unsupported operation!")
        }

        fn _burn_from(&mut self, _account: AccountId, _amount: Balance) -> Result<(), PSP22Error> {
            panic!("Unsupported operation!")
        }
    }

    impl PSP22Metadata for AToken {}

    impl AbacusToken for AToken {}

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
            instance.metadata.name = Some(name.into());
            instance.metadata.symbol = Some(symbol.into());
            instance.metadata.decimals = decimal;

            instance.abacus_token.lending_pool = lending_pool;
            instance.abacus_token.underlying_asset = underlying_asset;
            instance
        }
    }
}
