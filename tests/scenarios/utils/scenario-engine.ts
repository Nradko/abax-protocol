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
    const { users } = testEnv;
    if (process.env.DEBUG) console.log(`[${index + 1}/${story.actions.length}] Executing ${action.name} ${JSON.stringify(action.args)}`);
    await executeAction(action, users, testEnv);
  }
};

// eslint-disable-next-line complexity
const executeAction = async (action: Action, users: KeyringPair[], testEnv: TestEnv) => {
  const { reserve, user: userIndex, borrowRateMode, onBehalfOf: onBehalfOfIndex } = action.args;
  const { name, expected, revertMessage } = action;
  ensureNotEmpty(name, reserve, userIndex, expected);

  const user = users[parseInt(userIndex)];
  if (!user) throw `User of index ${userIndex} does not exist!`;

  const onBehalfOf = onBehalfOfIndex ? users[parseInt(onBehalfOfIndex)] : user;
  if (!onBehalfOf) throw `User of index ${onBehalfOfIndex} does not exist!`;
  switch (name) {
    case 'mint': {
      const { amount } = action.args;

      if (!amount || amount === '') {
        throw `Invalid amount of ${reserve} to mint`;
      }

      await mint(testEnv.reserves[reserve].underlying, amount, user);
      break;
    }
    case 'approve': {
      await approve(reserve, user, testEnv);
      break;
    }
    case 'deposit': {
      const { amount } = action.args;

      if (!amount || amount === '') {
        throw `Invalid amount to deposit into the ${reserve} reserve`;
      }

      await deposit(reserve, amount, user, onBehalfOf, expected, testEnv, revertMessage);
      break;
    }
    case 'withdraw':
      {
        const { amount } = action.args;

        if (amount === '' || amount === undefined) {
          throw `Invalid amount to withdraw from the ${reserve} reserve`;
        }

        await withdraw(reserve, amount, user, onBehalfOf, expected, testEnv, revertMessage);
      }
      break;
    case 'borrow': {
      const { amount } = action.args;

      if (!amount || amount === '') {
        throw `Invalid amount to borrow from the ${reserve} reserve`;
      }

      await borrow(reserve, amount, user, onBehalfOf, expected, testEnv, revertMessage);
      break;
    }
    case 'repay': {
      const { amount, sendValue } = action.args;

      if (amount === '' || amount === undefined) {
        throw `Invalid amount to repay into the ${reserve} reserve`;
      }

      await repay(reserve, amount, user, onBehalfOf, expected, testEnv, revertMessage);
      break;
    }

    case 'setUseAsCollateral': {
      const { useAsCollateral } = action.args;

      if (!useAsCollateral || useAsCollateral === '') {
        throw `A valid value for useAsCollateral needs to be set when calling setUseReserveAsCollateral on reserve ${reserve}`;
      }
      await setUseAsCollateral(reserve, user, useAsCollateral, expected, testEnv, revertMessage);
      break;
    }
    case 'increaseAllowance': {
      const { targetUser: targetUserIndex, amount, lendingToken } = action.args;
      const targetUser = users[targetUserIndex];
      await increaseAllowance(reserve, user, targetUser, amount, testEnv, lendingToken);
      break;
    }
    default:
      throw `Invalid action requested: ${name}`;
  }
};
const ensureNotEmpty = (name: string, reserve: any, userIndex: any, expected: string) => {
  if (!name || name === '') {
    throw 'Action name is missing';
  }
  if (!reserve || reserve === '') {
    throw 'Invalid reserve selected for deposit';
  }
  if (!userIndex || userIndex === '') {
    throw `Invalid user selected to deposit into the ${reserve} reserve`;
  }

  if (!expected || expected === '') {
    throw `An expected resut for action ${name} is required`;
  }
};
