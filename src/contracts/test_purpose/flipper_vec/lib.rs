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
mod flipper_vec {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    use crate::UserReserveData;

    #[ink(storage)]
    #[derive(Default)]
    pub struct Flipper {
        total_assets_count: u32,
        user_storage: Mapping<AccountId, Vec<Option<UserReserveData>>>,
    }

    impl Flipper {
        #[ink(constructor)]
        pub fn new(total_assets_count: u32) -> Self {
            let mut instance: Flipper = Default::default();
            instance.total_assets_count = total_assets_count;
            instance
        }

        fn get_default_user_datas(&self) -> Vec<Option<UserReserveData>> {
            (0..self.total_assets_count).map(|_| None).collect()
        }

        #[ink(message)]
        pub fn add_user_data(&mut self, asset_id: u32) {
            let mut user_datas = self
                .user_storage
                .get(self.env().caller())
                .unwrap_or(self.get_default_user_datas());

            let mut user_data = UserReserveData::default();
            user_data.applied_deposit_index_e18 = 1000;

            user_datas[asset_id as usize] = Some(user_data);

            self.user_storage.insert(self.env().caller(), &user_datas);
        }

        #[ink(message)]
        pub fn get_user_data(&self, asset_id: u32) -> UserReserveData {
            let user_datas = self
                .user_storage
                .get(self.env().caller())
                .unwrap_or_default();

            match user_datas[asset_id as usize] {
                Some(user_data) => user_data,
                None => UserReserveData::default(),
            }
        }

        #[ink(message)]
        pub fn get_all_user_datas(
            &self,
            account: AccountId,
        ) -> Vec<Option<UserReserveData>> {
            self.user_storage.get(account).unwrap_or_default()
        }

        #[ink(message)]
        pub fn mutate_single_at(&mut self, asset_id: u32) {
            let mut user_datas =
                self.user_storage.get(self.env().caller()).unwrap();
            let mut user_data =
                user_datas[asset_id as usize].unwrap_or_default();
            user_data.deposit = user_data.deposit.checked_add(1).unwrap();
            user_data.debt = user_data.debt.checked_add(1).unwrap();

            user_datas[asset_id as usize] = Some(user_data);

            self.user_storage.insert(self.env().caller(), &user_datas);
        }

        #[ink(message)]
        pub fn mutate_all(&mut self) {
            let mut user_datas =
                self.user_storage.get(self.env().caller()).unwrap();
            for i in 0..self.total_assets_count {
                let mut user_data = user_datas[i as usize].unwrap_or_default();
                user_data.deposit = user_data.deposit.checked_add(1).unwrap();
                user_data.debt = user_data.debt.checked_add(1).unwrap();

                user_datas[i as usize] = Some(user_data);
            }

            self.user_storage.insert(self.env().caller(), &user_datas);
        }
    }
}
