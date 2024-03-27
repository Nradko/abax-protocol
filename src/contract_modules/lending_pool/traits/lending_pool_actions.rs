use abax_library::structs::Action;
use ink::prelude::vec::Vec;
use ink::{contract_ref, env::DefaultEnvironment, primitives::AccountId};
use pendzl::traits::Balance;

use crate::lending_pool::{LendingPoolError, RuleId};

pub type LendingPoolActionsRef =
    contract_ref!(LendingPoolActions, DefaultEnvironment);

/// Trait containing messges that are used by **lenders**, **borrowers** and **liquidators**.
#[ink::trait_definition]
pub trait LendingPoolActions {
    /// Callers choses a market rule caller want to use.
    ///
    /// * `market_rule_id` - the id of the market_rule to use.
    ///
    /// # Errors
    /// * `MarketRuleInvalidId` returned if the rule with `market_rule_id` doesn't exist.
    /// * `PriceFeedError` returned  if there is a problem with Price Oracle.
    /// * `InsufficientCollateral` returned if there is insufficient collateral after choosing rule with `market_rule_id` returned .
    #[ink(message)]
    fn choose_market_rule(
        &mut self,
        market_rule_id: RuleId,
    ) -> Result<(), LendingPoolError>;

    /// Caller chooses to `use_as_colalteral` an `asset`.
    /// i.e. if the callers's deposit of the `asset` should back caller's debt and be vulnerable to liquidation.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that should be allowed as collateral.
    /// * `use_as_collateral` - true if the user wants to use the asset as collateral, false in the opposite case.
    ///
    /// # Errors
    /// * `RuleCollateralDisable` returned if the `market_rule` chosen by caller doesn't support `asset` returned  as collateral.
    /// * `MinimalCollateralDeposit` returned if the caller's deposit of an `asset` is smaller than `minimal_collateral` returned .
    /// * `PriceFeedError` returned  if there is a problem with Price Oracle.
    /// * `InsufficientCollateral` returned if `use_as_collateral` ==false and insufficient collateralafter disabling `asset` returned  as a collateral.
    #[ink(message)]
    fn set_as_collateral(
        &mut self,
        asset: AccountId,
        use_as_collateral: bool,
    ) -> Result<(), LendingPoolError>;

    /// Caller make deposits `amount` of an `asset` `on_behalf_of`.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that is deposited.
    /// * `on_behalf_of` - AccountId (aka address) on behalf of which deposit is done.
    /// * `amount` - the number of tokens to be deposited in an absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000).
    /// * `data` - additional data, currently unused.
    ///
    /// # Errors
    /// * `AmountNotGreaterThanZero` returned if `amount` returned  == 0.
    /// * `AssetNotRegistered` returned if the `asset` is not registered in the `LendingPool` returned.
    /// * `Inactive` returned if the reserve coresponding to the `asset` is inactive.
    /// * `Frozen` returned if the reserve coresponding to the `asset' is frozen.
    /// * `MaxDepositReached` returned if the total deposit after this deposit is higher than maximal_deposit.
    /// * `PSP22Error` returned if transfer of `asset`fails.
    #[ink(message)]
    fn deposit(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
    /// is used by a user0, to withdraw on an account of on_behalf_of an asset to LendingPool.
    /// Withdraw can fail if the user has current debt and withdrawing would make the user's position undercollateralized.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that must be allowed to be borrowed.
    /// * `on_behalf_of` - AccountId (aka address) of a user1 (may be the same or not as user0) on behalf of who
    ///     user0 is making withdraw. If user0 != user1 then the allowance of on appropriate AToken will be decreased.
    /// * `amount` - the number of tokens to be withdrawed. if greater then deposit_amount then only deposit_amopunt will be withdrawn.
    /// * `data` - additional data currently unused.
    ///
    /// # Errors
    /// * `AmountNotGreaterThanZero` returned if `amount`  == 0.
    /// * `AssetNotRegistered` returned if the `asset` is not registered in the `LendingPool`.
    /// * `Inactive` returned if the reserve coresponding to the `asset` is inactive.
    /// * `InsufficientCollateral` returned if the 'asset' is used as colalteral by 'on_behalf_of" and after withdraw the 'on_behalf_of' would become undercollaterized.
    /// * `PSP22Error` returned if transfer of `asset`fails.
    #[ink(message)]
    fn withdraw(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError>;

    /// Caller takes `amount` of an `asset` as a debt that is accounted `on_bahalf_of`.
    /// Tokens are transferred to the `caller`.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that is borrowed.
    /// * `on_behalf_of` - AccountId (aka address) on behalf of who caller is taking debt. If `caller` != `on_behalf_of` then tje allowance of appropariate VToken will be decerased.
    /// * `amount` - the number of tokens to be borrowed in absolute value (1 USDT = 1_000_000, 1 AZERO = 1_000_000_000_000).
    /// * `data` - additional data that is unused.
    ///
    /// # Errors
    /// * `AmountNotGreaterThanZero` returned  if `amount`  == 0.
    /// * `AssetNotRegistered` returned if the `asset` is not registered in the `LendingPool`.
    /// * `Inactive` returned if the reserve coresponding to the `asset` is inactive.
    /// * `Frozen` returned if the reserve coresponding to the `asset` is frozen.
    /// * `MinimalDebt` returned if after taking the loan the debt of `on_bahalf_of` is smaller than minimal_debt.
    /// * `MaxDebtReached` returned if after borrowig the total_debt is greated than maximal_total_debt.
    /// * `PriceFeedError` returned if there is a problem with Price Oracle.
    /// * `InsufficientCollateral` returned if `use_as_collateral` ==false and insufficient collateralafter disabling `asset` as a collateral.
    /// * `PSP22Error` returned if transfer of `asset` fails (also in the case if the `caller` != `on_behalf_of` and the caller has not enough allowance).
    #[ink(message)]
    fn borrow(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
    /// Caller repays `amount` of `asset` `on_behalf_of`'s debt. Tokens are transferred from the `caller`.
    ///
    /// * `asset` - AccountId (aka address) of PSP22 that is repayed.
    /// * `on_behalf_of` - AccountId (aka address) on behalf of who caller is repaying the debt.
    /// * `amount` - the number of tokens to be repaid. If it is greater then debt_amount only debt_amount will be repaid.
    /// * `data` - additional data currently unused.
    ///
    /// # Errors
    /// * `AmountNotGreaterThanZero` returned if `amount`== 0.
    /// * `AssetNotRegistered` returned if the `asset` is not registered in the `LendingPool`.
    /// * `Inactive` returned if the reserve coresponding to the `asset` is inactive.
    /// * `MinimalDebt` returned if after repaying the loan the debt of `on_bahalf_of` is smaller than minimal_debt and != 0.
    /// * `PSP22Error` returned if transfer of the `asset` fails.
    #[ink(message)]
    fn repay(
        &mut self,
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    ) -> Result<Balance, LendingPoolError>;

    /// Caller perform `actions` on behalf of `on_behalf_of`.
    ///
    /// * `actions` - a vector of actions that should be performed.
    /// * `on_behalf_of` - AccountId (aka address) on behalf of who caller is performing.
    /// * `data` - additional data currently unused.
    ///
    /// # Errors
    /// check 'Deposit', 'Withdraw', 'Borrow', 'Repay' for possible errors.
    #[ink(message)]
    fn multi_op(
        &mut self,
        actions: Vec<Action>,
        on_behalf_of: AccountId,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;

    /// is used by a liquidator to liquidate the uncollateralized position of another user
    ///
    /// * `liquidated_account` - AccountId (aka address) whose position should be liquidated. liquidated_account must be undercollateralized.
    /// * `asset_to_repay` - AccountId (aka address) of PSP22 that liquidated_account has debt in.
    /// * `asset_to_take` - AccountId (aka address) of PSP22 that liquidated_account has supplied and is using as collateral. This asset will be a liquidator reward i.e. liquidator will receive aTokens corresponding to this asset.
    /// * `amount_to_repay` - the number of tokens to be repaid in absolute value (1USDT = 1_000_000, 1AZERO = 1_000_000_000_000). The minimum of amount_to_repay and `liquidated_account` debt will be repaid.
    /// * `minimum_recieved_for_one_repaid_token_e12` - minimum amount of asset_to_take to be received by liquidator per 1 repaid token multiplied by 10^12. !Notice! In the case of AZERO 1 token is 10^-12 of AZERO and in the case of USDT 1 token is 10^-6 of USDT. The liquidator must be conscious and use absolute values.
    /// * `data` - additional data, currently unused.
    ///
    /// # Errors
    /// * `NoPriceFeed` returned if there is problem wirg oracle.
    /// * `Collaterized` returned if the `liaudiated_account` is collaterized.
    /// * `AssetNotRegistered` returned if the `asset_to_take` or `asset_to_repay` were not registered.
    /// * `NothingToRepay` returned if the `liquidated_account` has no `asset_to_repay` debt.
    /// * `NothingToCompensateWith` returned if the `liquidated_account` has no `asset_to_take` deposit.
    /// * `TakingNotACollateral` returned if the `asset_to_take` is not used as collateral by `liqudiated_account`.
    #[ink(message)]
    fn liquidate(
        &mut self,
        liquidated_account: AccountId,
        asset_to_repay: AccountId,
        asset_to_take: AccountId,
        amount_to_repay: Balance,
        minimum_recieved_for_one_repaid_token_e12: u128,
        data: Vec<u8>,
    ) -> Result<(Balance, Balance), LendingPoolError>;
}
