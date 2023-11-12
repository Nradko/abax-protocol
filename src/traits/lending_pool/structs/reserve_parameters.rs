use scale::{Decode, Encode};

#[derive(Debug, Encode, Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveParameters {
    /// delta interest per millisecond for utilizations (50%, 60%, 70%, 80%, 90%, 95%, 100%).
    pub interest_rate_model: [u128; 7],
    /// part of interest paid by borrowers that is redistributed to the suppliers. 10^6 = 100%.
    pub income_for_suppliers_part_e6: u128,
}
