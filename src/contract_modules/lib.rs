#![cfg_attr(not(feature = "std"), no_std)]
//! This crate provides the contract modules that are used in the abax protocol.
//!
//! Traits, evenets and errors define the interface of the contract module.
//!
//! Some modeules contain default implementations for the traits.

/// A contract module that should be treated as a psp22 extension
/// that allows for crating proxy tokens that represent Deposit or Debt of an underlying asset in the lending_pool.
pub mod abacus_token;
/// A contract module that allows for tracking all accounts that interacted with the contract.
pub mod account_registrar;
/// A DIA oracle contract module that allows for fetching the price of an asset.
/// <https://github.com/diadata-org/dia-wasm-oracle>
pub mod dia_oracle;
/// A dummy trait.
pub mod dummy;
/// A contract module responsible for receiveing flash loans.
pub mod flash_loan_receiver;
/// A contract module that allows for lending and borrowing of assets.
/// It is the core module of the abax protocol.
pub mod lending_pool;
/// A contract module that allows to get the asset price in the appropriate format.
/// It is used by the lending_pool implementatoin.
pub mod price_feed;

/// A contract module that allows to get the fee reductions for the given account.
/// It is used by the lending_pool implementatoin.
pub mod fee_reduction;
