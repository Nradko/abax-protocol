use pendzl::traits::Balance;

use crate::traits::lending_pool::structs::reserve_restrictions::ReserveRestrictions;

impl ReserveRestrictions {
    pub fn new(
        maximal_total_deposit: &Option<Balance>,
        maximal_total_debt: &Option<Balance>,
        minimal_collateral: &Balance,
        minimal_debt: &Balance,
    ) -> Self {
        ReserveRestrictions {
            maximal_total_deposit: *maximal_total_deposit,
            maximal_total_debt: *maximal_total_debt,
            minimal_collateral: *minimal_collateral,
            minimal_debt: *minimal_debt,
        }
    }
}
