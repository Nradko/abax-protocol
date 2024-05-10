use pendzl::{math::errors::MathError, traits::Timestamp};

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct TwIndex {
    pub index: u32,
    pub tail: u32,
}

impl TwIndex {
    pub fn new() -> Self {
        TwIndex {
            index: 0,
            tail: 4000,
        }
    }

    pub fn next(&self) -> Result<Self, MathError> {
        let index = self
            .index
            .overflowing_add(1)
            .0
            .checked_rem(self.tail)
            .ok_or(MathError::DivByZero)?;
        Ok(TwIndex {
            index,
            tail: self.tail,
        })
    }

    pub fn prev(&self) -> Self {
        let index = if self.index == 0 {
            self.tail.saturating_sub(1)
        } else {
            self.index.saturating_sub(1)
        };
        TwIndex {
            index,
            tail: self.tail,
        }
    }
}

#[derive(Debug, Default, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct TwEntry {
    pub timestamp: Timestamp,
    pub accumulator: u64,
}
