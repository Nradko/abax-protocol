use abax_library::structs::{ReserveFees, ReserveRestrictions};
use ink::{prelude::string::String, primitives::AccountId};
use pendzl::traits::Balance;

use super::{InterestRateModel, RuleId};

/// Emited when a deposit of 'amount' in 'asset' is made by 'caller' on behalf of 'on_behalf_of'.
/// The data coresponding to asset and (asset, on_behalf_of) is updated (interests are accumulated).
#[ink::event]
pub struct Deposit {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}
/// Emited when a withdraw of 'amount' in 'asset' is made by 'caller' on behalf of 'on_behalf_of'.
/// The data coresponding to asset and (asset, on_behalf_of) is updated (interests are accumulated).
#[ink::event]
pub struct Withdraw {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}

/// Emited when a market rule is chosen.
#[ink::event]
pub struct MarketRuleChosen {
    #[ink(topic)]
    pub caller: AccountId,
    pub market_rule_id: RuleId,
}

/// Emited when an `asset` is enabled or disabled as collateral by the `caller`.
#[ink::event]
pub struct CollateralSet {
    #[ink(topic)]
    pub caller: AccountId,
    #[ink(topic)]
    pub asset: AccountId,
    pub set: bool,
}

/// Emited when a borrow of 'amount' in 'asset' is made by 'caller' on behalf of 'on_behalf_of'.
/// The data coresponding to asset and (asset, on_behalf_of) is updated (interests are accumulated).
#[ink::event]
pub struct Borrow {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}

/// Emited when a repay of 'amount' in 'asset' is made by 'caller' on behalf of 'on_behalf_of'.
/// The data coresponding to asset and (asset, on_behalf_of) is updated (interests are accumulated).
#[ink::event]
pub struct Repay {
    #[ink(topic)]
    pub asset: AccountId,
    pub caller: AccountId,
    #[ink(topic)]
    pub on_behalf_of: AccountId,
    pub amount: Balance,
}

/// Emited when a flash loan of `amount` in `asset` is initiated by `caller` to the `receiver`.
/// The receiver pays back the `amount` and `fee` in the same transaction.
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

/// Emited when a liquidation is made by 'liquidator' on 'liquidated_account'.
/// The liquidator takes 'amount_taken' of 'asset_to_take' and repays 'amount_repaid' of 'asset_to_repay'.
///
/// # Note
/// The data coresponding to asset_to_take, amount_repaid
/// and (asset_to_repay, liquidated_account)
/// and (asset_to_take, liquidator) and (asset_to_take, liquidated_account) is updated (interests are accumulated).
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

/// Emited when a interest indexes are updated in reserve coreespoding to asset.
///
/// # Note
/// This event is not emitted when Deposit, Withdraw, Borrow, Repay, Liquidation events are emitted eventhougth the interest indexes are updated.
#[ink::event]
pub struct InterestsAccumulated {
    #[ink(topic)]
    pub asset: AccountId,
}

/// Emited when an asset is registered.
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

/// Emited when a price feed provider is changed.
#[ink::event]
pub struct PriceFeedProviderChanged {
    pub price_feed_provider: AccountId,
}

/// Emited when a flash loan fee is changed.
#[ink::event]
pub struct FlashLoanFeeChanged {
    pub flash_loan_fee_e6: u128,
}

/// Emited when a reserve is activated.
#[ink::event]
pub struct ReserveActivated {
    #[ink(topic)]
    pub asset: AccountId,
    pub active: bool,
}

/// Emited when a reserve is freezed.
#[ink::event]
pub struct ReserveFreezed {
    #[ink(topic)]
    pub asset: AccountId,
    pub freezed: bool,
}

/// Emited when a interest rate model is changed.
#[ink::event]
pub struct ReserveInterestRateModelChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub interest_rate_model: InterestRateModel,
}

/// Emited when a reserve restrictions are changed.
#[ink::event]
pub struct ReserveRestrictionsChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub reserve_restrictions: ReserveRestrictions,
}

/// Emited when a reserve fees are changed.
#[ink::event]
pub struct ReserveFeesChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub reserve_fees: ReserveFees,
}

/// Emited when an asset rules in an martket rule are changed.
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

/// Emited when a fee reductions are set.
#[ink::event]
pub struct FeeReductionsSet {
    #[ink(topic)]
    pub asset: AccountId,
    pub fee_reductions: (u32, u32),
}

/// Emited when a protocol income genareted in 'asset' is taken.
#[ink::event]
pub struct IncomeTaken {
    #[ink(topic)]
    pub asset: AccountId,
}

/// Emited when stablecoin debt rate is changed.
#[ink::event]
pub struct StablecoinDebtRateChanged {
    #[ink(topic)]
    pub asset: AccountId,
    pub debt_rate_e18: u64,
}
