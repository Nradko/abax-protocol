pub mod storage;

use abax_traits::abacus_token::TransferEventData;
use ink::{
    prelude::{string::String, vec::Vec},
    primitives::AccountId,
};
use pendzl::{
    contracts::psp22::{psp22, PSP22Error},
    traits::{Balance, Storage},
};

use self::storage::AbacusTokenStorage;

pub trait AbacusTokenImpl:
    Storage<AbacusTokenStorage> + psp22::Internal
{
    fn emit_transfer_events(
        &mut self,
        events: Vec<TransferEventData>,
    ) -> Result<(), PSP22Error> {
        let lending_pool: AccountId = self.get_lending_pool();

        if lending_pool != Self::env().caller() {
            return Err(PSP22Error::Custom(String::from("NotLendingPool")));
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
            return Err(PSP22Error::Custom(String::from("NotLendingPool")));
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
        self.data::<AbacusTokenStorage>().lending_pool
    }
}
