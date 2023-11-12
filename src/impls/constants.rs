use pendzl::contracts::access_control::RoleType;

pub const E6_U128: u128 = 10_u128.pow(6);
pub const E8_U128: u128 = 10_u128.pow(8);
pub const E9_U128: u128 = 10_u128.pow(9);

pub const E10_U128: u128 = 10_u128.pow(10);
pub const E12_U128: u128 = 10_u128.pow(12);
pub const E15_U128: u128 = 10_u128.pow(15);
pub const E18_U128: u128 = 10_u128.pow(18);
pub const E24_U128: u128 = 10_u128.pow(24);
pub const ONE_HOUR: u128 = 60 * 60 * 1000;
pub const DAY: u128 = 24 * ONE_HOUR;
pub const MATH_ERROR_MESSAGE: &str = "An unexpected math error occured!";

// can mint given asset
pub const MINTER: RoleType = ink::selector_id!("MINTER"); // 4_254_773_782_u32

// can burn given asset
pub const BURNER: RoleType = ink::selector_id!("BURNER"); // 1_711_057_910_u32;

/// pays only 10% of standard flash loan fee
pub const FLASH_BORROWER: RoleType = ink::selector_id!("FLASH_BORROWER"); // 1_112_475_474_u32

/// can add new asset to the market
pub const ASSET_LISTING_ADMIN: RoleType =
    ink::selector_id!("ASSET_LISTING_ADMIN"); // 1_094_072_439_u32

/// can modify reserveData parameters
pub const PARAMETERS_ADMIN: RoleType = ink::selector_id!("PARAMETERS_ADMIN"); // 368_001_360_u32

/// can modify current debt rate in ReserveData of asset that is protocol stablecoin
pub const STABLECOIN_RATE_ADMIN: RoleType =
    ink::selector_id!("STABLECOIN_RATE_ADMIN"); // 2_742_621_032

/// can pause/unpause freeze/unfreeze reserves
pub const EMERGENCY_ADMIN: RoleType = ink::selector_id!("EMERGENCY_ADMIN"); // 297_099_943_u32

/// can assign all the roles
pub const ROLE_ADMIN: RoleType = 0; // 0

/// can withdraw protocol income
pub const TREASURY: RoleType = ink::selector_id!("TREASURY"); // 2_434_241_257_u32
