// SPDX-License-Identifier: BUSL-1.1
#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum PriceFeedError {
    /// The asset is not supported by the price feed.
    NoSuchAsset,
    /// The price feed is not available.
    NoPriceFeed,
}
