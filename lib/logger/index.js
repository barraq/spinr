import proxy from '../global';
import FORMATTERS from './formatters';
import LEVELS, { verbosity } from './levels';

const INSTANCE = Symbol.for('spinr@global');

class Logger {
  constructor() {
    this.verbosity = LEVELS.NOTICE;

    FORMATTERS.forEach((formatter) => {
      this[formatter.name] = (...args) => {
        if (this.verbosity > verbosity(formatter.level)) {
          return;
        } else if (formatter.handler) {
          proxy[formatter.handler](...args);
          return;
        }

        const [message, options] = args;
        const aside = formatter.aside(options);
        proxy[formatter.output].write(`${aside ? `${aside} ` : ''}${message}\n`);
      };
    });
  }

  set verbosity(name) {
    this.level = verbosity(name);
  }

  get verbosity() {
    return this.level;
  }
}

// Export as singleton
export default (() => {
  let logger = global[INSTANCE];

  if (!logger) {
    logger = global[INSTANCE] = new Logger();
  }

  return logger;
})();
