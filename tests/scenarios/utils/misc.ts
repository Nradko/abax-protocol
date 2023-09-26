import { handleEventReturn, ReturnNumber } from '@727-ventures/typechain-types';
import { E18, E6 } from '@abaxfinance/utils';
import { VoidFn } from '@polkadot/api/types';
import { apiProviderWrapper } from 'tests/setup/helpers';
import AToken from 'typechain/contracts/a_token';
import LendingPool from 'typechain/contracts/lending_pool';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import VToken from 'typechain/contracts/v_token';
import { AnyAbaxContractEvent, ContractsEvents } from 'typechain/events/enum';
import { getEventTypeDescription } from 'typechain/shared/utils';
import { ReserveData, ReserveParameters, UserReserveData } from 'typechain/types-returns/lending_pool';
import BlockTimestampProvider from '../../../typechain/contracts/block_timestamp_provider';
import { TestEnv } from './make-suite';

export const getLineSeparator = () => '='.repeat(process.stdout.columns ?? 60);

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
export type AnyAbaxContract = LendingPool | VToken | AToken | PSP22Emitable;

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
              api.query.timestamp.now().then((timestamp) => {
                try {
                  // console.table({ eventName: eventDecoded.event.identifier.toString(), timestamp: timestamp.toString() });

                  const _event: Record<string, any> = {};
                  for (let i = 0; i < eventDecoded.args.length; i++) {
                    _event[eventDecoded.event.args[i].name] = eventDecoded.args[i].toJSON();
                  }

                  const eventParsed = handleEventReturn(
                    _event,
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    getEventTypeDescription(eventName, require(`typechain/event-data/${contract.name}.json`)),
                  ) as TEvent;
                  const timestampParsed = parseInt(timestamp.toString());
                  cb(eventParsed, timestampParsed);
                } catch (e) {
                  console.error('Fatal error during processing events from api.query.system.events', 'api.query.timestamp.now', e);
                }
              });
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
    // console.log('callbackDecorator', { eventName, event, emitingContract, timestamp });
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

export const getReserveParametersDefaultObj = (): ReserveParameters => {
  return {
    interestRateModel: [
      new ReturnNumber(300000000000),
      new ReturnNumber(500000000000),
      new ReturnNumber(2000000000000),
      new ReturnNumber(4000000000000),
      new ReturnNumber(10000000000000),
      new ReturnNumber(100000000000000),
      new ReturnNumber(300000000000000),
    ],
    incomeForSuppliersPartE6: new ReturnNumber(E6),
  };
};

export const getReserveDefaultObj = (): ReserveData => {
  return {
    activated: true,
    freezed: false,
    totalDeposit: new ReturnNumber(0),
    currentSupplyRateE24: new ReturnNumber(E18),
    totalDebt: new ReturnNumber(0),
    currentDebtRateE24: new ReturnNumber(E18),
    indexesUpdateTimestamp: 0,
  };
};

export const getUserReserveDataDefaultObj = (): UserReserveData => {
  return {
    deposit: new ReturnNumber(0),
    debt: new ReturnNumber(0),
    appliedCumulativeSupplyIndexE18: new ReturnNumber(0),
    appliedCumulativeDebtIndexE18: new ReturnNumber(0),
  };
};
