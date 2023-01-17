import chalk from 'chalk';
import { TestEnv } from 'tests/scenarios/utils/make-suite';
import { executeStory, Scenario } from 'tests/scenarios/utils/scenario-engine';
import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { argvObj } from './compile/common';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const scenarioToRun = (args['scenario'] as string) ?? process.argv[2];
  const storyToRun = (args['story'] as string) ?? process.argv[3];
  if (!scenarioToRun) throw 'could not determine scenario to run';
  await apiProviderWrapper.getAndWaitForReady();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const scenario = require(`${__dirname}/../tests/scenarios/stories/${scenarioToRun.replace('.json', '')}.json`) as Scenario;

  const getTestEnv = async () => await deployAndConfigureSystem();
  const testEnv = scenario.skipRegenerateEnvBeforeEach ? await getTestEnv() : (null as unknown as TestEnv);

  console.log(`Executing scenario ${scenario.title} (${scenario.description})`);
  for (const [index, story] of scenario.stories.entries()) {
    if (storyToRun && story.description !== storyToRun) continue;

    console.log(chalk.bgGreen(`[${index + 1}/${scenario.stories.length}] Executing story "${story.description}"`));
    await executeStory(story, scenario.skipRegenerateEnvBeforeEach ? testEnv : await getTestEnv());
  }
  await (await apiProviderWrapper.getAndWaitForReady()).disconnect();
  process.exit(0);
})(argvObj).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
