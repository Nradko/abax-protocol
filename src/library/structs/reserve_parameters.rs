/// Stores parameters used to calculate `current_debt_rate` and `current_deposit_rate`.
/// The Abax native stable tokens do not use it!
#[derive(Debug, Encode, Decode, Clone)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct ReserveParameters {
    /// delta interest per millisecond for utilizations (68%, 84%, 92%, 96%, 98%, 99%, 100%).
    pub interest_rate_model: [u128; 7],
    /// part of interest paid by borrowers that is redistributed to the suppliers. 10^6 = 100%.
    pub income_for_suppliers_part_e6: u128,
}
