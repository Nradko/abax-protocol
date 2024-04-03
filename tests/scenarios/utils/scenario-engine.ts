import { TestEnv } from './make-suite';
import { mint, approve, deposit, borrow, withdraw, repay, setUseAsCollateral, increaseAllowance } from './actions';
import { KeyringPair } from '@polkadot/keyring/types';

export interface Action {
  name: string;
  args?: any;
  expected: string;
  revertMessage?: string;
}
export interface Story {
  description: string;
  actions: Action[];
}

export interface Scenario {
  title: string;
  description: string;
  stories: Story[];
  skipRegenerateEnvBeforeEach?: boolean;
}

export const executeStory = async (story: Story, testEnv: TestEnv) => {
  for (const [index, action] of story.actions.entries()) {
    const { accounts } = testEnv;
    if (process.env.DEBUG) console.log(`[${index + 1}/${story.actions.length}] Executing ${action.name} ${JSON.stringify(action.args)}`);
    await executeAction(action, accounts, testEnv);
  }
};

// eslint-disable-next-line complexity
const executeAction = async (action: Action, accounts: KeyringPair[], testEnv: TestEnv) => {
  const { reserve, account: accountIndex, borrowRateMode, onBehalfOf: onBehalfOfIndex } = action.args;
  const { name, expected, revertMessage } = action;
  ensureNotEmpty(name, reserve, accountIndex, expected);

  const account = accounts[parseInt(accountIndex)];
  if (!account) throw `Account of index ${accountIndex} does not exist!`;

  const onBehalfOf = onBehalfOfIndex ? accounts[parseInt(onBehalfOfIndex)] : account;
  if (!onBehalfOf) throw `Account of index ${onBehalfOfIndex} does not exist!`;
  switch (name) {
    case 'mint': {
      const { amount } = action.args;

      if (!amount || amount === '') {
        throw `Invalid amount of ${reserve} to mint`;
      }

      await mint(testEnv.reserves[reserve].underlying, amount, account);
      break;
    }
    case 'approve': {
      await approve(reserve, account, testEnv);
      break;
    }
    case 'deposit': {
      const { amount } = action.args;

      if (!amount || amount === '') {
        throw `Invalid amount to deposit into the ${reserve} reserve`;
      }

      await deposit(reserve, amount, account, onBehalfOf, expected, testEnv, revertMessage);
      break;
    }
    case 'withdraw':
      {
        const { amount } = action.args;

        if (amount === '' || amount === undefined) {
          throw `Invalid amount to withdraw from the ${reserve} reserve`;
        }

        await withdraw(reserve, amount, account, onBehalfOf, expected, testEnv, revertMessage);
      }
      break;
    case 'borrow': {
      const { amount } = action.args;

      if (!amount || amount === '') {
        throw `Invalid amount to borrow from the ${reserve} reserve`;
      }

      await borrow(reserve, amount, account, onBehalfOf, expected, testEnv, revertMessage);
      break;
    }
    case 'repay': {
      const { amount, sendValue } = action.args;

      if (amount === '' || amount === undefined) {
        throw `Invalid amount to repay into the ${reserve} reserve`;
      }

      await repay(reserve, amount, account, onBehalfOf, expected, testEnv, revertMessage);
      break;
    }

    case 'setUseAsCollateral': {
      const { useAsCollateral } = action.args;

      if (!useAsCollateral || useAsCollateral === '') {
        throw `A valid value for useAsCollateral needs to be set when calling setUseReserveAsCollateral on reserve ${reserve}`;
      }
      await setUseAsCollateral(reserve, account, useAsCollateral, expected, testEnv, revertMessage);
      break;
    }
    case 'increaseAllowance': {
      const { targetAccount: targetAccountIndex, amount, lendingToken } = action.args;
      const targetAccount = accounts[targetAccountIndex];
      await increaseAllowance(reserve, account, targetAccount, amount, testEnv, lendingToken);
      break;
    }
    default:
      throw `Invalid action requested: ${name}`;
  }
};
const ensureNotEmpty = (name: string, reserve: any, accountIndex: any, expected: string) => {
  if (!name || name === '') {
    throw 'Action name is missing';
  }
  if (!reserve || reserve === '') {
    throw 'Invalid reserve selected for deposit';
  }
  if (!accountIndex || accountIndex === '') {
    throw `Invalid account selected to deposit into the ${reserve} reserve`;
  }

  if (!expected || expected === '') {
    throw `An expected resut for action ${name} is required`;
  }
};
