use ink::{
    prelude::{string::String, vec::Vec},
    primitives::AccountId,
};
use pendzl::{
    contracts::psp22::{psp22, PSP22Error},
    traits::{Balance, Storage},
};

use crate::traits::abacus_token::traits::abacus_token::TransferEventData;

use crate::impls::abacus_token::data::AbacusTokenData;

pub trait AbacusTokenImpl: Storage<AbacusTokenData> + psp22::Internal {
    fn emit_transfer_events(
        &mut self,
        events: Vec<TransferEventData>,
    ) -> Result<(), PSP22Error> {
        let lending_pool: AccountId = self.get_lending_pool();

        if lending_pool != Self::env().caller() {
            return Err(From::from(PSP22Error::Custom(
                String::from("NotLendingPool").into(),
            )));
        }
        for event in &events {
            if event.amount != 0 {
                <Self as psp22::Internal>::_emit_transfer_event(
                    self,
                    event.from,
                    event.to,
                    event.amount,
                );
            }
        }
        Ok(())
    }

    fn emit_transfer_event_and_decrease_allowance(
        &mut self,
        event: TransferEventData,
        owner: AccountId,
        spender: AccountId,
        decrease_allowance_by: Balance,
    ) -> Result<(), PSP22Error> {
        let lending_pool: AccountId = self.get_lending_pool();

        if lending_pool != Self::env().caller() {
            return Err(From::from(PSP22Error::Custom(
                String::from("NotLendingPool").into(),
            )));
        }
        if event.amount != 0 {
            self._emit_transfer_event(event.from, event.to, event.amount);
        }

        let allowance = self._allowance(&owner, &spender);

        if allowance < decrease_allowance_by {
            return Err(PSP22Error::InsufficientAllowance);
        }

        self._approve_from_to(
            owner,
            spender,
            allowance - decrease_allowance_by,
        )?;

        Ok(())
    }

    fn get_lending_pool(&self) -> AccountId {
        self.data::<AbacusTokenData>().lending_pool
    }
}
