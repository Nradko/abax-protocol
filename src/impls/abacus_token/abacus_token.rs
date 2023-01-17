#![allow(unused_variables)]
use ink_prelude::{
    string::String,
    vec::Vec,
};
use openbrush::{
    contracts::psp22::{
        psp22,
        PSP22Error,
    },
    modifier_definition,
    modifiers,
    traits::{
        AccountId,
        Balance,
        DefaultEnv,
        Storage,
    },
};

use crate::traits::abacus_token::traits::abacus_token::*;

use crate::impls::abacus_token::data::AbacusTokenData;

#[modifier_definition]
pub fn only_lending_pool<T, F, R, E>(instance: &mut T, body: F) -> Result<R, E>
where
    T: AbacusToken,
    F: FnOnce(&mut T) -> Result<R, E>,
    E: From<PSP22Error>,
{
    let lending_pool: AccountId = instance.get_lending_pool();

    if lending_pool != T::env().caller() {
        return Err(From::from(PSP22Error::Custom(String::from("NotLendingPool"))))
    }

    body(instance)
}

impl<T: Storage<AbacusTokenData> + psp22::Internal> AbacusToken for T {
    #[modifiers(only_lending_pool)]
    default fn emit_transfer_events(&mut self, events: Vec<TransferEventData>) -> Result<(), PSP22Error> {
        ink_env::debug_println!("[ impl AbacusToken ] emit_transfer_events START");
        for event in &events {
            if event.amount != 0 {
                <Self as psp22::Internal>::_emit_transfer_event(self, event.from, event.to, event.amount);
            }
        }
        ink_env::debug_println!("[ impl AbacusToken ] emit_transfer_events STOP");
        Ok(())
    }

    #[modifiers(only_lending_pool)]
    default fn emit_transfer_event_and_decrease_allowance(
        &mut self,
        event: TransferEventData,
        owner: AccountId,
        spender: AccountId,
        decrease_allowance_by: Balance,
    ) -> Result<(), PSP22Error> {
        if event.amount != 0 {
            self._emit_transfer_event(event.from, event.to, event.amount);
        }

        let allowance = self._allowance(&owner, &spender);

        if allowance < decrease_allowance_by {
            return Err(PSP22Error::InsufficientAllowance)
        }

        self._approve_from_to(owner, spender, allowance - decrease_allowance_by)?;

        Ok(())
    }

    default fn get_lending_pool(&self) -> AccountId {
        self.data::<AbacusTokenData>().lending_pool
    }
}
