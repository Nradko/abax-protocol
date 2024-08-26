/* This file is auto-generated */
// @ts-nocheck

import type * as EventTypes from '../event-types/price_feed_provider';
import type {ContractPromise} from "@polkadot/api-contract";
import type {ApiPromise} from "@polkadot/api";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/price_feed_provider.json';
import {getEventTypeDescription} from "../shared/utils";
import {handleEventReturn} from "@c-forge/typechain-types";

export default class EventsClass {
	readonly __nativeContract : ContractPromise;
	readonly __api : ApiPromise;

	constructor(
		nativeContract : ContractPromise,
		api : ApiPromise,
	) {
		this.__nativeContract = nativeContract;
		this.__api = api;
	}

	public subscribeOnDepositEvent(callback : (event : EventTypes.Deposit) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x0fec3602811bce8ef519cedac639ad86e69ab2aec83956f393e7a7b1d59e27bc', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Deposit);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x0fec3602811bce8ef519cedac639ad86e69ab2aec83956f393e7a7b1d59e27bc');
	}

	public subscribeOnWithdrawEvent(callback : (event : EventTypes.Withdraw) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x9501416456eb96ab1e14aef68d4f7eb0d957c7c3a2c723f943ab3308429f4857', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Withdraw);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x9501416456eb96ab1e14aef68d4f7eb0d957c7c3a2c723f943ab3308429f4857');
	}

	public subscribeOnMarketRuleChosenEvent(callback : (event : EventTypes.MarketRuleChosen) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xc2f67a85fec07505f0a22d06212c1ba689ed73ba02ac2d8983e8b25dc5ffd889', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.MarketRuleChosen);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xc2f67a85fec07505f0a22d06212c1ba689ed73ba02ac2d8983e8b25dc5ffd889');
	}

	public subscribeOnCollateralSetEvent(callback : (event : EventTypes.CollateralSet) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x7406c0f2277b86f664d896a0104f866543c82958809fb0ccfa10c44d2babac1b', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.CollateralSet);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x7406c0f2277b86f664d896a0104f866543c82958809fb0ccfa10c44d2babac1b');
	}

	public subscribeOnBorrowEvent(callback : (event : EventTypes.Borrow) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x68b9109b885e8a8edf4f3944e10c50bb2fc2148a57d290d552c994f93e86c384', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Borrow);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x68b9109b885e8a8edf4f3944e10c50bb2fc2148a57d290d552c994f93e86c384');
	}

	public subscribeOnRepayEvent(callback : (event : EventTypes.Repay) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xcb7684ef3f1c086b7fce47dd8911c325780102a9aec8be9cd4e65db62aa795e4', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Repay);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xcb7684ef3f1c086b7fce47dd8911c325780102a9aec8be9cd4e65db62aa795e4');
	}

	public subscribeOnFlashLoanEvent(callback : (event : EventTypes.FlashLoan) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x4a0f52b5eeff44e7c1be269a52410bb70377ac9d6747005cbdf7fd9245eac878', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.FlashLoan);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x4a0f52b5eeff44e7c1be269a52410bb70377ac9d6747005cbdf7fd9245eac878');
	}

	public subscribeOnLiquidationEvent(callback : (event : EventTypes.Liquidation) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x76ba462a55808954755f62e0d6e94466af36b39ef9edb4bea8d9e83bd72c38e6', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Liquidation);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x76ba462a55808954755f62e0d6e94466af36b39ef9edb4bea8d9e83bd72c38e6');
	}

	public subscribeOnInterestsAccumulatedEvent(callback : (event : EventTypes.InterestsAccumulated) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x9768a96ba816d5c186373d34d7571df094f74c6cecd38c6f06d35f9678a50ac0', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.InterestsAccumulated);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x9768a96ba816d5c186373d34d7571df094f74c6cecd38c6f06d35f9678a50ac0');
	}

	public subscribeOnAssetRegisteredEvent(callback : (event : EventTypes.AssetRegistered) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xdfdfdad540d764eb76ee8217018a03f6350f2c1a122ef93252371103d4f6b580', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.AssetRegistered);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xdfdfdad540d764eb76ee8217018a03f6350f2c1a122ef93252371103d4f6b580');
	}

	public subscribeOnPriceFeedProviderChangedEvent(callback : (event : EventTypes.PriceFeedProviderChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x43f92bb52801afce6a6190a96b5ef40283fce331461dcb6ca0811ab14da05751', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.PriceFeedProviderChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x43f92bb52801afce6a6190a96b5ef40283fce331461dcb6ca0811ab14da05751');
	}

	public subscribeOnFeeReductionChangedEvent(callback : (event : EventTypes.FeeReductionChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x0f1163fa6f83624da54bab4b3bc63527e9332d8694fd8f21edb4db3f562886a3', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.FeeReductionChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x0f1163fa6f83624da54bab4b3bc63527e9332d8694fd8f21edb4db3f562886a3');
	}

	public subscribeOnFlashLoanFeeChangedEvent(callback : (event : EventTypes.FlashLoanFeeChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x7ae8c2bb5c69af2484d1217a620b4f0ade84e5a0d2c6857501f71dd974a82ba4', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.FlashLoanFeeChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x7ae8c2bb5c69af2484d1217a620b4f0ade84e5a0d2c6857501f71dd974a82ba4');
	}

	public subscribeOnReserveActivatedEvent(callback : (event : EventTypes.ReserveActivated) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x8293e9a17d04a3b9d2ed8bfdeef09bafd31239028a6f5fa6d7b45262e8b1cad9', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.ReserveActivated);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x8293e9a17d04a3b9d2ed8bfdeef09bafd31239028a6f5fa6d7b45262e8b1cad9');
	}

	public subscribeOnReserveFrozenEvent(callback : (event : EventTypes.ReserveFrozen) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x1ee11acc50b9c7c436cb8106f806cf35faf5067f048a3069866862f79181ee9e', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.ReserveFrozen);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x1ee11acc50b9c7c436cb8106f806cf35faf5067f048a3069866862f79181ee9e');
	}

	public subscribeOnReserveInterestRateModelChangedEvent(callback : (event : EventTypes.ReserveInterestRateModelChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xb62ddd071d599731e66a725322b7529cb31ceeeaab0c94d9072f9d4926e95489', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.ReserveInterestRateModelChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xb62ddd071d599731e66a725322b7529cb31ceeeaab0c94d9072f9d4926e95489');
	}

	public subscribeOnReserveRestrictionsChangedEvent(callback : (event : EventTypes.ReserveRestrictionsChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xcb01d574ecfb3a85c06261a438bfceb4eb22b1e7e337994e63e857df2e003d0b', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.ReserveRestrictionsChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xcb01d574ecfb3a85c06261a438bfceb4eb22b1e7e337994e63e857df2e003d0b');
	}

	public subscribeOnReserveFeesChangedEvent(callback : (event : EventTypes.ReserveFeesChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x846d17a1ea55292cbbd707fac313f6d1c807c7c3653c3b56858e913a6668f065', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.ReserveFeesChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x846d17a1ea55292cbbd707fac313f6d1c807c7c3653c3b56858e913a6668f065');
	}

	public subscribeOnAssetRulesChangedEvent(callback : (event : EventTypes.AssetRulesChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x10dca875b9227d850bd11cb568b83b87cc968c08054efd454dcf3363a8dfb388', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.AssetRulesChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x10dca875b9227d850bd11cb568b83b87cc968c08054efd454dcf3363a8dfb388');
	}

	public subscribeOnIncomeTakenEvent(callback : (event : EventTypes.IncomeTaken) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xa7766c3f17f457a0b8d61ed60e6e42c15783cdd5e741c7540e788ffddadf4ed0', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.IncomeTaken);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xa7766c3f17f457a0b8d61ed60e6e42c15783cdd5e741c7540e788ffddadf4ed0');
	}

	public subscribeOnStablecoinDebtRateChangedEvent(callback : (event : EventTypes.StablecoinDebtRateChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x4fde6d40bee7fd565c8e00072d605f588ed45a773a363365b8a433f641e54785', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.StablecoinDebtRateChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x4fde6d40bee7fd565c8e00072d605f588ed45a773a363365b8a433f641e54785');
	}

	public subscribeOnOwnershipTransferredEvent(callback : (event : EventTypes.OwnershipTransferred) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x5c626481ee232181dcfad24632520cc98608b23ed971378c0ad4504cab1b78c9', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.OwnershipTransferred);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x5c626481ee232181dcfad24632520cc98608b23ed971378c0ad4504cab1b78c9');
	}

	public subscribeOnTransferEvent(callback : (event : EventTypes.Transfer) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xb5b61a3e6a21a16be4f044b517c28ac692492f73c5bfd3f60178ad98c767f4cb', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Transfer);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xb5b61a3e6a21a16be4f044b517c28ac692492f73c5bfd3f60178ad98c767f4cb');
	}

	public subscribeOnApprovalEvent(callback : (event : EventTypes.Approval) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x1a35e726f5feffda199144f6097b2ba23713e549bfcbe090c0981e3bcdfbcc1d', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Approval);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x1a35e726f5feffda199144f6097b2ba23713e549bfcbe090c0981e3bcdfbcc1d');
	}

	public subscribeOnRoleAdminChangedEvent(callback : (event : EventTypes.RoleAdminChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xde670cace683976bfdc92b54b661961802f8322e8cead41fd76e5d7ca65dc403', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.RoleAdminChanged);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xde670cace683976bfdc92b54b661961802f8322e8cead41fd76e5d7ca65dc403');
	}

	public subscribeOnRoleGrantedEvent(callback : (event : EventTypes.RoleGranted) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x4178b665aa7310f609a3da6698348eabe212f3b0bd0386791eeae4924095b76b', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.RoleGranted);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x4178b665aa7310f609a3da6698348eabe212f3b0bd0386791eeae4924095b76b');
	}

	public subscribeOnRoleRevokedEvent(callback : (event : EventTypes.RoleRevoked) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x00d57dbcb9a54f822039e86efe3513a9af40deb0e6a9ee6cecf39824f8d27e9b', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.RoleRevoked);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x00d57dbcb9a54f822039e86efe3513a9af40deb0e6a9ee6cecf39824f8d27e9b');
	}

	public subscribeOnPausedEvent(callback : (event : EventTypes.Paused) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0xcb560a184d13b48ac1ecc804d19fa57a64ef4facd0819dcac22a969c20fec081', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Paused);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0xcb560a184d13b48ac1ecc804d19fa57a64ef4facd0819dcac22a969c20fec081');
	}

	public subscribeOnUnpausedEvent(callback : (event : EventTypes.Unpaused) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('0x29f037cd7cf467977af6c1d02a3c4ab9c868bb6ce539c0d87ea507d594709d41', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Unpaused);
		};
		return this.__subscribeOnEvent(callbackWrapper, (signatureTopic : string) => signatureTopic === '0x29f037cd7cf467977af6c1d02a3c4ab9c868bb6ce539c0d87ea507d594709d41');
	}

private __subscribeOnEvent(
		callback : (args: any[], event: any) => void,
		filter : (signatureTopic: string) => boolean = () => true
	) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return this.__api.query.system.events((events) => {
			events.forEach((record: any) => {
				const { event } = record;

				if (event.method === 'ContractEmitted') {
					const [address, data] = record.event.data;

					if (address.toString() === this.__nativeContract.address.toString()) {
						const decodeResult = this.__nativeContract
							.abi
							.events[(this.__nativeContract.abi.json as any).spec.events
							.findIndex((e: any) => e.signature_topic === record.topics[0].toString())].fromU8a(data);

						if (filter(decodeResult.event.signatureTopic.toString()))
							callback(decodeResult.args, decodeResult.event);
					}
				}
			});
		});
	}
}