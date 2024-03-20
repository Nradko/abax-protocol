use ink::storage::Mapping;
use pendzl::traits::AccountId;

#[derive(Default, Debug)]
#[pendzl::storage_item]
pub struct AccountRegistrar {
    pub counter_to_user: Mapping<u128, AccountId>,
    pub user_to_counter: Mapping<AccountId, u128>,
    pub next_counter: u128,
}

impl AccountRegistrar {
    pub fn ensure_registered(&mut self, account: &AccountId) {
        if self.user_to_counter.contains(account) {
            return;
        }
        let counter = self.next_counter;
        self.counter_to_user.insert(counter, account);
        self.user_to_counter.insert(account, &counter);
        self.next_counter = counter.checked_add(1).unwrap();
    }
}
