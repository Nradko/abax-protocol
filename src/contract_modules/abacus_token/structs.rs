use ink::primitives::AccountId;
use pendzl::traits::Balance;

#[derive(Default, Debug, scale::Decode, scale::Encode, Clone)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub struct TransferEventData {
    pub from: Option<AccountId>,
    pub to: Option<AccountId>,
    pub amount: Balance,
}
