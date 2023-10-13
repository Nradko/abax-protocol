use crate::{
    impls::lending_pool::{
        internal::InternalIncome,
        storage::{
            lending_pool_storage::LendingPoolStorage,
            structs::reserve_data::ReserveData,
        },
    },
    traits::{
        dummy::DummyRef,
        lending_pool::{errors::LendingPoolError, events::*},
    },
};
use ink::{
    env::call::ExecutionInput,
    prelude::{vec, vec::Vec},
    primitives::{AccountId, Hash},
    ToAccountId,
};
use pendzl::contracts::psp22::PSP22;
use pendzl::{
    contracts::{access_control::*, psp22::PSP22Ref},
    traits::{Balance, Storage},
};

use super::{
    internal::TimestampMock,
    storage::{
        lending_pool_storage::MarketRule,
        structs::{
            asset_rules::AssetRules,
            reserve_data::{
                ReserveAbacusTokens, ReserveParameters, ReservePrice,
                ReserveRestrictions,
            },
        },
    },
};

/// pays only 10% of standard flash loan fee
pub const FLASH_BORROWER: RoleType = ink::selector_id!("FLASH_BORROWER"); // 1_112_475_474_u32
/// can add new asset to the market
pub const ASSET_LISTING_ADMIN: RoleType =
    ink::selector_id!("ASSET_LISTING_ADMIN"); // 1_094_072_439_u32
/// can modify reserveData parameters
pub const PARAMETERS_ADMIN: RoleType = ink::selector_id!("PARAMETERS_ADMIN"); // 368_001_360_u32

/// can modify current debt rate in ReserveData of asset that is protocol stablecoin
pub const STABLECOIN_RATE_ADMIN: RoleType =
    ink::selector_id!("STABLECOIN_RATE_ADMIN"); // 2_742_621_032
/// can pause/unpause freeze/unfreeze reserves
pub const EMERGENCY_ADMIN: RoleType = ink::selector_id!("EMERGENCY_ADMIN"); // 297_099_943_u32
/// can do what ASSET_LISTING_ADMIN, PARAMETERS_ADMIN and EMERGANCY_ADMIN can do
pub const GLOBAL_ADMIN: RoleType = ink::selector_id!("GLOBAL_ADMIN"); // 2_459_877_095_u32
/// can assign all the roles
pub const ROLE_ADMIN: RoleType = 0; // 0
/// can withdraw protocol income
pub const TREASURY: RoleType = ink::selector_id!("TREASURY"); // 2_434_241_257_u32

pub trait LendingPoolManageImpl:
    ManageInternal
    + Storage<LendingPoolStorage>
    + Storage<access_control::Data>
    + InternalIncome
    + EmitManageEvents
    + access_control::Internal
    + access_control::MembersManager
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

    fn set_flash_loan_fee_e6(
        &mut self,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(PARAMETERS_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }
        self.data::<LendingPoolStorage>()
            .flash_loan_fee_e6
            .set(&flash_loan_fee_e6);
        self._emit_flash_loan_fee_e6_changed(&flash_loan_fee_e6);
        Ok(())
    }

    fn register_asset(
        &mut self,
        asset: AccountId,
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
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();

        if !self._has_role(ASSET_LISTING_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }

        let timestamp = self._timestamp();

        let (a_token_address, v_token_address) = (
            self._instantiate_a_token_contract(
                &asset,
                name.clone(),
                symbol.clone(),
                decimals,
            ),
            self._instantiate_v_token_contract(
                &asset,
                name.clone(),
                symbol.clone(),
                decimals,
            ),
        );

        self.data::<LendingPoolStorage>()
            .account_for_register_asset(
                &asset,
                &ReserveData::new(&timestamp),
                &ReserveParameters {
                    interest_rate_model,
                    income_for_suppliers_part_e6,
                },
                &ReserveRestrictions::new(
                    &maximal_total_deposit,
                    &maximal_total_debt,
                    &minimal_collateral,
                    &minimal_debt,
                ),
                &ReservePrice::new(&(10_u128.pow(decimals.into()))),
                &ReserveAbacusTokens::new(&a_token_address, &v_token_address),
            )?;

        self.data::<LendingPoolStorage>()
            .account_for_asset_rule_change(
                &0,
                &asset,
                &AssetRules {
                    collateral_coefficient_e6,
                    borrow_coefficient_e6,
                    penalty_e6,
                },
            )?;

        self._emit_asset_registered_event(
            &asset,
            name,
            symbol,
            decimals,
            &a_token_address,
            &v_token_address,
        );
        self._emit_reserve_parameters_changed_event(
            &asset,
            &interest_rate_model,
            income_for_suppliers_part_e6,
        );
        self._emit_reserve_restrictions_changed_event(
            &asset,
            maximal_total_deposit,
            maximal_total_debt,
            minimal_collateral,
            minimal_debt,
        );
        self._emit_asset_rules_changed_event(
            &0,
            &asset,
            &collateral_coefficient_e6,
            &borrow_coefficient_e6,
            &penalty_e6,
        );
        Ok(())
    }

    fn register_stablecoin(
        &mut self,
        asset: AccountId,
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
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();

        if !self._has_role(ASSET_LISTING_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }

        let timestamp = self._timestamp();

        let (a_token_address, v_token_address) = (
            self._instantiate_a_token_contract(
                &asset,
                name.clone(),
                symbol.clone(),
                decimals,
            ),
            self._instantiate_v_token_contract(
                &asset,
                name.clone(),
                symbol.clone(),
                decimals,
            ),
        );

        self.data::<LendingPoolStorage>()
            .account_for_register_stablecoin(
                &asset,
                &ReserveData::new(&timestamp),
                &ReserveRestrictions::new(
                    &maximal_total_deposit,
                    &maximal_total_debt,
                    &minimal_collateral,
                    &minimal_debt,
                ),
                &ReservePrice::new(&(10_u128.pow(decimals.into()))),
                &ReserveAbacusTokens::new(&a_token_address, &v_token_address),
            )?;

        self.data::<LendingPoolStorage>()
            .account_for_asset_rule_change(
                &0,
                &asset,
                &AssetRules {
                    collateral_coefficient_e6,
                    borrow_coefficient_e6,
                    penalty_e6,
                },
            )?;

        self._emit_asset_registered_event(
            &asset,
            name,
            symbol,
            decimals,
            &a_token_address,
            &v_token_address,
        );
        self._emit_reserve_restrictions_changed_event(
            &asset,
            maximal_total_deposit,
            maximal_total_debt,
            minimal_collateral,
            minimal_debt,
        );
        self._emit_asset_rules_changed_event(
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
        if !self._has_role(EMERGENCY_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }
        self.data::<LendingPoolStorage>()
            .account_for_changing_activity(&asset, active)?;

        self._emit_reserve_activated_event(&asset, active);

        Ok(())
    }

    fn set_reserve_is_freezed(
        &mut self,
        asset: AccountId,
        freeze: bool,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(EMERGENCY_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }
        self.data::<LendingPoolStorage>()
            .account_for_changing_is_freezed(&asset, freeze)?;
        self._emit_reserve_freezed_event(&asset, freeze);
        Ok(())
    }

    fn set_reserve_restrictions(
        &mut self,
        asset: AccountId,
        maximal_total_deposit: Option<Balance>,
        maximal_total_debt: Option<Balance>,
        minimal_collateral: Balance,
        minimal_debt: Balance,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(PARAMETERS_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }
        self.data::<LendingPoolStorage>()
            .account_for_reserve_restricitions_change(
                &asset,
                &ReserveRestrictions {
                    maximal_total_deposit,
                    maximal_total_debt,
                    minimal_collateral,
                    minimal_debt,
                },
            )?;

        self._emit_reserve_restrictions_changed_event(
            &asset,
            maximal_total_deposit,
            maximal_total_debt,
            minimal_collateral,
            minimal_debt,
        );

        Ok(())
    }

    fn set_reserve_parameters(
        &mut self,
        asset: AccountId,
        interest_rate_model: [u128; 7],
        income_for_suppliers_part_e6: u128,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(PARAMETERS_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }
        let timestamp = self._timestamp();
        self.data::<LendingPoolStorage>()
            .account_for_reserve_data_parameters_change(
                &asset,
                &ReserveParameters {
                    interest_rate_model,
                    income_for_suppliers_part_e6,
                },
                &timestamp,
            )?;
        self._emit_reserve_parameters_changed_event(
            &asset,
            &interest_rate_model,
            income_for_suppliers_part_e6,
        );
        Ok(())
    }

    fn set_stablecoin_debt_rate_e24(
        &mut self,
        asset: AccountId,
        debt_rate_e24: u128,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(STABLECOIN_RATE_ADMIN, &Some(caller)) {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }

        self.data::<LendingPoolStorage>()
            .account_for_stablecoin_debt_rate_e24_change(
                &asset,
                &debt_rate_e24,
            )?;
        self._emit_stablecoin_debt_rate_changed(&asset, &debt_rate_e24);

        Ok(())
    }

    fn add_market_rule(
        &mut self,
        market_rule: MarketRule,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(PARAMETERS_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }

        let market_rule_id = self
            .data::<LendingPoolStorage>()
            .account_for_add_market_rule(&market_rule)?;

        let registerd_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();

        for asset_id in 0..market_rule.len() {
            match market_rule[asset_id] {
                Some(asset_rules) => {
                    self._emit_asset_rules_changed_event(
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

        Ok(())
    }

    fn modify_asset_rule(
        &mut self,
        market_rule_id: u32,
        asset: AccountId,
        collateral_coefficient_e6: Option<u128>,
        borrow_coefficient_e6: Option<u128>,
        penalty_e6: Option<u128>,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(PARAMETERS_ADMIN, &Some(caller))
            && !self._has_role(GLOBAL_ADMIN, &Some(caller))
        {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }

        self.data::<LendingPoolStorage>()
            .account_for_asset_rule_change(
                &market_rule_id,
                &asset,
                &AssetRules {
                    collateral_coefficient_e6,
                    borrow_coefficient_e6,
                    penalty_e6,
                },
            )?;

        self._emit_asset_rules_changed_event(
            &market_rule_id,
            &asset,
            &collateral_coefficient_e6,
            &borrow_coefficient_e6,
            &penalty_e6,
        );

        Ok(())
    }

    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError> {
        let caller = Self::env().caller();
        if !self._has_role(TREASURY, &Some(caller)) {
            return Err(LendingPoolError::from(
                AccessControlError::MissingRole,
            ));
        }
        let assets_and_amounts = match assets {
            Some(assets_vec) => self._get_protocol_income(&assets_vec)?,
            None => {
                let registered_assets = self
                    .data::<LendingPoolStorage>()
                    .get_all_registered_assets();
                self._get_protocol_income(&registered_assets)?
            }
        };

        for asset_and_amount in
            assets_and_amounts.iter().take_while(|x| x.1.is_positive())
        {
            let mut psp22: PSP22Ref = asset_and_amount.0.into();
            psp22.transfer(to, asset_and_amount.1 as Balance, vec![])?;
            self._emit_income_taken(&asset_and_amount.0);
        }

        Ok(assets_and_amounts)
    }
}

use pendzl::traits::String;

pub trait ManageInternal: Storage<LendingPoolStorage> {
    fn _instantiate_a_token_contract(
        &self,
        underlying_asset: &AccountId,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> AccountId {
        let a_token_code_hash = self
            .data::<LendingPoolStorage>()
            .a_token_code_hash
            .get()
            .unwrap();

        let lending_pool: AccountId = Self::env().account_id();

        self._instantiate_abacus_token(
            &a_token_code_hash,
            &lending_pool,
            underlying_asset,
            "Abax Deposit ".to_string() + &name,
            "a".to_string() + &symbol,
            decimals,
        )
    }

    fn _instantiate_v_token_contract(
        &self,
        underlying_asset: &AccountId,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> AccountId {
        let v_token_code_hash = self
            .data::<LendingPoolStorage>()
            .a_token_code_hash
            .get()
            .unwrap();

        let lending_pool: AccountId = Self::env().account_id();

        self._instantiate_abacus_token(
            &v_token_code_hash,
            &lending_pool,
            underlying_asset,
            "Abax Variable Debt ".to_string() + &name,
            "v".to_string() + &symbol,
            decimals,
        )
    }

    fn _instantiate_abacus_token(
        &self,
        abacus_token_code_hash: &[u8; 32],
        lending_pool: &AccountId,
        underlying_asset: &AccountId,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> AccountId {
        let create_params = ink::env::call::build_create::<DummyRef>()
            .code_hash(Hash::from(*abacus_token_code_hash))
            .gas_limit(1000000000000)
            .endowment(0)
            .exec_input(
                ExecutionInput::new(ink::env::call::Selector::new(
                    ink::selector_bytes!("new"),
                ))
                .push_arg(name)
                .push_arg(symbol)
                .push_arg(decimals)
                .push_arg(*lending_pool)
                .push_arg(*underlying_asset),
            )
            .salt_bytes(underlying_asset)
            .returns::<DummyRef>()
            .params();
        let contract = Self::env()
            .instantiate_contract(&create_params)
            .unwrap_or_else(|error| {
                panic!("Contract pallet error: {:?}", error)
            })
            .unwrap_or_else(|error| panic!("LangError: {:?}", error));
        contract.to_account_id()
    }
}
