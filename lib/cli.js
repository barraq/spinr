import tildify from 'tildify';
import chalk from 'chalk';
import subdir from 'subdir';
import Liftoff from 'liftoff';

import logger from './logger';
import pkg from '../package.json';
import { loadBabelConfigFrom } from './helpers';

const options = require('yargs')
  .version(pkg.version)
  .usage('\nUsage: spin [options] <tasks ...>')
  .example('spin clean build test', 'Run commands in sequence')
  .example('spin -p clean+build lint', 'Run clean & build in sequence, and lint in parallel')
  .option('spinfile', {
    describe: 'Alternative spinfile to use',
    type: 'string',
  })
  .option('tasks', {
    boolean: true,
    describe: 'Display available tasks',
  })
  .option('parallel', {
    alias: 'p',
    boolean: true,
    describe: 'Run in parallel mode',
  })
  .option('babel', {
    default: true,
    boolean: true,
    describe: 'Enable babel',
  })
  .option('babelrc', {
    type: 'string',
    nargs: 1,
    describe: 'Babel resource file',
  })
  .option('silent', {
    boolean: true,
    describe: 'Disable all logging',
  })
  .option('verboe', {
    alias: 'debug',
    boolean: true,
    describe: 'Enable all logging',
  })
  .option('info', {
    boolean: true,
    describe: 'Display contextual information',
  })
  .option('verbosity', {
    choices: ['all', 'error', 'warn', 'notice', 'info', 'none'],
    default: 'notice',
  })
  .help('h')
  .alias('h', 'help')
  .epilog('For more information visite https://spinr.github.io')
  .argv;

if (options.silent) {
  logger.verbosity = 'none';
} else if (options.verbose || options.debug || options.info) {
  logger.verbosity = 'all';
} else {
  logger.verbosity = options.verbosity;
}

if (options.babelrc) {
  // Register custom babel configuration
  const babelrc = loadBabelConfigFrom(options.babelrc);
  require('babel-register')(Object.assign(babelrc, {
    ignore: name => !subdir(process.cwd(), name) || /node_modules/.test(name),
  }));
} else if (options.babel === true) {
  // Register spinr babel configuration
  require('babel-register')(Object.assign(pkg.babel, {
    ignore: name => !subdir(process.cwd(), name) || /node_modules/.test(name),
  }));
}

['uncaughtException', 'unhandledRejection'].forEach((event) => {
  process.on(event, (error) => {
    logger.error(error);
    if (error.stack) logger.error(error.stack, { aside: false });
    process.exit(1);
  });
});

const cli = new Liftoff({
  name: 'spinr',
  configName: 'spinfile',
});

// Lets spin!
cli.launch({
  cwd: options.cwd,
  configPath: options.spinfile,
  verbose: options.verbose,
}, async (env) => {
  if (options.debug || options.info) {
    logger.info('=== Spinr context ===');
    logger.log('CLI OPTIONS:', process.argv);
    logger.log('CWD:', env.cwd);
    logger.log('LOCAL MODULES PRELOADED:', env.require);
    logger.log('SEARCHING FOR:', env.configNameRegex);
    logger.log('FOUND CONFIG AT:', env.configPath);
    logger.log('CONFIG BASE DIR:', env.configBase);
    logger.log('YOUR LOCAL MODULE IS LOCATED:', env.modulePath);
    logger.log('LOCAL PACKAGE.JSON:', env.modulePackage);
    logger.log('CLI PACKAGE.JSON', pkg);
  }

  if (options.info) process.exit(0);

  if (options.version && options.tasks.length === 0) {
    logger.log('CLI version', pkg.version);
    if (env.modulePackage && typeof env.modulePackage.version !== 'undefined') {
      logger.log('Local version', env.modulePackage.version);
    }
    process.exit(0);
  }

  if (!env.configPath) {
    logger.error(`no ${cli.configName} found.`);
    process.exit(1);
  } else {
    logger.log('Using spinfile', chalk.magenta(tildify(env.configPath)));
  }

  const spinfile = require(env.configPath);

  if (options.tasks) {
    logger.log(`Tasks for ${chalk.magenta(env.configPath)}`);
    Object.keys(spinfile).forEach(task => logger.log('-', task));
    process.exit(0);
  }

  if (!env.modulePath) {
    logger.error(`Local spinr not found in: ${tildify(env.cwd)}`);
    process.exit(1);
  }

  const spin = require(env.modulePath);
  await spin.runner(spinfile, options);
});
