#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod flash_loan_receiver_mock {
    use abax_contracts::flash_loan_receiver::{
        FlashLoanReceiver, FlashLoanReceiverError,
    };
    use ink::prelude::{string::ToString, vec::Vec};

    use ink::codegen::TraitCallBuilder;
    use pendzl::{
        contracts::psp22::{
            mintable::{PSP22Mintable, PSP22MintableRef},
            PSP22Ref, PSP22,
        },
        math::errors::MathError,
        traits::StorageFieldGetter,
    };

    #[ink::event]
    pub struct ExecutedWithSuccess {
        #[ink(topic)]
        assets: Vec<AccountId>,
        #[ink(topic)]
        amounts: Vec<u128>,
        #[ink(topic)]
        fees: Vec<u128>,
    }
    #[ink::event]
    pub struct ExecutedWithFail {
        #[ink(topic)]
        assets: Vec<AccountId>,
        #[ink(topic)]
        amounts: Vec<u128>,
        #[ink(topic)]
        fees: Vec<u128>,
    }

    #[ink(storage)]
    #[derive(Default, StorageFieldGetter)]
    pub struct FlashLoanReceiverMock {
        fail_execute_operation: bool,
        simulate_balance_to_cover_fee: bool,
        custom_amount_to_approve: Option<Balance>,
    }
    impl FlashLoanReceiver for FlashLoanReceiverMock {
        #[ink(message)]
        #[allow(unused_variables)]
        fn execute_operation(
            &mut self,
            assets: Vec<AccountId>,
            amounts: Vec<u128>,
            fees: Vec<u128>,
            receiver_params: Vec<u8>,
        ) -> Result<(), FlashLoanReceiverError> {
            if self.fail_execute_operation {
                self.env().emit_event(ExecutedWithFail {
                    assets,
                    amounts,
                    fees,
                });
                return Err(FlashLoanReceiverError::Custom(
                    "ExecuteOperationFailed".to_string(),
                ));
            }
            for i in 0..assets.len() {
                let psp22: PSP22Ref = assets[i].into();
                let balance = psp22
                    .call()
                    .balance_of(self.env().account_id())
                    .call_v1()
                    .invoke();
                if amounts[i] > balance {
                    return Err(FlashLoanReceiverError::Custom(
                        "InsufficientBalance".to_string(),
                    ));
                }

                if self.simulate_balance_to_cover_fee {
                    let mut psp22: PSP22MintableRef = assets[i].into();

                    if psp22
                        .call_mut()
                        .mint(self.env().account_id(), fees[i])
                        .call_v1()
                        .invoke()
                        .is_err()
                    {
                        return Err(FlashLoanReceiverError::Custom(
                            "AssetNotMintable".to_string(),
                        ));
                    }
                }

                let amount_to_return = match self.custom_amount_to_approve {
                    Some(amount) => Ok(amount),
                    None => amounts[i]
                        .checked_add(fees[i])
                        .ok_or(MathError::Overflow),
                }?;
                if {
                    let mut psp22: PSP22Ref = assets[i].into();
                    psp22
                        .call_mut()
                        .approve(self.env().caller(), amount_to_return)
                        .call_v1()
                        .invoke()
                }
                .is_err()
                {
                    return Err(FlashLoanReceiverError::Custom(
                        "CantApprove".to_string(),
                    ));
                }
            }

            self.env().emit_event(ExecutedWithSuccess {
                assets,
                amounts,
                fees,
            });
            Ok(())
        }
    }

    impl FlashLoanReceiverMock {
        #[ink(constructor)]
        pub fn new() -> Self {
            FlashLoanReceiverMock {
                custom_amount_to_approve: None,
                fail_execute_operation: false,
                simulate_balance_to_cover_fee: true,
            }
        }

        #[ink(message)]
        pub fn set_fail_execute_operation(
            &mut self,
            should_fail_execute_operation: bool,
        ) {
            self.fail_execute_operation = should_fail_execute_operation;
        }

        #[ink(message)]
        pub fn set_custom_amount_to_approve(
            &mut self,
            custom_amount_to_approve: u128,
        ) {
            self.custom_amount_to_approve = Some(custom_amount_to_approve);
        }

        #[ink(message)]
        pub fn set_simulate_balance_to_cover_fee(
            &mut self,
            simulate_balance_to_cover_fee: bool,
        ) {
            self.simulate_balance_to_cover_fee = simulate_balance_to_cover_fee;
        }
    }
}
