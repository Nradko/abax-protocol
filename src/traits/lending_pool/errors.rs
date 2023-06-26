use ink::{
    prelude::string::String,
    LangError,
};
use openbrush::contracts::{
    access_control::AccessControlError,
    pausable::PausableError,
    psp22::PSP22Error,
};

use crate::traits::flash_loan_receiver::FlashLoanReceiverError;

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum LendingPoolError {
    PSP22Error(PSP22Error),
    StorageError(StorageError),
    FlashLoanReceiverError(FlashLoanReceiverError),

    AccessControlError(AccessControlError),
    PausableError(PausableError),
    LangError(LangError),
    Inactive,
    Freezed,
    AssetNotRegistered,
    RuleBorrowDisable,
    RuleCollateralDisable,
    InsufficientCollateral,
    InsufficientDebt,
    Collaterized,
    InsufficientSupply,
    MinimumRecieved,
    AmountNotGreaterThanZero,
    AmountExceedsUserDeposit,
    AssetPriceNotInitialized,
    AmountExceedsUserDebt,
    NothingToRepay,
    NothingToCompensateWith,
    TakingNotACollateral,
    FlashLoanAmountsAssetsInconsistentLengths,
    MaxSupplyReached,
    MaxDebtReached,
    MarketRuleInvalidAssetId,
    MarketRuleInvalidId,
    MarketRulePenaltyNotSet,
}

impl From<LangError> for LendingPoolError {
    fn from(error: LangError) -> Self {
        LendingPoolError::LangError(error)
    }
}

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum LendingPoolTokenInterfaceError {
    PSP22Error(PSP22Error),
    PausableError(PausableError),
    StorageError(StorageError),
    InsufficientBalance,
    WrongCaller,
    InsufficientCollateral,
    TransfersDisabled,
    MinimalDebt,
    MinimalSupply,
    AssetNotRegistered,
    MarketRule,
}

impl From<PSP22Error> for LendingPoolError {
    fn from(error: PSP22Error) -> Self {
        LendingPoolError::PSP22Error(error)
    }
}

impl From<AccessControlError> for LendingPoolError {
    fn from(error: AccessControlError) -> Self {
        LendingPoolError::AccessControlError(error)
    }
}

impl From<PausableError> for LendingPoolError {
    fn from(error: PausableError) -> Self {
        LendingPoolError::PausableError(error)
    }
}

impl From<PausableError> for LendingPoolTokenInterfaceError {
    fn from(error: PausableError) -> Self {
        LendingPoolTokenInterfaceError::PausableError(error)
    }
}

impl From<PSP22Error> for LendingPoolTokenInterfaceError {
    fn from(error: PSP22Error) -> Self {
        LendingPoolTokenInterfaceError::PSP22Error(error)
    }
}

impl From<LendingPoolTokenInterfaceError> for PSP22Error {
    fn from(error: LendingPoolTokenInterfaceError) -> Self {
        match error {
            LendingPoolTokenInterfaceError::PausableError(_) => PSP22Error::Custom(String::from("Paused").into()),
            LendingPoolTokenInterfaceError::InsufficientBalance => PSP22Error::InsufficientBalance,
            LendingPoolTokenInterfaceError::AssetNotRegistered => {
                PSP22Error::Custom(String::from("AssetNotRegistered").into())
            }
            LendingPoolTokenInterfaceError::WrongCaller => PSP22Error::Custom(String::from("WrongCaller").into()),
            LendingPoolTokenInterfaceError::InsufficientCollateral => {
                PSP22Error::Custom(String::from("InsufficientCollateral").into())
            }
            LendingPoolTokenInterfaceError::TransfersDisabled => {
                PSP22Error::Custom(String::from("TransfersDisabled").into())
            }
            LendingPoolTokenInterfaceError::StorageError(_) => PSP22Error::Custom(String::from("StorageError").into()),
            LendingPoolTokenInterfaceError::MinimalDebt => PSP22Error::Custom(String::from("MinimalDebt").into()),
            LendingPoolTokenInterfaceError::MinimalSupply => PSP22Error::Custom(String::from("MinimalSupply").into()),
            LendingPoolTokenInterfaceError::MarketRule => PSP22Error::Custom(String::from("MarketRule").into()),
            LendingPoolTokenInterfaceError::PSP22Error(psp22_error) => psp22_error,
        }
    }
}
#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum StorageError {
    EntityNotFound(String),
}

impl From<StorageError> for LendingPoolError {
    fn from(storage_error: StorageError) -> Self {
        LendingPoolError::StorageError(storage_error)
    }
}

impl From<StorageError> for LendingPoolTokenInterfaceError {
    fn from(storage_error: StorageError) -> Self {
        LendingPoolTokenInterfaceError::StorageError(storage_error)
    }
}

impl From<FlashLoanReceiverError> for LendingPoolError {
    fn from(flash_error: FlashLoanReceiverError) -> Self {
        LendingPoolError::FlashLoanReceiverError(flash_error)
    }
}
