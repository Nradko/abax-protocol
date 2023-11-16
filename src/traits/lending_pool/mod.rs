/// Trait containing messages that are accessible to **AToken** - the PSP22 wrapeer of deposits.
pub mod a_token_interface;
/// Trait containing messges that are used by **borrowers**.
pub mod borrow;
/// Trait containing messages that are used by **depositors**.
pub mod deposit;
/// Possible errors returned by `LendingPool` messages.
pub mod errors;
/// Possible events emitted by `LendingPool` messages.
pub mod events;
/// Trait containing flash_loan message. Used by **flash loaners**.
pub mod flash_loan;
/// Trait containing liquidate message. Used by **liquidators**.
pub mod liquidate;
/// Trait containing messages that are used to maintain inetrest accumulation. Used by **maintainers**.
pub mod maintain;
/// Trait containing `AccessControl` messages used to manage 'LendingPool' parameters. USed by **managers**.
pub mod manage;
/// Structs used in traits and storage
pub mod structs;
/// types used in traits and storage
pub mod types;
/// Trait containing messages that are accessible to **VToken** - the PSP22 Wrapper of debts.
pub mod v_token_interface;
/// Trait containing non-mutable messages.
pub mod view;
