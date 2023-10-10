// import { ApiPromise } from '@polkadot/api';
// import { KeyringPair } from '@polkadot/keyring/types';
// import LendingPoolV0ATokenFacet from 'typechain/contracts/lending_pool_v0_a_token_interface_facet';
// import LendingPoolV0BorrowFacet from 'typechain/contracts/lending_pool_v0_borrow_facet';
// import LendingPoolV0DepositFacet from 'typechain/contracts/lending_pool_v0_deposit_facet';
// import LendingPoolV0FlashFacet from 'typechain/contracts/lending_pool_v0_flash_facet';
// import LendingPoolV0InitializeFacet from 'typechain/contracts/lending_pool_v0_initialize_facet';
// import LendingPoolV0LiquidateFacet from 'typechain/contracts/lending_pool_v0_liquidate_facet';
// import LendingPoolV0MantainFacet from 'typechain/contracts/lending_pool_v0_maintain_facet';
// import LendingPoolV0MangeFacet from 'typechain/contracts/lending_pool_v0_manage_facet';
// import LendingPoolV0ViewFacet from 'typechain/contracts/lending_pool_v0_view_facet';
// import LendingPoolV0VTokenInterfaceFacet from 'typechain/contracts/lending_pool_v0_v_token_interface_facet';

// export class LPFacetAdapter {
//   static readonly contractName: string = 'lending_pool_facet_adapter';
//   readonly address: string;
//   readonly signer: KeyringPair;
//   private nativeAPI: ApiPromise;

//   /**
// 	 * @constructor

// 	 * @param address - The address of the contract.
// 	 * @param signer - The signer to use for signing transactions.
// 	 * @param nativeAPI - The API instance to use for queries.
// 	*/
//   constructor(address: string, signer: KeyringPair, nativeAPI: ApiPromise) {
//     this.address = address;
//     this.nativeAPI = nativeAPI;
//     this.signer = signer;
//   }

//   getAllFacets() {
//     return [
//       new LendingPoolV0ATokenFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0BorrowFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0DepositFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0FlashFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0InitializeFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0LiquidateFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0MantainFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0MangeFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0ViewFacet(this.address, this.signer, this.nativeAPI),
//       new LendingPoolV0VTokenInterfaceFacet(this.address, this.signer, this.nativeAPI),
//     ];
//   }

//   getAllFacetNames() {
//     return this.getAllFacets().map((c) => c.name);
//   }

//   asV0ATokenFacet() {
//     return new LendingPoolV0ATokenFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0BorrowFacet() {
//     return new LendingPoolV0BorrowFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0DepositFacet() {
//     return new LendingPoolV0DepositFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0FlashFacet() {
//     return new LendingPoolV0FlashFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0InitializeFacet() {
//     return new LendingPoolV0InitializeFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0LiquidateFacet() {
//     return new LendingPoolV0LiquidateFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0MantainFacet() {
//     return new LendingPoolV0MantainFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0MangeFacet() {
//     return new LendingPoolV0MangeFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0ViewFacet() {
//     return new LendingPoolV0ViewFacet(this.address, this.signer, this.nativeAPI);
//   }
//   asV0VTokenInterfaceFacet() {
//     return new LendingPoolV0VTokenInterfaceFacet(this.address, this.signer, this.nativeAPI);
//   }
// }
