import BN from 'bn.js';

export enum RateMode {
  None = '0',
  Stable = '1',
  Variable = '2',
}

export enum LendingToken {
  AToken = 'AToken',
  VToken = 'VToken',
}
export const ONE_YEAR = new BN(365 * 24 * 60 * 60 * 1000);

export const MINTER = 4254773782;

export const ROLE_NAMES = [
  'ROLE_ADMIN',
  'GLOBAL_ADMIN',
  'ASSET_LISTING_ADMIN',
  'PARAMETERS_ADMIN',
  'STABLECOIN_RATE_ADMIN',
  'EMERGENCY_ADMIN',
  'FLASH_BORROWER',
  'TREASURY',
] as const;

export const ROLES: Record<(typeof ROLE_NAMES)[number], number> = {
  ROLE_ADMIN: 0,
  GLOBAL_ADMIN: 2459877095,
  ASSET_LISTING_ADMIN: 1094072439,
  PARAMETERS_ADMIN: 368001360,
  STABLECOIN_RATE_ADMIN: 2742621032,
  EMERGENCY_ADMIN: 297099943,
  FLASH_BORROWER: 1112475474,
  TREASURY: 2434241257,
};

// export const ROLE_ADMIN = 0;
// export const FLASH_BORROWER = 1112475474;
// export const ASSET_LISTING_ADMIN = 1094072439;
// export const PARAMETERS_ADMIN = 368001360;
// export const EMERGENCY_ADMIN = 297099943;
// export const GLOBAL_ADMIN = 2459877095;
// export const TREASURY = 2434241257;
// export const STABLECOIN_RATE_ADMIN = 2742621032;

export const MAX_U128 = '340282366920938463463374607431768211455';
