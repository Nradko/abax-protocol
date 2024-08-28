cargo publish --manifest-path src/library/Cargo.toml --keep-going
sleep 30
cargo publish --manifest-path src/contract_modules/Cargo.toml --keep-going
