use openbrush::traits::{
    AccountId,
    Balance,
};

#[openbrush::trait_definition]
pub trait EmitDepositEvents {
    fn _emit_deposit_event(&mut self, asset: AccountId, caller: AccountId, on_behalf_of: AccountId, amount: Balance);
    fn _emit_redeem_event(&mut self, asset: AccountId, caller: AccountId, on_behalf_of: AccountId, amount: Balance);
}

#[openbrush::trait_definition]
pub trait EmitBorrowEvents {
    fn _emit_borrow_variable_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    );
    fn _emit_repay_variable_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    );
    fn _emit_borrow_stable_event(
        &mut self,
        asset: AccountId,
        user: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        stable_rate: u128,
    );
    fn _emit_repay_stable_event(
        &mut self,
        asset: AccountId,
        caller: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
    );
}

#[openbrush::trait_definition]
pub trait EmitConfigureEvents {
    fn _emit_choose_rule_event(&mut self, caller: AccountId, rule_id: u64);
}

#[openbrush::trait_definition]
pub trait EmitFlashEvents {
    fn _emit_flash_loan_event(
        &mut self,
        receiver_address: AccountId,
        caller: AccountId,
        asset: AccountId,
        amount: u128,
        fee: u128,
    );
}

#[openbrush::trait_definition]
pub trait EmitLiquidateEvents {
    fn _emit_liquidation_variable_event(
        &mut self,
        liquidator: AccountId,
        user: AccountId,
        asset_to_rapay: AccountId,
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    );
    fn _emit_liquidation_stable_event(
        &mut self,
        liquidator: AccountId,
        user: AccountId,
        asset_to_rapay: AccountId,
        asset_to_take: AccountId,
        amount_repaid: Balance,
        amount_taken: Balance,
    );
}

#[openbrush::trait_definition]
pub trait EmitMaintainEvents {}

#[openbrush::trait_definition]
pub trait EmitManageEvents {
    fn _emit_asset_registered_event(&mut self, asset: AccountId);
}
