use pendzl::math::errors::MathError;

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
