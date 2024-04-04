use crate::dummy::DummyRef;
use crate::lending_pool::events::FeeReductionChanged;
use crate::lending_pool::{
    events::{
        AssetRegistered, AssetRulesChanged, FlashLoanFeeChanged, IncomeTaken,
        PriceFeedProviderChanged, ReserveActivated, ReserveFeesChanged,
        ReserveFrozen, ReserveInterestRateModelChanged,
        ReserveRestrictionsChanged, StablecoinDebtRateChanged,
    },
    InterestRateModel, LendingPoolError, MarketRule, ASSET_LISTING_ADMIN,
    EMERGENCY_ADMIN, PARAMETERS_ADMIN, STABLECOIN_RATE_ADMIN, TREASURY,
};
use abax_library::structs::{
    AssetRules, ReserveAbacusTokens, ReserveData, ReserveFees,
    ReserveRestrictions,
};
use ink::env::DefaultEnvironment;
use ink::prelude::string::{String, ToString};
use ink::{
    env::call::ExecutionInput,
    prelude::vec::Vec,
    primitives::{AccountId, Hash},
    ToAccountId,
};
use pendzl::contracts::access_control;
use pendzl::traits::{Balance, StorageFieldGetter};

use super::internal::InternalIncome;
use super::storage::LendingPoolStorage;
use super::Transfer;

pub trait LendingPoolManageImpl:
    ManageInternal + access_control::AccessControlInternal
{
    fn set_price_feed_provider(
        &mut self,
        price_feed_provider: AccountId,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_price_feed_provider_change(&price_feed_provider);
        ink::env::emit_event::<DefaultEnvironment, PriceFeedProviderChanged>(
            PriceFeedProviderChanged {
                price_feed_provider,
            },
        );
        Ok(())
    }
    fn set_fee_reduction_provider(
        &mut self,
        fee_reduction_provider: AccountId,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_fee_reduction_provider_change(&fee_reduction_provider);
        ink::env::emit_event::<DefaultEnvironment, FeeReductionChanged>(
            FeeReductionChanged {
                fee_reduction_provider,
            },
        );
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
        ink::env::emit_event::<DefaultEnvironment, FlashLoanFeeChanged>(
            FlashLoanFeeChanged { flash_loan_fee_e6 },
        );
        Ok(())
    }

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
        reserve_fees: SetReserveFeesArgs,
        interest_rate_model: Option<InterestRateModel>,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(ASSET_LISTING_ADMIN, Some(caller))?;

        let timestamp = Self::env().block_timestamp();

        if reserve_fees.deposit_fee_e6 > 1_000_000 {
            return Err(LendingPoolError::DepositFeeTooHigh);
        }

        self.data::<LendingPoolStorage>()
            .account_for_register_asset(
                &asset,
                &ReserveData::default(),
                &reserve_restrictions,
                &10_u128.pow(decimals.into()),
                &ReserveFees::new(
                    reserve_fees.deposit_fee_e6,
                    reserve_fees.debt_fee_e6,
                ),
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

        ink::env::emit_event::<DefaultEnvironment, AssetRegistered>(
            AssetRegistered {
                asset,
                name,
                symbol,
                decimals,
                a_token_code_hash,
                v_token_code_hash,
                a_token_address,
                v_token_address,
            },
        );

        interest_rate_model.iter().for_each(|model| {
            ink::env::emit_event::<
                DefaultEnvironment,
                ReserveInterestRateModelChanged,
            >(ReserveInterestRateModelChanged {
                asset,
                interest_rate_model: *model,
            });
        });

        ink::env::emit_event::<DefaultEnvironment, ReserveRestrictionsChanged>(
            ReserveRestrictionsChanged {
                asset,
                reserve_restrictions,
            },
        );

        ink::env::emit_event::<DefaultEnvironment, AssetRulesChanged>(
            AssetRulesChanged {
                market_rule_id: 0,
                asset,
                collateral_coefficient_e6: asset_rules
                    .collateral_coefficient_e6,
                borrow_coefficient_e6: asset_rules.borrow_coefficient_e6,
                penalty_e6: asset_rules.penalty_e6,
            },
        );

        ink::env::emit_event::<DefaultEnvironment, ReserveFeesChanged>(
            ReserveFeesChanged {
                asset,
                reserve_fees,
            },
        );
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

        ink::env::emit_event::<DefaultEnvironment, ReserveActivated>(
            ReserveActivated { asset, active },
        );

        Ok(())
    }

    fn set_reserve_is_frozen(
        &mut self,
        asset: AccountId,
        new_is_frozen: bool,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(EMERGENCY_ADMIN, Some(caller))?;

        self.data::<LendingPoolStorage>()
            .account_for_changing_is_frozen(&asset, new_is_frozen)?;
        ink::env::emit_event::<DefaultEnvironment, ReserveFrozen>(
            ReserveFrozen {
                asset,
                frozen: new_is_frozen,
            },
        );
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

        ink::env::emit_event::<DefaultEnvironment, ReserveRestrictionsChanged>(
            ReserveRestrictionsChanged {
                asset,
                reserve_restrictions,
            },
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

        ink::env::emit_event::<
            DefaultEnvironment,
            ReserveInterestRateModelChanged,
        >(ReserveInterestRateModelChanged {
            asset,
            interest_rate_model,
        });
        Ok(())
    }

    fn set_reserve_fees(
        &mut self,
        asset: AccountId,
        reserve_fees: SetReserveFeesArgs,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        if reserve_fees.deposit_fee_e6 > 1_000_000 {
            return Err(LendingPoolError::DepositFeeTooHigh);
        }

        self.data::<LendingPoolStorage>()
            .account_for_reserve_fees_change(
                &asset,
                &ReserveFees::new(
                    reserve_fees.deposit_fee_e6,
                    reserve_fees.debt_fee_e6,
                ),
            )?;
        ink::env::emit_event::<DefaultEnvironment, ReserveFeesChanged>(
            ReserveFeesChanged {
                asset,
                reserve_fees,
            },
        );
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
        ink::env::emit_event::<DefaultEnvironment, StablecoinDebtRateChanged>(
            StablecoinDebtRateChanged {
                asset,
                debt_rate_e18,
            },
        );

        Ok(())
    }

    fn add_market_rule(
        &mut self,
        market_rule: MarketRule,
    ) -> Result<(), LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(PARAMETERS_ADMIN, Some(caller))?;

        for asset_rule in market_rule.iter().flatten() {
            asset_rule.validate_new_rule(&None)?;
        }

        let market_rule_id = self
            .data::<LendingPoolStorage>()
            .account_for_add_market_rule(&market_rule);

        let registerd_assets = self
            .data::<LendingPoolStorage>()
            .get_all_registered_assets();

        for asset_id in 0..market_rule.len() {
            if let Some(asset_rules) = market_rule[asset_id] {
                ink::env::emit_event::<DefaultEnvironment, AssetRulesChanged>(
                    AssetRulesChanged {
                        market_rule_id,
                        asset: registerd_assets[asset_id],
                        collateral_coefficient_e6: asset_rules
                            .collateral_coefficient_e6,
                        borrow_coefficient_e6: asset_rules
                            .borrow_coefficient_e6,
                        penalty_e6: asset_rules.penalty_e6,
                    },
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

        ink::env::emit_event::<DefaultEnvironment, AssetRulesChanged>(
            AssetRulesChanged {
                market_rule_id,
                asset,
                collateral_coefficient_e6: asset_rules
                    .collateral_coefficient_e6,
                borrow_coefficient_e6: asset_rules.borrow_coefficient_e6,
                penalty_e6: asset_rules.penalty_e6,
            },
        );

        Ok(())
    }

    fn take_protocol_income(
        &mut self,
        assets: Option<Vec<AccountId>>,
        to: AccountId,
    ) -> Result<Vec<(AccountId, Balance)>, LendingPoolError> {
        let caller = Self::env().caller();
        self._ensure_has_role(TREASURY, Some(caller))?;

        let assets_and_amounts = match assets {
            Some(assets_vec) => self._take_protocol_income(&assets_vec)?,
            None => {
                let registered_assets = self
                    .data::<LendingPoolStorage>()
                    .get_all_registered_assets();
                self._take_protocol_income(&registered_assets)?
            }
        };

        for asset_and_amount in
            assets_and_amounts.iter().take_while(|x| x.1 > 0)
        {
            self._transfer_out(&asset_and_amount.0, &to, &asset_and_amount.1)?;
            ink::env::emit_event::<DefaultEnvironment, IncomeTaken>(
                IncomeTaken {
                    asset: asset_and_amount.0,
                },
            );
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

        let mut token_name = "Abax Deposit ".to_string();
        token_name.push_str(&name);

        let mut token_symbol = "a".to_string();
        token_symbol.push_str(&symbol);

        self._instantiate_abacus_token(
            a_token_code_hash,
            &lending_pool,
            underlying_asset,
            token_name,
            token_symbol,
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

        let mut token_name = "Abax Variable Debt ".to_string();
        token_name.push_str(&name);

        let mut token_symbol = "v".to_string();
        token_symbol.push_str(&symbol);

        self._instantiate_abacus_token(
            v_token_code_hash,
            &lending_pool,
            underlying_asset,
            token_name,
            token_symbol,
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
            .instantiate_v1()
            .code_hash(Hash::from(*abacus_token_code_hash))
            .gas_limit(10_000_000_000)
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
            .instantiate_contract_v1(&create_params)
            .unwrap_or_else(|error| {
                panic!("Contract pallet error: {:?}", error)
            })
            .unwrap_or_else(|error| panic!("LangError: {:?}", error));
        contract.to_account_id()
    }
}
