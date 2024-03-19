pub type LendingPoolMultiOpRef =
    contract_ref!(LendingPoolMultiOp, DefaultEnvironment);

#[ink::trait_definition]
pub trait LendingPoolMultiOp {
    #[ink(message)]
    fn multi_op(&mut self, op: Vec<MultiOpParams>) -> Result<(), MultiOpError>;
}
