// SPDX-License-Identifier: BUSL-1.1
use pendzl::math::errors::MathError;

use ink::prelude::string::String;

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum FlashLoanReceiverError {
    MathErorr(MathError),
    Custom(String),
}

impl From<MathError> for FlashLoanReceiverError {
    fn from(error: MathError) -> Self {
        FlashLoanReceiverError::MathErorr(error)
    }
}
