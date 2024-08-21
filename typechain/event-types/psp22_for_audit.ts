import BN from "bn.js";
import type * as ReturnTypes from '../types-returns/psp22_for_audit';

export interface RoleAdminChanged {
	role: BN;
	previous: BN;
	new: BN;
}

export interface RoleGranted {
	role: BN;
	grantee: ReturnTypes.AccountId | null;
	grantor: ReturnTypes.AccountId | null;
}

export interface RoleRevoked {
	role: BN;
	account: ReturnTypes.AccountId | null;
	sender: ReturnTypes.AccountId;
}

export interface Transfer {
	from: ReturnTypes.AccountId | null;
	to: ReturnTypes.AccountId | null;
	value: BN;
}

export interface Approval {
	owner: ReturnTypes.AccountId;
	spender: ReturnTypes.AccountId;
	value: BN;
}

export interface OwnershipTransferred {
	new: ReturnTypes.AccountId | null;
}

export interface Paused {
	account: ReturnTypes.AccountId;
}

export interface Unpaused {
	account: ReturnTypes.AccountId;
}


