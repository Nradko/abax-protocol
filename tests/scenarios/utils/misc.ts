import { handleEventReturn, ReturnNumber } from '@727-ventures/typechain-types';
import { E18, E6 } from '@abaxfinance/utils';
import { AbiEvent } from '@polkadot/api-contract/types';
import { VoidFn } from '@polkadot/api/types';
import { apiProviderWrapper } from 'tests/setup/helpers';
import AToken from 'typechain/contracts/a_token';
import LendingPool from 'typechain/contracts/lending_pool';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import SToken from 'typechain/contracts/s_token';
import VToken from 'typechain/contracts/v_token';
import { AnyAbaxContractEvent, ContractsEvents } from 'typechain/events/enum';
import { getEventTypeDescription } from 'typechain/shared/utils';
import { ReserveData, UserReserveData } from 'typechain/types-returns/lending_pool';
import BlockTimestampProvider from '../../../typechain/contracts/block_timestamp_provider';
import { TestEnv } from './make-suite';
import { Psp22Ownable } from '@abaxfinance/contract-helpers';
import { customHandleReturnType } from 'scripts/typechain/query';

export const LINE_SEPARATOR = '='.repeat(process.stdout.columns);

async function printTimestamp() {
  const timestamp = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
  console.log({ timestamp: timestamp.toString() });
  return timestamp;
}
export const advanceBlockTimestamp = async function (timestampProvider: BlockTimestampProvider, forwardTime: number) {
  await timestampProvider.tx.setShouldReturnMockValue(true);
  const { value } = await timestampProvider.query.getBlockTimestamp();
  await timestampProvider.tx.setBlockTimestamp(value.unwrap() + forwardTime);
};

export const createEnumChecker = <T extends string, TEnumValue extends string>(enumVariable: { [key in T]: TEnumValue }) => {
  const enumValues = Object.values(enumVariable);
  return (value: string): value is TEnumValue => enumValues.includes(value);
};
export type AnyAbaxContractEventEnumLiteral<T extends AnyAbaxContractEvent> = `${T}`;
export type AnyAbaxContract = LendingPool | VToken | AToken | SToken | PSP22Emitable;

const subscribeOnEvent = async <TEvent extends AnyAbaxContractEventEnumLiteral<AnyAbaxContractEvent>>(
  contract: AnyAbaxContract,
  eventName: string,
  cb: (event: TEvent, timestamp: number) => void,
) => {
  const api = await apiProviderWrapper.getAndWaitForReady();
  // @ts-ignore
  return api.query.system.events((events) => {
    try {
      for (const record of events) {
        const { event } = record;

        if (event.method === 'ContractEmitted') {
          const [address, data] = record.event.data;

          if (address.toString() === contract.address.toString()) {
            const eventDecoded = contract.abi.decodeEvent(data);

            if (eventDecoded.event.identifier.toString() === eventName) {
              // api.query.timestamp.now().then((timestamp) => {

              // });
              const timestamp = 0;
              console.table({ eventName: eventDecoded.event.identifier.toString(), timestamp: timestamp.toString() });

              const _event: Record<string, any> = {};
              for (let i = 0; i < eventDecoded.args.length; i++) {
                _event[eventDecoded.event.args[i].name] = eventDecoded.args[i].toJSON();
              }

              // const eventParsed = customHandleReturnType(_event, getEventTypeDescription(eventName, contract.name)) as TEvent; // TODO contract.name => EVENT_DATA_TYPE_DESCRIPTIONS
              const eventParsed = customHandleReturnType(_event, getEventTypeDescription(eventName, contract.name)) as TEvent;
              const timestampParsed = parseInt(timestamp.toString());
              cb(eventParsed, timestampParsed);
            }
          }
        }
      }
    } catch (e) {
      console.error('Fatal error during processing events from api.query.system.events', e);
    }
  });
};

export const subscribeOnEvents = async (
  testEnv: TestEnv,
  reserveName: string,
  callback: (eventName: string, event: AnyAbaxContractEvent, emitingContract: AnyAbaxContract, timestamp: number) => void,
): Promise<VoidFn[]> => {
  const { lendingPool, reserves } = testEnv;
  const reserve = reserves[reserveName];

  const subscribePromises: Promise<any>[] = [];
  const callbackDecorator = (eventName: string, emitingContract: AnyAbaxContract) => (event: AnyAbaxContractEvent, timestamp: number) => {
    console.log('callbackDecorator', { eventName, event, emitingContract, timestamp });
    return callback(eventName, event, emitingContract, timestamp);
  };

  for (const event of Object.values(ContractsEvents.LendingPoolEvent)) {
    subscribePromises.push(subscribeOnEvent(lendingPool, event, callbackDecorator(event, lendingPool)));
  }
  for (const event of Object.values(ContractsEvents.VTokenEvent)) {
    subscribePromises.push(subscribeOnEvent(reserve.vToken, event, callbackDecorator(event, reserve.vToken)));
  }
  for (const event of Object.values(ContractsEvents.ATokenEvent)) {
    subscribePromises.push(subscribeOnEvent(reserve.aToken, event, callbackDecorator(event, reserve.aToken)));
  }

  return Promise.all(subscribePromises);
};

export const getReserveDefaultObj = (): ReserveData => {
  return {
    id: -1,
    activated: true,
    freezed: false,
    decimals: new ReturnNumber(10000000),
    interestRateModel: [
      new ReturnNumber(300000000000),
      new ReturnNumber(500000000000),
      new ReturnNumber(2000000000000),
      new ReturnNumber(4000000000000),
      new ReturnNumber(10000000000000),
      new ReturnNumber(100000000000000),
      new ReturnNumber(300000000000000),
    ],
    maximalTotalSupply: null,
    maximalTotalDebt: null,
    incomeForSuppliersPartE6: new ReturnNumber(E6),
    minimalCollateral: new ReturnNumber(0),
    minimalDebt: new ReturnNumber(0),
    flashLoanFeeE6: new ReturnNumber(0),
    tokenPriceE8: null,
    totalSupplied: new ReturnNumber(0),
    cumulativeSupplyRateIndexE18: new ReturnNumber(E18),
    currentSupplyRateE24: new ReturnNumber(0),
    totalDebt: new ReturnNumber(0),
    cumulativeDebtRateIndexE18: new ReturnNumber(E18),
    currentDebtRateE24: new ReturnNumber(0),
    indexesUpdateTimestamp: 0,
    aTokenAddress: '',
    vTokenAddress: '',
  };
};

export const getUserReserveDataDefaultObj = (): UserReserveData => {
  return {
    supplied: new ReturnNumber(0),
    debt: new ReturnNumber(0),
    appliedCumulativeSupplyRateIndexE18: new ReturnNumber(0),
    appliedCumulativeDebtRateIndexE18: new ReturnNumber(0),
  };
};
