# GENERAL

1. Prepend scripts with `env WS_ENDPOINT='wss://ws.test.azero.dev' SEED='<TEST ACCOUNT SEED PHRASE HERE>'` to let script connect to correct endpoint & sign transactions as an account.
   Example: `env WS_ENDPOINT='wss://ws.test.azero.dev' SEED='candy maple cake sugar pudding cream honey rich smooth crumble sweet treat' npx tsx scripts/borrowAsset.ts`

1. Most scripts are configurable via constants set at the top of the file

## Scripts

### `deployforAudit.ts`

Usage: `env WS_ENDPOINT='wss://ws.test.azero.dev' SEED='<TEST ACCOUNT SEED PHRASE HERE>' npx tsx scripts/deployforAudit.ts`

Deploys a complete set of contracts (lending pool, price feed provider, periphery, all of the asset contracts), registers & sets up everything.
Market definitions - inline
Asset definitions - at the top of the file
Sets admin to `CUSTOM_ADMIN` (line 98)

### `deployAssetAndRegisterInMarketRule.ts`

Usage: `env WS_ENDPOINT='wss://ws.test.azero.dev' SEED='<TEST ACCOUNT SEED PHRASE HERE>' npx tsx scripts/deployAssetAndRegisterInMarketRule.ts`

Deploys an additional asset and registers it in the market rule.
See comments about configurability.

Before use configure variables at the top of the file.

### `mintPSP22ToAcccountsAndGiveAllowance.ts`

Usage: `env WS_ENDPOINT='wss://ws.test.azero.dev' SEED='<TEST ACCOUNT SEED PHRASE HERE>' npx tsx scripts/mintPSP22ToAcccountsAndGiveAllowance.ts`

Mints PSP22 tokens to accounts and gives allowance to the lending pool equal to the amount minted (FIY - using an exposed internal approve method).

Before use configure variables at the top of the file.

### `depositAsset.ts`

Usage: `env WS_ENDPOINT='wss://ws.test.azero.dev' SEED='<TEST ACCOUNT SEED PHRASE HERE>' npx tsx scripts/depositAsset.ts`

Deposits asset with args defined at the top of the file - configure before use.

### `borrowAsset.ts`

Usage: `env WS_ENDPOINT='wss://ws.test.azero.dev' SEED='<TEST ACCOUNT SEED PHRASE HERE>' npx tsx scripts/borrowAsset.ts`

Borrows asset with args defined at the top of the file - configure before use.
