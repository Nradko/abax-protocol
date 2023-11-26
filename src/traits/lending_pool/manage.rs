pub type LendingPoolManageRef =
    contract_ref!(LendingPoolManage, DefaultEnvironment);

/// Trait containing `AccessControl` messages used to manage 'LendingPool' parameters. USed by **managers**.
#[ink::trait_definition]
pub trait LendingPoolManage {
    /// Sets a `price_feed_provider` - a contract that implements PriceFeed and will be used to get prices from.
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
    /// * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    /// * `minimal_debt` - the minimal possible debt that can be taken by user.
    /// * `interest_rate_model` - targetted debt rates at utilization of 68%, 84%, 92%, 96%, 98%, 99% 100%
    /// * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a ASSET_LISTING_ADMIN.
    /// * `AlreadyRegistered` returned if asset was already registered.
    /// * `InvalidAssetRule` returned if asset rule is invalid.
    #[ink(message)]
    fn register_asset(
        &mut self,
        asset: AccountId,
        a_token_code_hash: [u8; 32],
        v_token_code_hash: [u8; 32],
        name: String,
        symbol: String,
        decimals: u8,
        asset_rules: AssetRules,
        maximal_total_deposit: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        income_for_suppliers_part_e6: u128,
        interest_rate_model: InterestRateModel,
    ) -> Result<(), LendingPoolError>;

    /// Registers new Abax native Stable asset in the `LendingPool`'s storage and instaniates 'AToken' and 'VToken' for the reserve.
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
    /// * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    /// * `minimal_debt` - the minimal possible debt that can be taken by user.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a ASSET_LISTING_ADMIN.
    /// * `AlreadyRegistered` returned if asset was already registered.
    /// * `InvalidAssetRule` returned if asset rule is invalid.
    #[ink(message)]
    fn register_stablecoin(
        &mut self,
        asset: AccountId,
        a_token_code_hash: [u8; 32],
        v_token_code_hash: [u8; 32],
        name: String,
        symbol: String,
        decimals: u8,
        asset_rules: AssetRules,
        maximal_total_deposit: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
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
    ///  * `freeze` - true if reserve should be freezed. False if reserve should be unfreezed.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a EMERGENCY_ADMIN.
    /// * `AlreadySet` returned if trying to set already set state.
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
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a PARAMETERS_ADMIN.
    #[ink(message)]
    fn set_reserve_parameters(
        &mut self,
        asset: AccountId,
        interest_rate_model: InterestRateModel,
        income_for_suppliers_part_e6: u128,
    ) -> Result<(), LendingPoolError>;

    /// modifies ReserveRestricion in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `maximal_total_deposit` - maximal allowed total deposit, If exceeded no more deposits are accepted. None for uncapped total deposit.
    ///  * `maximal_total_debt` - maximal allowed total debt, If exceeded no more borrows are accepted. None for uncapped total debt.
    ///  * `minimal_collateral` - the required minimal deposit of the asset by user to turn asset to be collateral.
    ///  * `minimal_debt` - the minimal possible debt that can be taken by user.
    ///
    /// # Errors
    /// * `AccessControl::MisingRole` returned if the caller is not a PARAMETERS_ADMIN.
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
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError>;
}
