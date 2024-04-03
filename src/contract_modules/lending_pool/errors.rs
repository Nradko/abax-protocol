use abax_library::structs::{
    AssetRulesError, ReserveDataError, ReserveRestrictionsError,
};
use pendzl::{
    contracts::{access_control::AccessControlError, psp22::PSP22Error},
    math::errors::MathError,
};

use crate::{
    flash_loan_receiver::FlashLoanReceiverError, price_feed::PriceFeedError,
};

use ink::prelude::format;

/// Possible errors returned by `LendingPool` messages.
#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum LendingPoolError {
    PSP22Error(PSP22Error),
    AccessControlError(AccessControlError),

    MathError(MathError),

    AssetRulesError(AssetRulesError),
    ReserveDataError(ReserveDataError),
    ReserveRestrictionsError(ReserveRestrictionsError),

    PriceFeedError(PriceFeedError),
    FlashLoanReceiverError(FlashLoanReceiverError),

    /// returned if the `amount` argument is zero.
    AmountNotGreaterThanZero,
    /// returned if asset that is alerady registered is tried to be registered again.
    AlreadyRegistered,
    /// returned if an asset that is not registered is passed as an argument to message.
    AssetNotRegistered,
    /// returned if Abax native Stable Tokens AccountId is passed as argument to the message where these tokens are not supported.
    AssetIsProtocolStablecoin,
    /// returned if an operation reserved only to abax stable tokens is calles on normal asset.
    AssetIsNotProtocolStablecoin,
    /// returned if one tries to borrow an asset that id not allowed to be borrowed based on the market rule chosen by one.
    RuleBorrowDisable,
    /// returned if one tries to use as colalteral an asset that id not allowed to be borrowed based on the market rule chosen by one.
    RuleCollateralDisable,
    /// returned if after the action account would become undercollaterized
    InsufficientCollateral,
    /// returned if one is trying to transfer a debt one doesn't have.
    InsufficientDebt,
    /// returned if one is trying to liquidate collaterized account.
    Collaterized,
    /// returned if one is trying to transfer a deposit one doesn't have.
    InsufficientDeposit,
    /// returned if the liquidation would result in not enough recompensation per repaid token.
    MinimumRecieved,
    /// returned if there is nothing to be repaid (in an asset) during liquidation.
    NothingToRepay,
    /// returned if there is nothing (in an asset) to to recompensate the liquidation.
    NothingToCompensateWith,
    /// returned if a liquidator tries to take an asset that is not a collateral as a compensation.
    TakingNotACollateral,
    /// returned if len of vector of assets that should be borrowed is different then lenght of vector of amounts.
    FlashLoanAmountsAssetsInconsistentLengths,
    /// returned if passed 'market_rule_id' that is not used.
    MarketRuleInvalidId,
}

impl From<AssetRulesError> for LendingPoolError {
    fn from(error: AssetRulesError) -> Self {
        LendingPoolError::AssetRulesError(error)
    }
}
impl From<ReserveDataError> for LendingPoolError {
    fn from(error: ReserveDataError) -> Self {
        LendingPoolError::ReserveDataError(error)
    }
}

impl From<ReserveRestrictionsError> for LendingPoolError {
    fn from(error: ReserveRestrictionsError) -> Self {
        LendingPoolError::ReserveRestrictionsError(error)
    }
}

impl From<MathError> for LendingPoolError {
    fn from(error: MathError) -> Self {
        LendingPoolError::MathError(error)
    }
}

impl From<PSP22Error> for LendingPoolError {
    fn from(error: PSP22Error) -> Self {
        LendingPoolError::PSP22Error(error)
    }
}

impl From<PriceFeedError> for LendingPoolError {
    fn from(error: PriceFeedError) -> Self {
        LendingPoolError::PriceFeedError(error)
    }
}

impl From<AccessControlError> for LendingPoolError {
    fn from(error: AccessControlError) -> Self {
        LendingPoolError::AccessControlError(error)
    }
}

impl From<LendingPoolError> for PSP22Error {
    fn from(error: LendingPoolError) -> Self {
        match error {
            LendingPoolError::MathError(MathError::Underflow) => {
                PSP22Error::InsufficientBalance
            }
            e => PSP22Error::Custom(format!("{e:?}")),
        }
    }
}

impl From<FlashLoanReceiverError> for LendingPoolError {
    fn from(flash_error: FlashLoanReceiverError) -> Self {
        LendingPoolError::FlashLoanReceiverError(flash_error)
    }
}

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum MultiOpError {
    OperationError(u32, LendingPoolError),
}
