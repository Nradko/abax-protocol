use pendzl::traits::{AccountId, Balance};

use crate::traits::lending_pool::errors::LendingPoolError;
use ink::{contract_ref, env::DefaultEnvironment, prelude::vec::Vec};

use super::types::RuleId;

pub type LendingPoolBorrowRef =
    contract_ref!(LendingPoolBorrow, DefaultEnvironment);

/// contains `set_as_collateral`, `borow` and `repay` functions
#[ink::trait_definition]
pub trait LendingPoolBorrow {
    /// is used by user to chose a market rule user want to use.
    /// After changing the chosen market rule users position should be collaterized
    ///
    /// * `market_rule_id` - the id of the market_rule to use.
    #[ink(message)]
    fn choose_market_rule(
        &mut self,
        market_rule_id: RuleId,
    ) -> Result<(), LendingPoolError>;

    /// is used by a user to choose to use or not a given asset as a collateral
    /// i.e. if the user's deposit of this concrete asset should back his debt and be vulnerable to liquidation.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be collateral.
    /// * `use_as_collateral` - true if the user wants to use the asset as collateral, false in the opposite case.
    #[ink(message)]
    fn set_as_collateral(
        &mut self,
        asset: AccountId,
        use_as_collateral: bool,
    ) -> Result<(), LendingPoolError>;
    /// is used by a user0, once he made a deposit and chosen users collaterals, to borrow an asset from LendingPool.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user1 is making borrow. In case user0 != user1 the allowance on appropriate VToken will be decreased.
    /// * `amount` - the number of tokens to be borrowed in absolute value (1 USDT = 1_000_000, 1 AZERO = 1_000_000_000_000).
    /// * `data` - additional data currently unused.
    #[ink(message)]
    fn borrow(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
    /// is used by a user0, once he made a borrow, to repay a debt taken in the asset from LendingPool.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user1 is making borrow. In case user0 != user1 the allowance on appropriate VToken will be decreased.
    /// * `amount` - the number of tokens to be repaid. If it is greater then debt_amount only debt_amount will be repaid.
    /// * `data` - additional data currently unused.
    #[ink(message)]
    fn repay(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError>;
}
