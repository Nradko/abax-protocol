pub mod storage;

use abax_traits::abacus_token::TransferEventData;
use ink::{
    prelude::{string::String, vec::Vec},
    primitives::AccountId,
};
use pendzl::{
    contracts::psp22::{PSP22Error, PSP22Internal, Transfer},
    traits::{Balance, StorageFieldGetter},
};

use self::storage::AbacusTokenStorage;

pub trait AbacusTokenImpl:
    StorageFieldGetter<AbacusTokenStorage> + PSP22Internal
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
                Self::env().emit_event(Transfer {
                    from: event.from,
                    to: event.to,
                    value: event.amount,
                });
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
            Self::env().emit_event(Transfer {
                from: event.from,
                to: event.to,
                value: event.amount,
            })
        }

        let allowance = self._allowance(&owner, &spender);

        if allowance < decrease_allowance_by {
            return Err(PSP22Error::InsufficientAllowance);
        }

        self._decrease_allowance_from_to(
            &owner,
            &spender,
            &decrease_allowance_by,
        )?;

        Ok(())
    }

    fn get_lending_pool(&self) -> AccountId {
        self.data::<AbacusTokenStorage>().lending_pool
    }
}
