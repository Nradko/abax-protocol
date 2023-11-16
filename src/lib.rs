#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[allow(clippy::too_many_arguments)]
// implementations of traits
pub mod impls;
// helper functions
pub mod library;
// Interfaces of contracts i.e. interface = traits + events + errors
pub mod traits;
