use pendzl::traits::{AccountId, Balance};

use crate::traits::lending_pool::errors::LendingPoolError;

use ink::{contract_ref, prelude::string::String};
use ink::{env::DefaultEnvironment, prelude::vec::Vec};

use super::types::{MarketRule, RuleId};

pub type LendingPoolManageRef =
    contract_ref!(LendingPoolManage, DefaultEnvironment);

#[ink::trait_definition]
pub trait LendingPoolManage {
    #[ink(message)]
    fn set_price_feed_provider(
        &mut self,
        price_feed_provider: AccountId,
    ) -> Result<(), LendingPoolError>;

    #[ink(message)]
    fn set_flash_loan_fee_e6(
        &mut self,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError>;

    #[ink(message)]
    fn set_block_timestamp_provider(
        &mut self,
        provider_address: AccountId,
    ) -> Result<(), LendingPoolError>;

    /// Registers new asset in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `decimals` - a decimal denominator of an asset (number already multiplied by 10^N where N is number of decimals)
    ///  * `collateral_coefficient_e6' - asset's collateral power. 1 = 10^6. If None asset can NOT be a collateral.
    ///  * `borrow_coefficient_e6' - asset's borrow power. 1 = 10^6. If None asset can NOT be borrowed.
    ///  * `penalty_e6 - penalty taken when taking part inliquidation as collateral or debt. 10^6 = 100%`.
    ///  * `maximal_total_deposit` - maximal allowed total deposit, If exceeded no more deposits are accepted. None for uncapped total deposit.
    ///  * `maximal_total_debt` - maximal allowed total debt, If exceeded no more borrows are accepted. None for uncapped total debt.
    ///  * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    ///  * `minimal_debt` - the minimal possible debt that can be taken by user.
    ///  * `interest_rate_model` - targetted debt rates at utilization of 50%, 60%, 70%, 80%, 90%, 95% 100%
    ///  * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///  * `a_token_address` - `AccountId` of the asset's already deployed `AToken`
    ///  * `v_token_address` - `AccountId` of the asset's already deployed `VToken`
    #[ink(message)]
    fn register_asset(
        &mut self,
        asset: AccountId,
        a_token_code_hash: [u8; 32],
        v_token_code_hash: [u8; 32],
        name: String,
        symbol: String,
        decimals: u8,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        penalty_e6: Option<u128>,
        maximal_total_deposit: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        income_for_suppliers_part_e6: u128,
        interest_rate_model: [u128; 7],
    ) -> Result<(), LendingPoolError>;

    /// Registers new asset in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `decimals` - a decimal denominator of an asset (number already multiplied by 10^N where N is number of decimals)
    ///  * `collateral_coefficient_e6' - asset's collateral power. 1 = 10^6. If None asset can NOT be a collateral.
    ///  * `borrow_coefficient_e6' - asset's borrow power. 1 = 10^6. If None asset can NOT be borrowed.
    ///  * `penalty_e6 - penalty taken when taking part inliquidation as collateral or debt. 10^6 = 100%`.
    ///  * `maximal_total_deposit` - maximal allowed total deposit, If exceeded no more deposits are accepted. None for uncapped total deposit.
    ///  * `maximal_total_debt` - maximal allowed total debt, If exceeded no more borrows are accepted. None for uncapped total debt.
    ///  * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    ///  * `minimal_debt` - the minimal possible debt that can be taken by user.
    ///  * `a_token_address` - `AccountId` of the asset's already deployed `AToken`
    ///  * `v_token_address` - `AccountId` of the asset's already deployed `VToken`
    #[ink(message)]
    fn register_stablecoin(
        &mut self,
        asset: AccountId,
        a_token_code_hash: [u8; 32],
        v_token_code_hash: [u8; 32],
        name: String,
        symbol: String,
        decimals: u8,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        penalty_e6: Option<u128>,
        maximal_total_deposit: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
    ) -> Result<(), LendingPoolError>;

    ///  activates or disactivates reserv
    ///
    ///  * `active` - true if reserve should be activated. flase if reserve should be disactivated. When disactivated all actions on the reserve are disabled.
    #[ink(message)]
    fn set_reserve_is_active(
        &mut self,
        asset: AccountId,
        active: bool,
    ) -> Result<(), LendingPoolError>;

    ///  freezes or unfreezes reserv
    ///
    ///  * `freeze` - true if reserve should be freezed. flase if reserve should be unffreeze. When freezed depositing and borrowing are disabled.
    #[ink(message)]
    fn set_reserve_is_freezed(
        &mut self,
        asset: AccountId,
        freeze: bool,
    ) -> Result<(), LendingPoolError>;

    /// modifies ReserveParameters in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `interest_rate_model` - targetted debt rates at utilization of 50%, 60%, 70%, 80%, 90%, 95% 100%
    ///  * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    #[ink(message)]
    fn set_reserve_parameters(
        &mut self,
        asset: AccountId,
        interest_rate_model: [u128; 7],
        income_for_suppliers_part_e6: u128,
    ) -> Result<(), LendingPoolError>;

    /// modifies ReserveRestricion in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `maximal_total_deposit` - maximal allowed total deposit, If exceeded no more deposits are accepted. None for uncapped total deposit.
    ///  * `maximal_total_debt` - maximal allowed total debt, If exceeded no more borrows are accepted. None for uncapped total debt.
    ///  * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    ///  * `minimal_debt` - the minimal possible debt that can be taken by user.
    #[ink(message)]
    fn set_reserve_restrictions(
        &mut self,
        asset: AccountId,
        maximal_total_deposit: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
    ) -> Result<(), LendingPoolError>;

    /// modifies the stablecoin debt rate
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `debt_rate_e24` - new debt rate
    #[ink(message)]
    fn set_stablecoin_debt_rate_e24(
        &mut self,
        asset: AccountId,
        debt_rate_e24: u128,
    ) -> Result<(), LendingPoolError>;

    /// adds new market rule at unused market_rule_id
    ///
    /// * `market_rule` - list of asset rules for that market rule
    #[ink(message)]
    fn add_market_rule(
        &mut self,
        market_rule: MarketRule,
    ) -> Result<(), LendingPoolError>;

    /// modifies asset_rules of a given asset in the market rule identified by market_rule_id
    ///
    /// * `market_rule_id` - id of market rule which shuuld be modified
    /// * `asset` - `AccountId` of a asset which rules should be modified
    ///  * `collateral_coefficient_e6' - asset's collateral power. 1 = 10^6. If None asset can NOT be a collateral.
    ///  * `borrow_coefficient_e6' - asset's borrow power. 1 = 10^6. If None asset can NOT be borrowed.
    ///  * `penalty_e6 - penalty taken when taking part inliquidation as collateral or debt. 10^6 = 100%`.
    #[ink(message)]
    fn modify_asset_rule(
        &mut self,
        market_rule_id: RuleId,
        asset: AccountId,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        penalty_e6: Option<u128>,
    ) -> Result<(), LendingPoolError>;

    /// collects income generated by the protocol
    #[ink(message)]
    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError>;
}