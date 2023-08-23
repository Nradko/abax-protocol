use crate::{
    impls::{
        constants::E18,
        lending_pool::{
            internal::InternalIncome,
            storage::{
                lending_pool_storage::LendingPoolStorage, structs::reserve_data::ReserveData,
            },
        },
    },
    traits::{
        block_timestamp_provider::BlockTimestampProviderRef,
        lending_pool::{errors::LendingPoolError, events::*},
    },
};
use ink::prelude::{vec, vec::Vec};
use openbrush::{
    contracts::{access_control::*, psp22::PSP22Ref},
    modifiers,
    traits::{AccountId, Balance, Storage},
};

use super::storage::{lending_pool_storage::MarketRule, structs::asset_rules::AssetRules};

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

pub trait LendingPoolManageImpl:
    Storage<LendingPoolStorage>
    + Storage<access_control::Data>
    + InternalIncome
    + EmitManageEvents
    + AccessControlImpl
{
    /// used for testing
    fn set_block_timestamp_provider(
        &mut self,
        provider_address: AccountId,
    ) -> Result<(), LendingPoolError> {
        self.data::<LendingPoolStorage>()
            .block_timestamp_provider
            .set(&provider_address);
        Ok(())
    }

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
        a_token_address: AccountId,
        v_token_address: AccountId,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.has_role(ASSET_LISTING_ADMIN, caller.into())
            || self.has_role(GLOBAL_ADMIN, caller.into()))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole));
        }

        let new_id = self.data::<LendingPoolStorage>().registered_asset_len();
        let reserve_data = ReserveData {
            id: new_id,
            activated: true,
            freezed: false,
            decimals,
            interest_rate_model: [
                0,
                50_000_000_000,
                100_000_000_000,
                320_000_000_000,
                1_000_000_000_000,
                5_075_000_000_000,
                40_600_000_000_000,
            ],
            maximal_total_supply,
            maximal_total_debt,
            minimal_collateral,
            minimal_debt,
            income_for_suppliers_part_e6,
            flash_loan_fee_e6,
            token_price_e8: None,
            //
            total_supplied: 0,
            cumulative_supply_rate_index_e18: E18,
            current_supply_rate_e24: 0,
            total_debt: 0,
            cumulative_debt_rate_index_e18: E18,
            current_debt_rate_e24: 0,
            indexes_update_timestamp: BlockTimestampProviderRef::get_block_timestamp(
                &self
                    .data::<LendingPoolStorage>()
                    .block_timestamp_provider
                    .get()
                    .unwrap(),
            ),
            a_token_address,
            v_token_address,
        };
        let mut market_rule = self
            .data::<LendingPoolStorage>()
            .get_market_rule(&0)
            .unwrap_or_default();

        market_rule.push(Some(AssetRules {
            collateral_coefficient_e6,
            borrow_coefficient_e6,
            penalty_e6,
        }));

        self.data::<LendingPoolStorage>().register_asset(&asset);
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve_data);
        self.data::<LendingPoolStorage>()
            .insert_market_rule(&0, &market_rule);
        self._emit_asset_registered_event(&asset, decimals, &a_token_address, &v_token_address);
        self._emit_reserve_parameters_changed_event(
            &asset,
            &[
                300_000_000_000,
                500_000_000_000,
                2_000_000_000_000,
                4_000_000_000_000,
                10_000_000_000_000,
                100_000_000_000_000,
                300_000_000_000_000,
            ],
            maximal_total_supply,
            maximal_total_debt,
            minimal_collateral,
            minimal_debt,
            income_for_suppliers_part_e6,
            flash_loan_fee_e6,
        );
        self._emit_asset_rules_changed(
            &0,
            &asset,
            &collateral_coefficient_e6,
            &borrow_coefficient_e6,
            &penalty_e6,
        );
        Ok(())
    }

    fn set_reserve_is_active(
        &mut self,
        asset: AccountId,
        active: bool,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.has_role(EMERGENCY_ADMIN, caller.into())
            || self.has_role(GLOBAL_ADMIN, caller.into()))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole));
        }

        let mut reserve = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        if reserve.activated != active {
            reserve.activated = active;
            self.data::<LendingPoolStorage>()
                .insert_reserve_data(&asset, &reserve);
            self._emit_reserve_activated_event(&asset, active);
        }
        Ok(())
    }

    fn set_reserve_is_freezed(
        &mut self,
        asset: AccountId,
        freeze: bool,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.has_role(EMERGENCY_ADMIN, caller.into())
            || self.has_role(GLOBAL_ADMIN, caller.into()))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole));
        }
        let mut reserve = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        if reserve.freezed != freeze {
            reserve.freezed = freeze;
            self.data::<LendingPoolStorage>()
                .insert_reserve_data(&asset, &reserve);
            self._emit_reserve_freezed_event(&asset, freeze);
        }
        Ok(())
    }

    fn set_reserve_parameters(
        &mut self,
        asset: AccountId,
        interest_rate_model: [u128; 7],
        maximal_total_supply: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
        income_for_suppliers_part_e6: u128,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.has_role(PARAMETERS_ADMIN, caller.into())
            || self.has_role(GLOBAL_ADMIN, caller.into()))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole));
        }

        let mut reserve = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;
        reserve.interest_rate_model = interest_rate_model;
        reserve.maximal_total_supply = maximal_total_supply;
        reserve.maximal_total_debt = maximal_total_debt;
        reserve.minimal_collateral = minimal_collateral;
        reserve.minimal_debt = minimal_debt;
        reserve.income_for_suppliers_part_e6 = income_for_suppliers_part_e6;
        reserve.flash_loan_fee_e6 = flash_loan_fee_e6;
        self.data::<LendingPoolStorage>()
            .insert_reserve_data(&asset, &reserve);
        self._emit_reserve_parameters_changed_event(
            &asset,
            &interest_rate_model,
            maximal_total_supply,
            maximal_total_debt,
            minimal_collateral,
            minimal_debt,
            income_for_suppliers_part_e6,
            flash_loan_fee_e6,
        );
        Ok(())
    }

    fn add_market_rule(
        &mut self,
        market_rule_id: u64,
        market_rule: MarketRule,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.has_role(PARAMETERS_ADMIN, caller.into())
            || self.has_role(GLOBAL_ADMIN, caller.into()))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole));
        }
        if self
            .data::<LendingPoolStorage>()
            .get_market_rule(&market_rule_id)
            .is_some()
        {
            return Err(LendingPoolError::MarketRuleInvalidId);
        }
        let registerd_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();

        for asset_id in 0..market_rule.len() {
            match market_rule[asset_id] {
                Some(asset_rules) => {
                    self._emit_asset_rules_changed(
                        &market_rule_id,
                        &registerd_assets[asset_id],
                        &asset_rules.collateral_coefficient_e6,
                        &asset_rules.borrow_coefficient_e6,
                        &asset_rules.penalty_e6,
                    );
                }
                None => (),
            }
        }
        self.data::<LendingPoolStorage>()
            .insert_market_rule(&market_rule_id, &market_rule);

        Ok(())
    }

    fn modify_asset_rule(
        &mut self,
        market_rule_id: u64,
        asset: AccountId,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        penalty_e6: Option<u128>,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !(self.has_role(PARAMETERS_ADMIN, caller.into())
            || self.has_role(GLOBAL_ADMIN, caller.into()))
        {
            return Err(LendingPoolError::from(AccessControlError::MissingRole));
        }
        let reserve_data = self
            .data::<LendingPoolStorage>()
            .get_reserve_data(&asset)
            .ok_or(LendingPoolError::AssetNotRegistered)?;

        let mut market_rule = self
            .data::<LendingPoolStorage>()
            .get_market_rule(&market_rule_id)
            .ok_or(LendingPoolError::MarketRuleInvalidId)?;

        let asset_id = reserve_data.id;

        while (market_rule.len() as u64) < (asset_id) {
            market_rule.push(None);
        }

        market_rule[asset_id as usize] = Some(AssetRules {
            collateral_coefficient_e6,
            borrow_coefficient_e6,
            penalty_e6,
        });

        self.data::<LendingPoolStorage>()
            .insert_market_rule(&market_rule_id, &market_rule);

        self._emit_asset_rules_changed(
            &market_rule_id,
            &asset,
            &collateral_coefficient_e6,
            &borrow_coefficient_e6,
            &penalty_e6,
        );

        Ok(())
    }

    #[modifiers(only_role(TREASURY))]
    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError> {
        let assets_and_amounts = match assets {
            Some(assets_vec) => self._get_protocol_income(&assets_vec),
            None => {
                let registered_assets = self
                    .data::<LendingPoolStorage>()
                    .get_all_registered_assets();
                self._get_protocol_income(&registered_assets)
            }
        };

        for asset_and_amount in assets_and_amounts.iter().take_while(|x| x.1.is_positive()) {
            PSP22Ref::transfer(
                &asset_and_amount.0,
                to,
                asset_and_amount.1 as Balance,
                vec![],
            )?;
            self._emit_income_taken(&asset_and_amount.0);
        }

        Ok(assets_and_amounts)
    }
}
