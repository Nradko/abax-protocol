import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { makeSuite } from './utils/make-suite';
import { executeStory, Scenario } from './utils/scenario-engine';
import { apiProviderWrapper } from 'tests/setup/helpers';

const scenarioFolder = path.join(__dirname, 'stories');

const selectedFiles: string[] = []; //['deposit'];
const selectedScenarios: string[] = []; //['User 1 deposits 100 DAI on behalf of user 2, user 1 tries to borrow 0.1 WETH on behalf of user 2 (no allowance given)'];
const skipScenarios = false;
const forceOnlyScenarios = false;

const forceItOnly = forceOnlyScenarios || selectedFiles.length > 0 || selectedScenarios.length > 0;
fs.readdirSync(scenarioFolder).forEach((file) => {
  if (selectedFiles.length > 0 && !selectedFiles.map((n) => n.replace('.json', '')).includes(file.replace('.json', ''))) return;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const scenario = require(`${__dirname}/stories/${file.replace('.json', '')}.json`) as Scenario;

  (skipScenarios ? makeSuite.skip : forceItOnly ? makeSuite.only : makeSuite)(
    `${scenario.skipRegenerateEnvBeforeEach ?? `[STORY]`} ${scenario.title}`,
    async (getTestEnv) => {
      const scenariosToRun =
        selectedScenarios.length === 0 ? scenario.stories : scenario.stories.filter((s) => selectedScenarios.indexOf(s.description) !== -1);
      for (const [index, story] of scenariosToRun.entries()) {
        it(`${!scenario.skipRegenerateEnvBeforeEach ? `[STORY]` : '[STEP]'} ${story.description}`, async () => {
          // throw 'error';
          // Retry the test scenarios up to 4 times if an error happens
          // this.retries(4);
          // if (story.setup) {
          //   if (process.env.DEBUG) {
          //     console.log(LINE_SEPARATOR);
          //     console.log('Executing setup...');
          //   }
          //   await executeStory(story.setup, getTestEnv());
          //   if (process.env.DEBUG) {
          //     console.log('Executing setup...');
          //   }
          // }
          if (process.env.DEBUG) console.log(chalk.bgGreen(`[${index + 1}/${scenario.stories.length}] Executing story "${story.description}"`));
          await apiProviderWrapper.getAndWaitForReady();
          await executeStory(story, getTestEnv());
        });
      }
    },
    scenario.skipRegenerateEnvBeforeEach ?? false,
  );
});
