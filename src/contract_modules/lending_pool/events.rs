use abax_library::structs::{ReserveFees, ReserveRestrictions};
use ink::{prelude::string::String, primitives::AccountId};
use pendzl::traits::Balance;

use super::{InterestRateModel, RuleId};

#[ink::event]
pub struct Deposit {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}
#[ink::event]
pub struct Withdraw {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}

#[ink::event]
pub struct MarketRuleChosen {
    #[ink(topic)]
    pub caller: AccountId,
    pub market_rule_id: RuleId,
}

#[ink::event]
pub struct CollateralSet {
    #[ink(topic)]
    pub caller: AccountId,
    #[ink(topic)]
    pub asset: AccountId,
    pub set: bool,
}

#[ink::event]
pub struct Borrow {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}
#[ink::event]
pub struct Repay {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}

#[ink::event]
pub struct FlashLoan {
    #[ink(topic)]
    pub receiver: AccountId,
    #[ink(topic)]
    pub caller: AccountId,
    #[ink(topic)]
    pub asset: AccountId,
    pub amount: u128,
    pub fee: u128,
}

#[ink::event]
pub struct Liquidation {
    pub liquidator: AccountId,
    #[ink(topic)]
    pub liquidated_account: AccountId,
    #[ink(topic)]
    pub asset_to_repay: AccountId,
    #[ink(topic)]
    pub asset_to_take: AccountId,
    pub amount_repaid: Balance,
    pub amount_taken: Balance,
}
#[ink::event]
pub struct InterestsAccumulated {
    #[ink(topic)]
    pub asset: AccountId,
}

#[ink::event]
pub struct UserInterestsAccumulated {
    #[ink(topic)]
    pub asset: AccountId,
    #[ink(topic)]
    pub user: AccountId,
}

#[ink::event]
pub struct RateRebalanced {
    #[ink(topic)]
    pub asset: AccountId,
    #[ink(topic)]
    pub user: AccountId,
}

#[ink::event]
pub struct AssetRegistered {
    #[ink(topic)]
    pub asset: AccountId,
    pub decimals: u8,
    pub name: String,
    pub symbol: String,
    pub a_token_code_hash: [u8; 32],
    pub v_token_code_hash: [u8; 32],
    pub a_token_address: AccountId,
    pub v_token_address: AccountId,
}

#[ink::event]
pub struct PriceFeedProviderChanged {
    pub price_feed_provider: AccountId,
}
#[ink::event]
pub struct FlashLoanFeeChanged {
    pub flash_loan_fee_e6: u128,
}

#[ink::event]
pub struct ReserveActivated {
    #[ink(topic)]
    pub asset: AccountId,
    pub active: bool,
}

#[ink::event]
pub struct ReserveFreezed {
    #[ink(topic)]
    pub asset: AccountId,
    pub freezed: bool,
}

#[ink::event]
pub struct ReserveInterestRateModelChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub interest_rate_model: InterestRateModel,
}

#[ink::event]
pub struct ReserveRestrictionsChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub reserve_restrictions: ReserveRestrictions,
}

#[ink::event]
pub struct ReserveFeesChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub reserve_fees: ReserveFees,
}

#[ink::event]
pub struct AssetRulesChanged {
    #[ink(topic)]
    pub market_rule_id: RuleId,
    #[ink(topic)]
    pub asset: AccountId,
    pub collateral_coefficient_e6: Option<u128>,
    pub borrow_coefficient_e6: Option<u128>,
    pub penalty_e6: Option<u128>,
}

#[ink::event]
pub struct IncomeTaken {
    #[ink(topic)]
    pub asset: AccountId,
}

#[ink::event]
pub struct StablecoinDebtRateChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub debt_rate_e18: u64,
}
