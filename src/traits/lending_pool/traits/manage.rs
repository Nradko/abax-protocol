use openbrush::traits::{
    AccountId,
    Balance,
};

use crate::traits::lending_pool::errors::LendingPoolError;

use ink::prelude::vec::Vec;

#[openbrush::wrapper]
pub type LendingPoolManageRef = dyn LendingPoolManage;

#[openbrush::trait_definition]
pub trait LendingPoolManage {
    #[ink(message)]
    fn set_block_timestamp_provider(&mut self, provider_address: AccountId) -> Result<(), LendingPoolError>;

    /// Registers new asset in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `decimals` - a decimal denominator of an asset (number already multiplied by 10^N where N is number of decimals)
    ///  * `collateral_coefficient_e6' - asset's collateral power. 1 = 10^6. If None asset can NOT be a collateral.
    ///  * `borrow_coefficient_e6' - asset's borrow power. 1 = 10^6. If None asset can NOT be borrowed.
    ///  * `stable_rate_base_e24` - stable base rate per milisecond in E24 notation. 10^24 = 100% Milisecond Percentage Rate. If None asset con not be stable borrowed.
    ///  * `penalty_e6 - penelty taken when taking part inliquidation as collateral or debt. 10^6 = 100%`.
    ///  * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///  * `flash_loan_fee_e6` - fee (percentage) to charge for taking a flash loan for this asset - in E6 notation (multiplied by 10^6)
    ///  * `a_token_address` - `AccountId` of the asset's already deployed `AToken`
    ///  * `v_token_address` - `AccountId` of the asset's already deployed `VToken`
    ///  * `s_token_address` - `AccountId` of the asset's already deployed `SToken`
    #[ink(message)]
    fn register_asset(
        &mut self,
        asset: AccountId,
        decimals: u128,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        stable_rate_base_e24: Option<u128>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        penalty_e6: u128,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
        a_token_address: AccountId,
        v_token_address: AccountId,
        s_token_address: AccountId,
    ) -> Result<(), LendingPoolError>;

    ///  activates or disactivates reserv
    ///
    ///  * `active` - true if reserve should be activated. flase if reserve should be disactivated. When disactivated all actions on the reserve are disabled.
    #[ink(message)]
    fn set_reserve_is_active(&mut self, asset: AccountId, active: bool) -> Result<(), LendingPoolError>;

    ///  freezes or unfreezes reserv
    ///
    ///  * `freeze` - true if reserve should be freezed. flase if reserve should be unffreeze. When freezed supplying and borrowing are disabled.
    #[ink(message)]
    fn set_reserve_is_freezed(&mut self, asset: AccountId, freeze: bool) -> Result<(), LendingPoolError>;

    /// modifies reserve in the `LendingPool`'s storage
    ///
    ///  * `asset` - `AccountId` of the registered asset
    ///  * `collateral_coefficient_e6' - asset's collateral power. 1 = 10^6. If None asset can NOT be a collateral.
    ///  * `borrow_coefficient_e6' - asset's borrow power. 1 = 10^6. If None asset can NOT be borrowed.
    ///  * `stable_rate_base_e24` - stable base rate per milisecond in E24 notation. 10^24 = 100% Milisecond Percentage Rate. If None asset con not be stable borrowed.
    ///  * `penalty_e6 - penelty taken when taking part inliquidation as collateral or debt. 10^6 = 100%`.
    ///  * `income_for_suppliers_part_e6` - indicates which part of an income should suppliers be paid - in E6 notation (multiplied by 10^6)
    ///  * `flash_loan_fee_e6` - fee (percentage) to charge for taking a flash loan for this asset - in E6 notation (multiplied by 10^6)
    #[ink(message)]
    fn set_reserve_parameters(
        &mut self,
        asset: AccountId,
        interest_rate_model: [u128; 7],
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        stable_rate_base_e24: Option<u128>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        penalty_e6: u128,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError>;

    #[ink(message)]
    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError>;
}
