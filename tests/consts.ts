import BN from 'bn.js';

export enum LendingToken {
  AToken = 'AToken',
  VToken = 'VToken',
}
export const ONE_YEAR = new BN(365 * 24 * 60 * 60 * 1000);

export const MINTER = 4_254_773_782;
export const BURNER = 1_711_057_910;

export const ROLES = {
  ROLE_ADMIN: 0,
  ASSET_LISTING_ADMIN: 1094072439,
  PARAMETERS_ADMIN: 368001360,
  STABLECOIN_RATE_ADMIN: 2742621032,
  EMERGENCY_ADMIN: 297099943,
  TREASURY: 2434241257,
} as const;
export const ROLE_NAMES = Object.keys(ROLES) as (keyof typeof ROLES)[];

export const MAX_U128 = '340282366920938463463374607431768211455';
