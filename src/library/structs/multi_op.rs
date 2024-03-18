#[derive(Debug, Encode, Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
// based on all above trait ink messages
pub enum MultiOpParams {
    Deposit {
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    },
    Redeem {
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    },
    Borrow {
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    },
    Repay {
        asset: AccountId,
        on_behalf_of: AccountId,
        amount: Balance,
        data: Vec<u8>,
    },
    ChooseMarketRule {
        market_rule_id: u32,
    },
    SetAsCollateral {
        asset: AccountId,
        use_as_collateral: bool,
    },
}
