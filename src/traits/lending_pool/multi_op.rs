pub type LendingPoolMultiOpRef =
    contract_ref!(LendingPoolMultiOp, DefaultEnvironment);

#[ink::trait_definition]
pub trait LendingPoolMultiOp {
    #[ink(message)]
    fn multi_op(
        &mut self,
        op: Vec<Action>,
        on_behalf_of: AccountId,
        data: Vec<u8>,
    ) -> Result<(), LendingPoolError>;
}
