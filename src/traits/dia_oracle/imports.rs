use ink::prelude::string::String;
use ink::prelude::vec::Vec;
use ink::primitives::AccountId;

use ink::contract_ref;
use ink::env::DefaultEnvironment;
pub type OracleGettersRef = contract_ref!(OracleGetters, DefaultEnvironment);
