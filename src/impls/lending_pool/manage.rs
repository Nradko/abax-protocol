use abax_library::structs::{
    AssetRules, ReserveAbacusTokens, ReserveData, ReserveFees,
    ReserveRestrictions,
};
use abax_traits::dummy::DummyRef;
use abax_traits::lending_pool::{
    EmitManageEvents, InterestRateModel, LendingPoolError, MarketRule,
    ASSET_LISTING_ADMIN, EMERGENCY_ADMIN, PARAMETERS_ADMIN,
    STABLECOIN_RATE_ADMIN, TREASURY,
};
use ink::prelude::string::{String, ToString};
use ink::{
    env::call::ExecutionInput,
    prelude::{vec, vec::Vec},
    primitives::{AccountId, Hash},
    ToAccountId,
};
use pendzl::contracts::access::access_control;
use pendzl::contracts::token::psp22::{PSP22Ref, PSP22};
use pendzl::traits::{Balance, StorageFieldGetter};

use super::internal::InternalIncome;
use super::storage::LendingPoolStorage;

pub trait LendingPoolManageImpl:
    ManageInternal + EmitManageEvents + access_control::AccessControlInternal
{
    fn set_price_feed_provider(
        &mut self,
        price_feed_provider: AccountId,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_price_feed_provider_change(&price_feed_provider);
        self._emit_price_feed_provider_changed_event(&price_feed_provider);
        Ok(())
    }

    fn set_flash_loan_fee_e6(
        &mut self,
        flash_loan_fee_e6: u128,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .flash_loan_fee_e6
            .set(&flash_loan_fee_e6);
        self._emit_flash_loan_fee_e6_changed_event(&flash_loan_fee_e6);
        Ok(())
    }

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
        reserve_fees: ReserveFees,
        interest_rate_model: Option<InterestRateModel>,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(ASSET_LISTING_ADMIN, Some(caller))?;

        let timestamp = Self::env().block_timestamp();

        self.data::<LendingPoolStorage>()
            .account_for_register_asset(
                &asset,
                &ReserveData::default(),
                &reserve_restrictions,
                &10_u128.pow(decimals.into()),
                &reserve_fees,
                &interest_rate_model,
                &timestamp,
            )?;

        let (a_token_address, v_token_address) = (
            self._instantiate_a_token_contract(
                &a_token_code_hash,
                &asset,
                name.clone(),
                symbol.clone(),
                decimals,
            ),
            self._instantiate_v_token_contract(
                &v_token_code_hash,
                &asset,
                name.clone(),
                symbol.clone(),
                decimals,
            ),
        );

        self.data::<LendingPoolStorage>()
            .account_for_set_abacus_tokens(
                &asset,
                &ReserveAbacusTokens::new(&a_token_address, &v_token_address),
            )?;

        self.data::<LendingPoolStorage>()
            .account_for_asset_rule_change(&0, &asset, &asset_rules)?;

        self._emit_asset_registered_event(
            &asset,
            name,
            symbol,
            decimals,
            &a_token_code_hash,
            &v_token_code_hash,
            &a_token_address,
            &v_token_address,
        );

        interest_rate_model.and_then(|model| {
            self._emit_interest_rate_model_changed_event(&asset, &model);
            Some(model)
        });

        self._emit_reserve_restrictions_changed_event(
            &asset,
            reserve_restrictions,
        );
        self._emit_asset_rules_changed_event(&0, &asset, &asset_rules);
        self._emit_reserve_fees_changed_event(&asset, &reserve_fees);
        Ok(())
    }

    fn set_reserve_is_active(
        &mut self,
        asset: AccountId,
        active: bool,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(EMERGENCY_ADMIN, Some(caller))?;

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
        self._ensure_has_role(EMERGENCY_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_changing_is_freezed(&asset, freeze)?;
        self._emit_reserve_freezed_event(&asset, freeze);
        Ok(())
    }

    fn set_reserve_restrictions(
        &mut self,
        asset: AccountId,
        reserve_restrictions: ReserveRestrictions,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_reserve_restricitions_change(
                &asset,
                &reserve_restrictions,
            )?;

        self._emit_reserve_restrictions_changed_event(
            &asset,
            reserve_restrictions,
        );

        Ok(())
    }

    fn set_interest_rate_model(
        &mut self,
        asset: AccountId,
        interest_rate_model: InterestRateModel,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        let timestamp = Self::env().block_timestamp();
        self.data::<LendingPoolStorage>()
            .account_for_interest_rate_model_change(
                &asset,
                &interest_rate_model,
                &timestamp,
            )?;
        self._emit_interest_rate_model_changed_event(
            &asset,
            &interest_rate_model,
        );
        Ok(())
    }

    fn set_reserve_fees(
        &mut self,
        asset: AccountId,
        reserve_fees: ReserveFees,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_reserve_fees_change(&asset, &reserve_fees)?;
        self._emit_reserve_fees_changed_event(&asset, &reserve_fees);
        Ok(())
    }

    fn set_stablecoin_debt_rate_e18(
        &mut self,
        asset: AccountId,
        debt_rate_e18: u64,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(STABLECOIN_RATE_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_stablecoin_debt_rate_e18_change(
                &asset,
                &debt_rate_e18,
            )?;
        self._emit_stablecoin_debt_rate_changed(&asset, &debt_rate_e18);

        Ok(())
    }

    fn add_market_rule(
        &mut self,
        market_rule: MarketRule,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        for asset_rule in &market_rule {
            if let Some(asset_rule_unwrapped) = asset_rule {
                asset_rule_unwrapped.verify_new_rule(&None)?
            }
        }

        let market_rule_id = self
            .data::<LendingPoolStorage>()
            .account_for_add_market_rule(&market_rule);

        let registerd_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();

        for asset_id in 0..market_rule.len() {
            if let Some(asset_rules) = market_rule[asset_id] {
                self._emit_asset_rules_changed_event(
                    &market_rule_id,
                    &registerd_assets[asset_id],
                    &asset_rules,
                );
            }
        }

        Ok(())
    }

    fn modify_asset_rule(
        &mut self,
        market_rule_id: u32,
        asset: AccountId,
        asset_rules: AssetRules,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_asset_rule_change(
                &market_rule_id,
                &asset,
                &asset_rules,
            )?;

        self._emit_asset_rules_changed_event(
            &market_rule_id,
            &asset,
            &asset_rules,
        );

        Ok(())
    }

    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, i128)>, LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(TREASURY, Some(caller))?;

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

pub trait ManageInternal: StorageFieldGetter<LendingPoolStorage> {
    fn _instantiate_a_token_contract(
        &self,
        a_token_code_hash: &[u8; 32],
        underlying_asset: &AccountId,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> AccountId {
        let lending_pool: AccountId = Self::env().account_id();

        self._instantiate_abacus_token(
            a_token_code_hash,
            &lending_pool,
            underlying_asset,
            "Abax Deposit ".to_string() + &name,
            "a".to_string() + &symbol,
            decimals,
        )
    }

    fn _instantiate_v_token_contract(
        &self,
        v_token_code_hash: &[u8; 32],
        underlying_asset: &AccountId,
        name: String,
        symbol: String,
        decimals: u8,
    ) -> AccountId {
        let lending_pool: AccountId = Self::env().account_id();

        self._instantiate_abacus_token(
            v_token_code_hash,
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
            .ref_time_limit(10_000_000_000)
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
