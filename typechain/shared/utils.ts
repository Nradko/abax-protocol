import type { ContractPromise } from '@polkadot/api-contract';
import { type EventDataTypeDescriptions, handleEventReturn } from '@c-forge/typechain-types';
import type { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
export const getContractObject = <T>(
  constructor: new (address: string, signer: KeyringPair, api: ApiPromise) => T,
  contractAddress: string,
  signerPair: KeyringPair,
  api: ApiPromise,
) => new constructor(contractAddress, signerPair, api);
export const getContractObjectWrapper = <T>(
  api: ApiPromise,
  constructor: new (address: string, signer: KeyringPair, apiP: ApiPromise) => T,
  contractAddress: string,
  signerPair: KeyringPair,
) => getContractObject(constructor, contractAddress, signerPair, api);

export function getTypeDescription(id: number | string, types: any): any {
  return types[id];
}

export function getEventTypeDescription(name: string, types: any): any {
  return types[name];
}

export function decodeEvents(events: any[], contract: ContractPromise, types: EventDataTypeDescriptions): any[] {
  return events
    .filter((record: any) => {
      const { event } = record;

      const [address] = record.event.data;

      return event.method === 'ContractEmitted' && address.toString() === contract.address.toString();
    })
    .map((record: any) => {
      const [address, data] = record.event.data;
      const signatureTopic = record.topics[0].toString();

      const { args, event } =
        contract.abi.events[(contract.abi.json as any).spec.events.findIndex((e: any) => e.signature_topic === signatureTopic)]!.fromU8a(data);

      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      handleEventReturn(_event, getEventTypeDescription(signatureTopic, types));

      return {
        name: event.identifier.toString(),
        args: _event,
      };
    });
}

export function decodeEventsLegacy(events: any[], contract: ContractPromise, types: EventDataTypeDescriptions): any[] {
  return events
    .filter((record: any) => {
      const { event } = record;

      const [address] = record.event.data;

      return event.method === 'ContractEmitted' && address.toString() === contract.address.toString();
    })
    .map((record: any) => {
      const { args, event } = contract.abi.decodeEvent(record);

      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      handleEventReturn(_event, getEventTypeDescription(event.identifier.toString(), types));

      return {
        name: event.identifier.toString(),
        args: _event,
      };
    });
}
