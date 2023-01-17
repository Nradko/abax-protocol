import BN from 'bn.js';
import { AnyAbacusContractEvent } from 'typechain/events/enum';
import { AnyAbacusContract } from './misc';

export type ValidateEventParameters = { eventName: string; event: AnyAbacusContractEvent; sourceContract: AnyAbacusContract; timestamp: number };
