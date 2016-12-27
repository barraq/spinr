import logger from './logger';
import { load } from './loader';
import { Timer } from './helpers';

export async function run(task, options) {
  const timer = new Timer();

  logger.time(`Starting '${task.name}'...`);
  const result = await task.run(options);
  logger.time(`Finished '${task.name}' in ${timer.stop().getTotalTimeInSec()}s`);

  return result;
}

export async function runner(spinfile, argv) {
  async function sequence(tasks) {
    return tasks.reduce(
      (last, name) => last.then(() => load(name, spinfile).then(task => run(task, { ...argv }))),
      Promise.resolve(),
    );
  }

  async function parallel(tasks) {
    await Promise.all(tasks.map(async (name) => {
      if (name.indexOf('+')) {
        await sequence(name.split('+'));
      } else {
        const task = await load(name, spinfile);
        await run(task, { ...argv });
      }
    }));
  }

  const tasks = argv._ || [];
  if (tasks.length === 0) {
    tasks[0] = 'default';
  }

  const timer = new Timer();
  if (argv.p || argv.parallel) {
    await parallel(tasks);
  } else {
    await sequence(tasks);
  }

  logger.log(`✨  Done in ${timer.stop().getTotalTimeInSec()}s`);
}

export default {
  runner,
};
