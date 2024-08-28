#!/bin/bash

root_dir=$(pwd)


cargo_toml_locations=(
    "$root_dir/src/contracts/periphery/balance_viewer/Cargo.toml",
    "$root_dir/src/contracts/core/a_token/Cargo.toml",
    "$root_dir/src/contracts/core/v_token/Cargo.toml",
    "$root_dir/src/contracts/core/stable_token/Cargo.toml",
    "$root_dir/src/contracts/core/lending_pool/Cargo.toml",
    "$root_dir/src/contracts/core/price_feed_provider/Cargo.toml",
    "$root_dir/src/contracts/test_purpose/dia_oracle/Cargo.toml",
    "$root_dir/src/contracts/test_purpose/fee_reduction_provider_mock/Cargo.toml",
    "$root_dir/src/contracts/test_purpose/flash_loan_receiver_mock/Cargo.toml",
    "$root_dir/src/contracts/test_purpose/test_psp22/Cargo.toml",
    "$root_dir/src/contracts/test_purpose/test_reserves_minter/Cargo.tomlr"
)

for cargo_toml in "${cargo_toml_locations[@]}"
do
    cd $(dirname $cargo_toml)
    python3 "$root_dir/convert.py" --manifest Cargo.toml > subscan_verify.json
    cd $root_dir
done

