use ink::primitives::AccountId;
use pendzl::traits::Balance;

#[derive(Debug, scale::Encode, scale::Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct OperationArgs {
    pub asset: AccountId,
    pub amount: Balance,
}
#[derive(Debug, Eq, PartialEq, Copy, scale::Encode, scale::Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub enum Operation {
    Deposit,
    Withdraw,
    Borrow,
    Repay,
}
#[derive(Debug, scale::Encode, scale::Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct Action {
    pub op: Operation,
    pub args: OperationArgs,
}
