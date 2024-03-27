use ink::primitives::AccountId;
use pendzl::traits::Balance;

/// Data needed to emit PSP22 Transfer event.
#[derive(Default, Debug, scale::Decode, scale::Encode, Clone)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub struct TransferEventData {
    pub from: Option<AccountId>,
    pub to: Option<AccountId>,
    pub amount: Balance,
}
