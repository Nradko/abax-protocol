use ink::prelude::string::String;
use num_traits::{FromPrimitive, NumCast, ToPrimitive};
use pendzl::traits::Timestamp;

use super::rand::Rand;
pub fn assert<T>(x1: u128, x2: u128, del_x: T, identifier: String)
where
    T: FromPrimitive + ToPrimitive,
{
    let del = <i128 as NumCast>::from(del_x).unwrap_or_default();
    if del as i128 >= 0 {
        assert!(
            x1 + del as u128 == x2
                || x1 + del as u128 + 1 == x2
                || x1 + del as u128 == x2 + 1,
            "{} | x1: {}, x2: {}, del : {}",
            identifier,
            x1,
            x2,
            del,
        )
    } else {
        assert!(
            x1 as u128 == x2 + (-del) as u128
                || x1 as u128 + 1 == x2 + (-del) as u128
                || x1 == x2 + (-del) as u128 + 1,
            "{} | x1: {}, x2: {}, del : {}",
            identifier,
            x1,
            x2,
            del,
        )
    };
}

pub fn assert_timestamp(
    t1: Timestamp,
    t2: Timestamp,
    del_t: Timestamp,
    identifier: String,
) {
    assert_eq!(
        t1 + del_t,
        t2,
        "{} | t1: {}, t2: {}, del_t : {}",
        identifier,
        t1,
        t2,
        del_t
    )
}

pub fn random_u128(from: u128, to: u128) -> u128 {
    let mut rng = Rand::new(0);
    rng.rand_range(from, to)
}
