use abax_library::structs::MultiOpParams;
use abax_traits::lending_pool::{
    LendingPoolBorrowInternal, LendingPoolDepositInternal, LendingPoolError,
};
use ink::{prelude::vec::Vec, primitives::AccountId, storage::Mapping};
use pendzl::traits::StorageFieldGetter;

use super::{internal::LendingPowerChecker, storage::LendingPoolStorage};

fn add_to_lookups(
    lookup: &mut Mapping<u32, AccountId>,
    presence_lookup: &mut Mapping<AccountId, ()>,
    counter: &mut u32,
    value: AccountId,
) {
    if !presence_lookup.contains(value) {
        lookup.insert(*counter, &value);
        presence_lookup.insert(value, &());
        *counter = counter.checked_add(1).unwrap();
    }
}

pub trait LendingPoolMultiOpImpl:
    StorageFieldGetter<LendingPoolStorage>
    + LendingPowerChecker
    + LendingPoolDepositInternal
    + LendingPoolBorrowInternal
{
    fn multi_op(
        &mut self,
        op: Vec<MultiOpParams>,
    ) -> Result<(), LendingPoolError> {
        let mut accounts_to_check = Mapping::<u32, AccountId>::new();
        let mut presence_lookup = Mapping::<AccountId, ()>::new();
        let mut counter: u32 = 0;
        for o in op {
            match o {
                MultiOpParams::Deposit {
                    asset,
                    on_behalf_of,
                    amount,
                    data,
                } => {
                    self._deposit(asset, on_behalf_of, amount, data)?;
                }
                MultiOpParams::Redeem {
                    asset,
                    on_behalf_of,
                    amount,
                    data,
                } => {
                    self._redeem(asset, on_behalf_of, amount, data)?;
                    add_to_lookups(
                        &mut accounts_to_check,
                        &mut presence_lookup,
                        &mut counter,
                        on_behalf_of,
                    );
                }
                MultiOpParams::Borrow {
                    asset,
                    on_behalf_of,
                    amount,
                    data,
                } => {
                    self._borrow(asset, on_behalf_of, amount, data)?;
                    add_to_lookups(
                        &mut accounts_to_check,
                        &mut presence_lookup,
                        &mut counter,
                        on_behalf_of,
                    );
                }
                MultiOpParams::Repay {
                    asset,
                    on_behalf_of,
                    amount,
                    data,
                } => {
                    self._repay(asset, on_behalf_of, amount, data)?;
                    add_to_lookups(
                        &mut accounts_to_check,
                        &mut presence_lookup,
                        &mut counter,
                        on_behalf_of,
                    );
                }
                MultiOpParams::ChooseMarketRule { market_rule_id } => {
                    self._choose_market_rule(market_rule_id)?;
                    add_to_lookups(
                        &mut accounts_to_check,
                        &mut presence_lookup,
                        &mut counter,
                        Self::env().caller(),
                    );
                }
                MultiOpParams::SetAsCollateral {
                    asset,
                    use_as_collateral,
                } => {
                    self._set_as_collateral(asset, use_as_collateral)?;
                    add_to_lookups(
                        &mut accounts_to_check,
                        &mut presence_lookup,
                        &mut counter,
                        Self::env().caller(),
                    );
                }
            }
        }

        for i in 0..counter {
            let user = accounts_to_check.get(i).unwrap();
            self._ensure_is_collateralized(&user)?;
        }

        Ok(())
    }
}
