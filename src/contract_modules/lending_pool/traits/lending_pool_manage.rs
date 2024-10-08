// SPDX-License-Identifier: BUSL-1.1
use abax_library::structs::{
    AssetRules, InterestRateModelParams, ReserveRestrictions,
};
use ink::{
    contract_ref, env::DefaultEnvironment, prelude::string::String,
    prelude::vec::Vec, primitives::AccountId,
};
use pendzl::traits::Balance;

use crate::lending_pool::{LendingPoolError, MarketRule, RuleId};
pub type LendingPoolManageRef =
    contract_ref!(LendingPoolManage, DefaultEnvironment);

#[derive(Debug, Default, scale::Encode, scale::Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct SetReserveFeesArgs {
    /// fee is used to accumulate accounts debt interest. The real rate is the current_borrow_rate * (1+fee). 10^6 =100%
    pub debt_fee_e6: u32,
    /// fee is used to accumulate accounts deposit interest. The real rate is the current_deposit_rate * (1-fee). 10^6 =100%
    pub deposit_fee_e6: u32,
}

/// Trait containing `AccessControl` messages used to manage 'LendingPool' parameters. Used by **managers**.
#[ink::trait_definition]
pub trait LendingPoolManage {
    /// Sets `price_feed_provider` - a contract that implements PriceFeed and will be used to get prices from.
    ///
    /// * `price_feed_provider` AccountId (a.k.a. address) of a contract.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a PARAMETERS_ADMIN.
    #[ink(message)]
    fn set_price_feed_provider(
        &mut self,
        price_feed_provider: AccountId,
    ) -> Result<(), LendingPoolError>;

    /// Sets `fee_reduction_provider` - a contract that implements FeeReduction and will be used to get fee reductions for given account.
    ///
    /// * `fee_reduction_provider` AccountId (a.k.a. address) of a contract.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a PARAMETERS_ADMIN.
    #[ink(message)]
    fn set_fee_reduction_provider(
        &mut self,
        fee_reduction_provider: AccountId,
    ) -> Result<(), LendingPoolError>;

    /// Sets a `flash_loan_fee_e6`
    ///
    /// * `flash_loan_fee_e6` fee to set 1_000_000 = 100% fee.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a PARAMETERS_ADMIN.
    #[ink(message)]
    fn set_flash_loan_fee_e6(
        &mut self,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError>;

    /// Registers new asset in the `LendingPool`'s storage and instaniates 'AToken' and 'VToken' for the reserve.
    ///
    /// * `asset` - `AccountId` of the registered asset
    /// * `a_token_code_hash` - code hash that will be used to initialize `AToken`
    /// * `v_token_code_hash` - code hash that will be used to initialize `vToken`
    /// * `name` - name of the `asset`. It will be used to create names for `AToken` and `VToken`.     
    /// * `symbol` - symbol of the `asset`. It will be used to create sumbol for `AToken` and `VToken`.     
    /// * `decimals` - a decimal denominator of an asset (number already multiplied by 10^N where N is number of decimals)
    /// * `asset_rules' - `asset`'s AssetRules that will be used in default market rule (id = 0).
    /// * `maximal_total_deposit` - maximal allowed total deposit. None for uncapped.
    /// * `maximal_total_debt` - maximal allowed total debt. None for uncapped.
    /// * `minimal_collateral` - the required minimal deposit of the asset by account to turn asset to be collateral.
    /// * `minimal_debt` - the minimal possible debt that can be taken by account.
    /// * `interest_rate_model` - check InterestRateModelParams
    /// * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a ASSET_LISTING_ADMIN.
    /// * `AlreadyRegistered` returned if asset was already registered.
    /// * `InvalidAssetRule` returned if asset rule is invalid.
    #[ink(message)]
    #[allow(clippy::too_many_arguments)]
    fn register_asset(
        &mut self,
        asset: AccountId,
        a_token_code_hash: [u8; 32],
        v_token_code_hash: [u8; 32],
        name: String,
        symbol: String,
        decimals: u8,
        asset_rules: AssetRules,
        reserve_restrictions: ReserveRestrictions,
        fees: SetReserveFeesArgs,
        interest_rate_model_params: Option<InterestRateModelParams>,
    ) -> Result<(), LendingPoolError>;

    ///  activates or disactivates reserve
    ///
    ///  * `active` - true if reserve should be activated. False if reserve should be disactivated.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a EMERGENCY_ADMIN.
    /// * `AlreadySet` returned if trying to set already set state.
    #[ink(message)]
    fn set_reserve_is_active(
        &mut self,
        asset: AccountId,
        active: bool,
    ) -> Result<(), LendingPoolError>;

    ///  Freezes or unfreezes reserve
    ///
    ///  * `freeze` - true if reserve should be frozen. False if reserve should be unfrozen.
    ///
    /// # Errorsfrozenfrozen
    /// * `AccessControl::MisingRole` returned if the caller is not a EMERGENCY_ADMIN.
    /// * `AlreadySet` returned if trying to set already set state.
    #[ink(message)]
    fn set_reserve_is_frozen(
        &mut self,
        asset: AccountId,
        freeze: bool,
    ) -> Result<(), LendingPoolError>;

    /// modifies ReserveParameters in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `interest_rate_model` - targetted debt rates at utilization of 50%, 60%, 70%, 80%, 90%, 95% 100%
    ///  * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a PARAMETERS_ADMIN.
    #[ink(message)]
    fn set_interest_rate_model(
        &mut self,
        asset: AccountId,
        interest_rate_model: InterestRateModelParams,
    ) -> Result<(), LendingPoolError>;

    #[ink(message)]
    fn set_reserve_fees(
        &mut self,
        asset: AccountId,
        reserve_fees: SetReserveFeesArgs,
    ) -> Result<(), LendingPoolError>;

    /// modifies ReserveRestricion in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `maximal_total_deposit` - maximal allowed total deposit, If exceeded no more deposits are accepted. None for uncapped total deposit.
    ///  * `maximal_total_debt` - maximal allowed total debt, If exceeded no more borrows are accepted. None for uncapped total debt.
    ///  * `minimal_collateral` - the required minimal deposit of the asset by account to turn asset to be collateral.
    ///  * `minimal_debt` - the minimal possible debt that can be taken by account.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a PARAMETERS_ADMIN.
    #[ink(message)]
    fn set_reserve_restrictions(
        &mut self,
        asset: AccountId,
        reserve_restrictions: ReserveRestrictions,
    ) -> Result<(), LendingPoolError>;

    /// modifies the stablecoin debt rate
    ///
    ///  * `asset` - `AccountId` of the registered stable asset
    ///  * `debt_rate_e18` - new debt rate
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a STABLECOIN_RATE_ADMIN.
    /// * `AssetIsNotProtocolStablecoin` returned if `asset` is not abax native stablecoin.
    #[ink(message)]
    fn set_stablecoin_debt_rate_e18(
        &mut self,
        asset: AccountId,
        debt_rate_e18: u64,
    ) -> Result<(), LendingPoolError>;

    /// adds new market rule at next martket rule id
    ///
    /// * `market_rule` - list of asset rules for that market rule
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a STABLECOIN_RATE_ADMIN.
    /// * `InvalidAssetRule` returned if the `market_rule` contains invalid AssetRule.
    #[ink(message)]
    fn add_market_rule(
        &mut self,
        market_rule: MarketRule,
    ) -> Result<(), LendingPoolError>;

    /// modifies asset_rules of a given asset in the market rule identified by market_rule_id
    ///
    /// * `market_rule_id` - id of market rule which shuuld be modified
    /// * `asset` - `AccountId` of a asset which rules should be modified
    /// * `asset_rules' - `asset`'s AssetRules that will be used in  market rule with `market_rule_id`.
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a STABLECOIN_RATE_ADMIN.
    /// * `InvalidAssetRule` returned if the asset_rules is invalid.
    #[ink(message)]
    fn modify_asset_rule(
        &mut self,
        market_rule_id: RuleId,
        asset: AccountId,
        asset_rules: AssetRules,
    ) -> Result<(), LendingPoolError>;

    /// collects income generated by the protocol
    ///
    /// * `assets` - vector of assets that income should be taken. If None takes income from all registered assets.
    /// * `to` - account which will receive income.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a TREASURY.
    #[ink(message)]
    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, Balance)>, LendingPoolError>;
}
