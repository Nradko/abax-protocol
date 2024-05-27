/* This file is auto-generated */
// @ts-nocheck

import type * as EventTypes from '../event-types/test_reserves_minter';
import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/test_reserves_minter.json';
import { getEventTypeDescription } from '../shared/utils';
import { handleEventReturn } from '@c-forge/typechain-types';

export default class EventsClass {
  readonly __nativeContract: ContractPromise;
  readonly __api: ApiPromise;

  constructor(nativeContract: ContractPromise, api: ApiPromise) {
    this.__nativeContract = nativeContract;
    this.__api = api;
  }

  public subscribeOnRoleAdminChangedEvent(callback: (event: EventTypes.RoleAdminChanged) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0xde670cace683976bfdc92b54b661961802f8322e8cead41fd76e5d7ca65dc403', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.RoleAdminChanged,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'RoleAdminChanged');
  }

  public subscribeOnRoleGrantedEvent(callback: (event: EventTypes.RoleGranted) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0x4178b665aa7310f609a3da6698348eabe212f3b0bd0386791eeae4924095b76b', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.RoleGranted,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'RoleGranted');
  }

  public subscribeOnRoleRevokedEvent(callback: (event: EventTypes.RoleRevoked) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0x00d57dbcb9a54f822039e86efe3513a9af40deb0e6a9ee6cecf39824f8d27e9b', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.RoleRevoked,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'RoleRevoked');
  }

  public subscribeOnOwnershipTransferredEvent(callback: (event: EventTypes.OwnershipTransferred) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0x5c626481ee232181dcfad24632520cc98608b23ed971378c0ad4504cab1b78c9', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.OwnershipTransferred,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'OwnershipTransferred');
  }

  public subscribeOnTransferEvent(callback: (event: EventTypes.Transfer) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0xb5b61a3e6a21a16be4f044b517c28ac692492f73c5bfd3f60178ad98c767f4cb', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.Transfer,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'Transfer');
  }

  public subscribeOnApprovalEvent(callback: (event: EventTypes.Approval) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0x1a35e726f5feffda199144f6097b2ba23713e549bfcbe090c0981e3bcdfbcc1d', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.Approval,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'Approval');
  }

  public subscribeOnPausedEvent(callback: (event: EventTypes.Paused) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0xcb560a184d13b48ac1ecc804d19fa57a64ef4facd0819dcac22a969c20fec081', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.Paused,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'Paused');
  }

  public subscribeOnUnpausedEvent(callback: (event: EventTypes.Unpaused) => void) {
    const callbackWrapper = (args: any[], event: any) => {
      const _event: Record<string, any> = {};

      for (let i = 0; i < args.length; i++) {
        _event[event.args[i]!.name] = args[i]!.toJSON();
      }

      callback(
        handleEventReturn(
          _event,
          getEventTypeDescription('0x29f037cd7cf467977af6c1d02a3c4ab9c868bb6ce539c0d87ea507d594709d41', EVENT_DATA_TYPE_DESCRIPTIONS),
        ) as EventTypes.Unpaused,
      );
    };

    return this.__subscribeOnEvent(callbackWrapper, (eventName: string) => eventName === 'Unpaused');
  }

  private __subscribeOnEvent(callback: (args: any[], event: any) => void, filter: (eventName: string) => boolean = () => true) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.__api.query.system.events((events) => {
      events.forEach((record: any) => {
        const { event } = record;

        if (event.method === 'ContractEmitted') {
          const [address, data] = record.event.data;

          if (address.toString() === this.__nativeContract.address.toString()) {
            const decodeResult =
              this.__nativeContract.abi.events[
                (this.__nativeContract.abi.json as any).spec.events.findIndex((e: any) => e.signature_topic === record.topics[0].toString())
              ].fromU8a(data);

            if (filter(decodeResult.event.identifier.toString())) callback(decodeResult.args, decodeResult.event);
          }
        }
      });
    });
  }
}
