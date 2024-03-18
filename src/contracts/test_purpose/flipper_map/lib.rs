#![cfg_attr(not(feature = "std"), no_std, no_main)]

use pendzl::traits::Balance;
/// stores data of user
#[derive(Debug, Default, scale::Encode, scale::Decode, Clone, Copy)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct UserReserveData {
    /// underlying asset amount of deposit plus accumulated interest.
    pub deposit: Balance,
    /// underlying asset amount of debt plus accumulated interest.
    pub debt: Balance,
    /// index that is used to accumulate deposit interest.
    pub applied_deposit_index_e18: u128,
    /// index that is used to accumulate debt interest.
    pub applied_debt_index_e18: u128,
}

#[ink::contract]
mod flipper_map {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    use crate::UserReserveData;

    #[ink(storage)]
    #[derive(Default)]
    pub struct Flipper {
        total_assets_count: u32,
        user_storage: Mapping<(u32, AccountId), UserReserveData>,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(total_assets_count: u32) -> Self {
            let mut instance: Flipper = Default::default();
            instance.total_assets_count = total_assets_count;
            instance
        }

        #[ink(message)]
        pub fn add_user_data(&mut self, asset_id: u32) {
            let mut user_data = UserReserveData::default();
            user_data.applied_deposit_index_e18 = 1000;
            self.user_storage
                .insert((asset_id, self.env().caller()), &user_data);
        }

        #[ink(message)]
        pub fn get_user_data(&self, asset_id: u32) -> UserReserveData {
            self.user_storage
                .get((asset_id, self.env().caller()))
                .unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_all_user_datas(
            &self,
            account: AccountId,
        ) -> Vec<Option<UserReserveData>> {
            let mut user_datas = Vec::new();
            for i in 0..self.total_assets_count {
                match self.user_storage.get((i, account)) {
                    Some(user_data) => user_datas.push(Some(user_data)),
                    None => user_datas.push(None),
                }
            }
            user_datas
        }

        #[ink(message)]
        pub fn mutate_single_at(&mut self, asset_id: u32) {
            let mut user_data = self
                .user_storage
                .get((asset_id, self.env().caller()))
                .unwrap();
            user_data.deposit = user_data.deposit.checked_add(1).unwrap();
            user_data.debt = user_data.debt.checked_add(1).unwrap();

            self.user_storage
                .insert((asset_id, self.env().caller()), &user_data);
        }

        #[ink(message)]
        pub fn mutate_all(&mut self) {
            for i in 0..self.total_assets_count {
                let mut user_data =
                    self.user_storage.get((i, self.env().caller())).unwrap();
                user_data.deposit = user_data.deposit.checked_add(1).unwrap();
                user_data.debt = user_data.debt.checked_add(1).unwrap();

                self.user_storage
                    .insert((i, self.env().caller()), &user_data);
            }
        }
    }
}
