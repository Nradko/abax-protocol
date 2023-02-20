#![allow(unused_variables)]
use crate::{
    impls::{
        constants::E18,
        lending_pool::{
            internal::InternalIncome,
            storage::{
                lending_pool_storage::LendingPoolStorage,
                structs::reserve_data::ReserveData,
            },
        },
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{
            errors::LendingPoolError,
            events::*,
            traits::manage::LendingPoolManage,
        },
    },
};
use ink::prelude::{
    vec,
    vec::Vec,
};
use openbrush::{
    contracts::{
        access_control::*,
        psp22::PSP22Ref,
    },
    modifiers,
    traits::{
        AccountId,
        Balance,
        Storage,
    },
};

/// pays only 10% of standard flash loan fee
pub const FLASH_BORROWER: RoleType = ink::selector_id!("FLASH_BORROWER"); // 1_112_475_474_u32
/// can add new asset to the market
pub const ASSET_LISTING_ADMIN: RoleType = ink::selector_id!("ASSET_LISTING_ADMIN"); // 1_094_072_439_u32
/// can modify reserveData parameters
pub const PARAMETERS_ADMIN: RoleType = ink::selector_id!("PARAMETERS_ADMIN"); // 368_001_360_u32
/// can pause/unpause freeze/unfreeze reserves
pub const EMERGENCY_ADMIN: RoleType = ink::selector_id!("EMERGENCY_ADMIN"); // 297_099_943_u32
/// can do what ASSET_LISTING_ADMIN, PARAMETERS_ADMIN and EMERGANCY_ADMIN can do
pub const GLOBAL_ADMIN: RoleType = ink::selector_id!("GLOBAL_ADMIN"); // 2_459_877_095_u32
/// can assign all the roles
pub const ROLE_ADMIN: RoleType = 0; // 0
/// can withdraw protocol income
pub const TREASURY: RoleType = ink::selector_id!("TREASURY"); // 2_434_241_257_u32

impl<T: Storage<LendingPoolStorage> + Storage<access_control::Data> + InternalIncome> LendingPoolManage for T {
    /// used for testing
    default fn set_block_timestamp_provider(&mut self, provider_address: AccountId) -> Result<(), LendingPoolError> {
        self.data::<LendingPoolStorage>().block_timestamp_provider = provider_address;
        Ok(())
    }

    default fn register_asset(
        &mut self,
        asset: AccountId,
        decimals: u128,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        stable_rate_base_e24: Option<u128>,
        penalty_e6: u128,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
        a_token_address: AccountId,
        v_token_address: AccountId,
        s_token_address: AccountId,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self
            .data::<access_control::Data>()
            .has_role(ASSET_LISTING_ADMIN, caller)
            || self.data::<access_control::Data>().has_role(GLOBAL_ADMIN, caller))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole))
        }

        let new_id = self.data::<LendingPoolStorage>().registered_asset_len();
        let reserve = ReserveData {
            id: new_id,
            activated: true,
            freezed: false,
            decimals,
            interest_rate_model: [
                300_000_000_000,
                500_000_000_000,
                2_000_000_000_000,
                4_000_000_000_000,
                10_000_000_000_000,
                100_000_000_000_000,
                300_000_000_000_000,
            ],
            collateral_coefficient_e6,
            borrow_coefficient_e6,
            penalty_e6,
            stable_rate_base_e24,
            income_for_suppliers_part_e6,
            flash_loan_fee_e6,
            token_price_e8: None,
            //
            total_supplied: 0,
            cumulative_supply_rate_index_e18: E18,
            current_supply_rate_e24: 0,
            total_variable_borrowed: 0,
            cumulative_variable_borrow_rate_index_e18: E18,
            current_variable_borrow_rate_e24: 0,
            sum_stable_debt: 0,
            accumulated_stable_borrow: 0,
            avarage_stable_rate_e24: 0,
            indexes_update_timestamp: BlockTimestampProviderRef::get_block_timestamp(
                &self.data::<LendingPoolStorage>().block_timestamp_provider,
            ),
            a_token_address,
            v_token_address,
            s_token_address,
        };

        self.data::<LendingPoolStorage>().register_asset(&asset);
        self.data::<LendingPoolStorage>().insert_reserve_data(&asset, &reserve);
        self._emit_asset_registered_event(asset);
        Ok(())
    }

    default fn set_reserve_is_active(&mut self, asset: AccountId, active: bool) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.data::<access_control::Data>().has_role(EMERGENCY_ADMIN, caller)
            || self.data::<access_control::Data>().has_role(GLOBAL_ADMIN, caller))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole))
        }

        let mut reserve = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        reserve.activated = active;
        self.data::<LendingPoolStorage>().insert_reserve_data(&asset, &reserve);
        Ok(())
    }

    default fn set_reserve_is_freezed(&mut self, asset: AccountId, freeze: bool) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.data::<access_control::Data>().has_role(EMERGENCY_ADMIN, caller)
            || self.data::<access_control::Data>().has_role(GLOBAL_ADMIN, caller))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole))
        }
        let mut reserve = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        reserve.freezed = freeze;
        self.data::<LendingPoolStorage>().insert_reserve_data(&asset, &reserve);
        Ok(())
    }

    default fn set_reserve_parameters(
        &mut self,
        asset: AccountId,
        interest_rate_model: [u128; 7],
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        stable_rate_base_e24: Option<u128>,
        penalty_e6: u128,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.data::<access_control::Data>().has_role(PARAMETERS_ADMIN, caller)
            || self.data::<access_control::Data>().has_role(GLOBAL_ADMIN, caller))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole))
        }

        let mut reserve = self.data::<LendingPoolStorage>().get_reserve_data(&asset)?;
        reserve.interest_rate_model = interest_rate_model;
        reserve.collateral_coefficient_e6 = collateral_coefficient_e6;
        reserve.borrow_coefficient_e6 = borrow_coefficient_e6;
        reserve.stable_rate_base_e24 = stable_rate_base_e24;
        reserve.penalty_e6 = penalty_e6;
        reserve.income_for_suppliers_part_e6 = income_for_suppliers_part_e6;
        reserve.flash_loan_fee_e6 = flash_loan_fee_e6;
        self.data::<LendingPoolStorage>().insert_reserve_data(&asset, &reserve);
        Ok(())
    }

    #[modifiers(only_role(TREASURY))]
    default fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError> {
        let assets_and_amounts = match assets {
            Some(assets_vec) => self._get_protocol_income(&assets_vec),
            None => {
                let registered_assets = self.data::<LendingPoolStorage>().get_all_registered_assets();
                self._get_protocol_income(&registered_assets)
            }
        };

        for asset_and_amount in assets_and_amounts.iter().take_while(|x| x.1.is_positive()) {
            PSP22Ref::transfer(&asset_and_amount.0, to, asset_and_amount.1 as Balance, vec![])?;
        }

        Ok(assets_and_amounts)
    }
}

impl<T: Storage<LendingPoolStorage>> EmitManageEvents for T {
    default fn _emit_asset_registered_event(&mut self, asset: AccountId) {}
}
