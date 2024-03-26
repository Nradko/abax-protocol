#[derive(Debug, Encode, Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct OperationArgs {
    pub asset: AccountId,
    pub amount: Balance,
}
#[derive(Debug, Encode, Eq, PartialEq, Copy, Decode, Clone)]
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
#[derive(Debug, Encode, Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct Action {
    pub op: Operation,
    pub args: OperationArgs,
}
