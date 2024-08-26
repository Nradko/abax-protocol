// SPDX-License-Identifier: BUSL-1.1
use pendzl::traits::Timestamp;

const TW_INDEX_SIZE: u32 = 60;

#[cfg(build = "release")]
const TW_INDEX_SIZE: u32 = 3600 * 8;

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
/// An index in cyclic group of size `tail`
pub struct TwIndex {
    pub value: u32,
}

impl TwIndex {
    pub fn new() -> Self {
        TwIndex { value: 0 }
    }

    pub fn next(&self) -> Self {
        let index = self
            .value
            .overflowing_add(1)
            .0
            .checked_rem(TW_INDEX_SIZE)
            .unwrap();
        TwIndex { value: index }
    }
}

#[derive(
    Debug, Default, PartialEq, Eq, scale::Encode, scale::Decode, Clone, Copy,
)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
/// A timestamped entry in the TW accumulator
pub struct TwEntry {
    pub timestamp: Timestamp,
    pub accumulator: u64,
}
