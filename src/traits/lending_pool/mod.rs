/// contains function that are used by `AToken` to interact with `LendingPool`
pub mod a_token_interface;
pub mod borrow;
/// contains functions that are used by users with no special access to interact and use `LendingPool`
pub mod deposit;
pub mod flash_loan;
pub mod liquidate;
pub mod maintain;

/// contains functions that are used by users with special acces to manage `LendingPool`
pub mod manage;
/// contains function that are used by `VToken` to interact with `LendingPool`
pub mod v_token_interface;
/// contains view functions that can be used by anyone to view `LendingPool` state
pub mod view;

/// list of possible errors
pub mod errors;
/// list of possible events
pub mod events;

pub mod types;

pub mod structs;
