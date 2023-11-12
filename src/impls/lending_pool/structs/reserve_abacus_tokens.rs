use crate::traits::lending_pool::structs::reserve_abacus_tokens::*;

impl ReserveAbacusTokens {
    pub fn new(
        a_token_address: &AccountId,
        v_token_address: &AccountId,
    ) -> Self {
        ReserveAbacusTokens {
            a_token_address: *a_token_address,
            v_token_address: *v_token_address,
        }
    }
}
