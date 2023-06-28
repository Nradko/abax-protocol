use openbrush::traits::{
    AccountId,
    Balance,
};

use crate::traits::lending_pool::errors::LendingPoolError;
use ink::prelude::vec::Vec;

#[openbrush::wrapper]
pub type LendingPoolRef = dyn LendingPoolDeposit + LendingPoolBorrow + LendingPoolLiquidate;

#[openbrush::wrapper]
pub type LendingPoolDepositRef = dyn LendingPoolDeposit;

#[openbrush::wrapper]
pub type LendingPoolBorrowRef = dyn LendingPoolBorrow;

#[openbrush::wrapper]
pub type LendingPoolLiquidateRef = dyn LendingPoolLiquidate;

#[openbrush::wrapper]
pub type LendingPoolMaintainRef = dyn LendingPoolMaintain;

#[openbrush::wrapper]
pub type LendingPoolFlashRef = dyn LendingPoolFlash;

/// contains `deposit` and `redeem` functions
#[openbrush::trait_definition]
pub trait LendingPoolDeposit {
    /// is used by a user0, to deposit on an account of on_behalf_of an asset to LendingPool.
    /// Then, within the possibilities, a deposit can be marked as collateral and used to back a loan.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user0 is making a deposit.
    /// * `amount` - the number of tokens to be deposited in an absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000).
    /// * `data` - additional data that is currently unused. In the future it could for example specify some additional data to be passed during PSP22::transfer_from
    #[ink(message)]
    fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
    /// is used by a user0, to redeem on an account of on_behalf_of an asset to LendingPool.
    /// Redeem can fail if the user has current debt and redeeming would make the user's position undercollateralized.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user0 is making redeem. If user0 != user1 then the allowance of on appropriate AToken will be decreased.
    /// * `amount` - the number of tokens to be redeemed in Some absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000) or None to redeem all.
    /// * `data` - additional data that is currently unused. In the future it could for example specify some additional data to be passed during PSP22::transfer_from
    #[ink(message)]
    fn redeem(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Option<Balance>,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError>;
}

/// contains `set_as_collateral`, `borow` and `repay` functions
#[openbrush::trait_definition]
pub trait LendingPoolBorrow {
    /// is used by user to chose a market rule user want to use.
    /// After changing the chosen market rule users position should be collaterized
    ///
    /// * `market_rule_id` - the id of the market_rule to use.
    #[ink(message)]
    fn choose_market_rule(&mut self, market_rule_id: u64) -> Result<(), LendingPoolError>;

    /// is used by a user to choose to use or not a given asset as a collateral
    /// i.e. if the user's deposit of this concrete asset should back his debt and be vulnerable to liquidation.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be collateral.
    /// * `use_as_collateral` - true if the user wants to use the asset as collateral, false in the opposite case.
    #[ink(message)]
    fn set_as_collateral(&mut self, asset: AccountId, use_as_collateral: bool) -> Result<(), LendingPoolError>;
    /// is used by a user0, once he made a deposit and chosen users collaterals, to borrow an asset from LendingPool.
    /// user0 can specify a Variable or Stable borrow rate by passing 0 or 1 in data\[0\].
    ///
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user1 is making borrow. In case user0 != user1 the allowance on appropriate VToken or SToken will be decreased.
    /// * `amount` - the number of tokens to be borrowed in absolute value (1 USDT = 1_000_000, 1 AZERO = 1_000_000_000_000).
    /// * `data` - additional data to specify borrow options. Right now it is only used to specify Variable or Stable borrow rates.
    #[ink(message)]
    fn borrow(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
    /// is used by a user0, once he made a borrow, to repay a debt taken in the asset from LendingPool.
    /// user0 can specify a Variable or Stable debt to repay by passing 0 or 1 in data\[0\].
    ///
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user1 is making borrow. In case user0 != user1 the allowance on appropriate VToken or SToken will be decreased.
    /// * `amount_arg` - the number of tokens to be repaid. Pass None to repay all debt or Some in absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000).
    /// * `data` - additional data to specify repayment options. Right now it is only used to specify Variable or Stable borrow rates.
    #[ink(message)]
    fn repay(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount_arg: Option<Balance>,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError>;
}

/// contains `liquidate` function
#[openbrush::trait_definition]
pub trait LendingPoolLiquidate {
    /// is used by a liquidator to liquidate the uncollateralized position of another user
    ///
    /// * `liquidated_user` - AccountId (aka address) of a user whose position should be liquidated. liquidated_user must be undercollateralized
    /// * `asset_to_repay` - AccountId (aka address) of PSP22 that liquidated_user has debt in.
    /// * `asset_to_take` - AccountId (aka address) of PSP22 that liquidated_user has supplied and is using as collateral.
    ///     This asset will be a liquidator reward i.e. it will be transferred to his Account.
    /// * `amount_to_repay` - the number of tokens to be repaid. Pass None to repay all debt or Some in absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000).
    /// * `minimum_recieved_for_one_repaid_token_e12` - minimum amount of asset_to_take to be received by liquidator per 1 repaid token multiplied by 10^12.
    ///     Notice!!! In the case of AZERO 1 token is 10^-12 of AZERO and in the case of USDT 1 token is 10^-6 of AZERO. The liquidator must be conscious and use absolute values.
    /// * `data` - additional data to specify liquidate options. Right now it is only used to specify Variable or Stable debts to be liquidated.
    #[ink(message)]
    fn liquidate(
        &mut self,
        liquidated_user: AccountId,
        asset_to_repay: AccountId,
        asset_to_take: AccountId,
        amount_to_repay: Option<Balance>,
        minimum_recieved_for_one_repaid_token_e12: u128,
        data: Vec<u8>,
    ) -> Result<(Balance, Balance), LendingPoolError>;
}

/// contains `accumulate_interest`, `acumulate_user_interest`, `rebalance_stable_borrow_rate` functions
#[openbrush::trait_definition]
pub trait LendingPoolMaintain {
    /// is used by anyone to accumulate deposit and variable rate interests
    ///
    ///  * `asset` - AccountId (aka address) of asset of which interests should be accumulated
    #[ink(message)]
    fn accumulate_interest(&mut self, asset: AccountId) -> Result<(), LendingPoolError>;
    /// is used by anyone to update reserve's asset price //TODO: we need to get oracle API first!
    ///
    ///  * `reserve_token_address` - AccountId (aka address) of an asset to update price for
    ///  * `price_e8` - price of the token in E8 notation (multiplied by 10^8)
    #[ink(message)]
    fn insert_reserve_token_price_e8(&mut self, asset: AccountId, price_e8: u128) -> Result<(), LendingPoolError>;
}

/// contains `flash_looan` function
#[openbrush::trait_definition]
pub trait LendingPoolFlash {
    #[ink(message)]
    fn flash_loan(
        &mut self,
        receiver_address: AccountId,
        assets: Vec<AccountId>,
        amounts: Vec<Balance>,
        receiver_params: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
}
