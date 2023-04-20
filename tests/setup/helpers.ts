import { createTestKeyring } from '@polkadot/keyring/testing';
import { KeyringPair } from '@polkadot/keyring/types';
import { ApiProviderWrapper } from './ApiProviderWrapper';

export const apiProviderWrapper = new ApiProviderWrapper(process.env.WS_ENDPOINT ?? 'ws://127.0.0.1:9944');
export const getSigners = () => {
  return createTestKeyring({ type: 'sr25519' }).pairs;
};
export const getSignersWithoutOwner = (signers: KeyringPair[], ownerIndex: number) => [
  ...signers.slice(0, ownerIndex),
  ...signers.slice(ownerIndex + 1),
];
export function converSignerToAddress(signer?: KeyringPair | string): string {
  if (!signer) return '';
  return typeof signer !== 'string' ? signer.address : signer;
}

//   export async function getRandomSigner(
//     env: RuntimeEnvironment,
//     from?: Signer | string,
//     amount?: BN | number | string | bigint
//   ): Promise<Signer> {
//     await env.network.api.isReady;
//     const api = env.network.api;
//     const mnemonic = mnemonicGenerate();
//     const keyringPair = env.network.keyring.addFromUri(mnemonic);
//     (keyringPair as LocalKeyringPair).suri = mnemonic;

//     const newAccount = env.network.createSigner(keyringPair);

//     log.info(`Generate random signer: ${chalk.cyan(keyringPair.address)}`);
//     log.info(`Mnemonic: ${chalk.cyan(mnemonic)}`);

//     const fromAddress = converSignerToAddress(from);

//     if (fromAddress && amount) {
//       try {
//         await buildTx(
//           api.registry,
//           api.tx.balances.transfer(keyringPair.address, amount),
//           fromAddress
//         );
//       } catch (error) {
//         log.error(`Transfer failed`);
//         log.error(error.error);
//         throw error;
//       }

//       log.info(
//         `Transfer ${chalk.yellow(amount.toString())} from ${chalk.cyan(
//           fromAddress
//         )} to ${chalk.cyan(keyringPair.address)}`
//       );

//       return newAccount;
//     }

//     return newAccount;
//   }
