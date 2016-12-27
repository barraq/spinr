import chalk from 'chalk';
import { isFunction, timestamp } from './helpers';

const INSTANCE = Symbol.for('spinr@global');

const LEVELS = Object.freeze({
  none: Infinity,
  error: 5,
  notice: 4,
  warn: 3,
  info: 2,
  all: 1,
});

const FORMATTERS = [
  /* eslint-disable no-console */
  { name: 'log', handler: console.log },
  /* eslint-enable no-console */
  { name: 'info', output: process.stdout, format: chalk.blue },
  { name: 'warn', output: process.stderr, format: chalk.cyan },
  { name: 'error', output: process.stderr, format: chalk.red },
  {
    name: 'time',
    output: process.stdout,
    format: chalk.bold,
    aside: option => `[${timestamp(option)}]`,
    level: LEVELS.notice,
  },
];

function asideFrom(formatter, options) {
  if (options.aside !== undefined) {
    return options.aside;
  } else if (isFunction(formatter.aside)) {
    return formatter.aside(options);
  } else if (formatter.aside === false) {
    return false;
  }

  return formatter.name;
}

function verbosityFrom(formatter) {
  if (formatter.level) {
    return formatter.level;
  }

  return LEVELS[formatter.name] || LEVELS.notice;
}

function write(message, formatter, verbosity, options = {}) {
  const aside = asideFrom(formatter, options);
  const level = verbosityFrom(formatter);

  if (level >= verbosity) {
    formatter.output.write(`${aside ? `${formatter.format(aside)} ` : ''}${message}\n`);
  }
}

class Logger {
  constructor() {
    this.level = LEVELS.notice;
    FORMATTERS.forEach((formatter) => {
      this[formatter.name] = formatter.handler || ((message, options) => {
        write(message, formatter, this.verbosity, options);
      });
    });
  }

  set verbosity(name) {
    this.level = LEVELS[name] || LEVELS.notice;
  }

  get verbosity() {
    return this.level;
  }
}

// Export a singleton
export default (() => {
  let logger = global[INSTANCE];

  if (!logger) {
    logger = global[INSTANCE] = new Logger();
  }

  return logger;
})();
