use pendzl::traits::{AccountId, Balance};

use crate::{
    impls::lending_pool::storage::lending_pool_storage::{MarketRule, RuleId},
    traits::lending_pool::errors::LendingPoolError,
};

use ink::prelude::vec::Vec;

// #[pendzl::wrapper]
// pub type LendingPoolManageRef = dyn LendingPoolManage;

#[ink::trait_definition]
pub trait LendingPoolManage {
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
    ///  * `maximal_total_supply` - maximal allowed total supply, If exceeded no more deposits are accepted. None for uncapped total supply.
    ///  * `maximal_total_debt` - maximal allowed total debt, If exceeded no more borrows are accepted. None for uncapped total debt.
    ///  * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    ///  * `minimal_debt` - the minimal possible debt that can be taken by user.
    ///  * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///  * `flash_loan_fee_e6` - fee (percentage) to charge for taking a flash loan for this asset - in E6 notation (multiplied by 10^6)
    ///  * `a_token_address` - `AccountId` of the asset's already deployed `AToken`
    ///  * `v_token_address` - `AccountId` of the asset's already deployed `VToken`
    #[ink(message)]
    fn register_asset(
        &mut self,
        asset: AccountId,
        decimals: u128,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        penalty_e6: Option<u128>,
        maximal_total_supply: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
        interest_rate_model: [u128; 7],
        a_token_address: AccountId,
        v_token_address: AccountId,
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
    ///  * `freeze` - true if reserve should be freezed. flase if reserve should be unffreeze. When freezed supplying and borrowing are disabled.
    #[ink(message)]
    fn set_reserve_is_freezed(
        &mut self,
        asset: AccountId,
        freeze: bool,
    ) -> Result<(), LendingPoolError>;

    /// modifies reserve in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `maximal_total_supply` - maximal allowed total supply, If exceeded no more deposits are accepted. None for uncapped total supply.
    ///  * `maximal_total_debt` - maximal allowed total debt, If exceeded no more borrows are accepted. None for uncapped total debt.
    ///  * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    ///  * `minimal_debt` - the minimal possible debt that can be taken by user.
    ///  * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///  * `flash_loan_fee_e6` - fee (percentage) to charge for taking a flash loan for this asset - in E6 notation (multiplied by 10^6)
    #[ink(message)]
    fn set_reserve_parameters(
        &mut self,
        asset: AccountId,
        interest_rate_model: [u128; 7],
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError>;

    #[ink(message)]
    fn set_reserve_restrictions(
        &mut self,
        asset: AccountId,
        maximal_total_supply: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
    ) -> Result<(), LendingPoolError>;

    /// adds new market rule at unused market_rule_id
    ///
    /// * `market_rule_id` - yet unused id for new market rule
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

    #[ink(message)]
    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError>;
}
