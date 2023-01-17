/// contains function that are used by `AToken` to interact with `LendingPool`
pub mod a_token_interface;
/// contains functions that are used by users with no special access to interact and use `LendingPool`
pub mod actions;
/// contains functions that are used by users with special acces to manage `LendingPool`
pub mod manage;
/// contains function that are used by `SToken` to interact with `LendingPool`
pub mod s_token_interface;
/// contains function that are used by `VToken` to interact with `LendingPool`
pub mod v_token_interface;
/// contains view functions that can be used by anyone to view `LendingPool` state
pub mod view;
