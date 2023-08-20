use ink::primitives::AccountId;

pub const ZERO_ADDRESS: [u8; 32] = [255; 32];

/// The trait provides some useful methods for `AccountId` type.
pub trait AccountIdExt {
    fn is_zero(&self) -> bool;
}

impl AccountIdExt for AccountId {
    fn is_zero(&self) -> bool {
        self == &ZERO_ADDRESS.into()
    }
}
