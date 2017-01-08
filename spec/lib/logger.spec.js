import stripAnsi from 'strip-ansi';

import proxy from '../../lib/global';
import FORMATTERS from '../../lib/logger/formatters';
import LEVELS, { verbosity } from '../../lib/logger/levels';

const levels = ['none', 'error', 'warn', 'notice', 'info', 'all'];

jest.mock('../../lib/global', () => ({
  stdout: {
    write: jest.fn(),
  },
  stderr: {
    write: jest.fn(),
  },
  log: jest.fn(),
}));

function mockFor(formatter) {
  if (formatter.handler) {
    return proxy[formatter.handler];
  }

  return proxy[formatter.output].write;
}

describe('LEVELS', () => {
  levels.forEach((name) => {
    it(`has level '${name}'`, () => {
      expect(LEVELS.for(name)).toBe(Symbol.for(name));
    });
  });

  it('throws error for unknown level', () => {
    expect(() => LEVELS.for('unknown')).toThrow();
  });

  levels.slice(1).forEach((name, index) => {
    it(`has verbosity for '${levels[index]}' greather than verbosity for '${name}'`, () => {
      expect(verbosity(levels[index])).toBeGreaterThan(verbosity(name));
    });
  });
});

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = require('../../lib/logger').default;
  });

  levels.forEach((level) => {
    describe(`with verbosity '${level}'`, () => {
      beforeEach(() => {
        logger.verbosity = level;
      });

      FORMATTERS.forEach((formatter) => {
        describe(formatter.name, () => {
          if (verbosity(level) <= verbosity(formatter.level)) {
            it('outputs message', () => {
              logger[formatter.name]('message');
              expect(mockFor(formatter)).toHaveBeenCalledTimes(1);
            });
          } else {
            it('does not output message', () => {
              logger[formatter.name]('message');
              expect(mockFor(formatter)).not.toBeCalled();
            });
          }
        });
      });
    });
  });

  FORMATTERS.filter(formatter => formatter.output).forEach((formatter) => {
    describe(formatter.name, () => {
      beforeEach(() => {
        logger.verbosity = LEVELS.ALL;
      });

      describe('with custom aside', () => {
        it('output formatted message with aside', () => {
          logger[formatter.name]('message', { aside: 'aside' });
          expect(mockFor(formatter).mock.calls).toMatchSnapshot();
        });
      });

      describe('with aside set to false', () => {
        it('output message with aside', () => {
          logger[formatter.name]('message', { aside: false });
          expect(mockFor(formatter).mock.calls[0][0]).toEqual('message\n');
        });
      });
    });
  });

  FORMATTERS.filter(formatter => formatter.handler).forEach((formatter) => {
    describe(formatter.name, () => {
      beforeEach(() => {
        logger.verbosity = LEVELS.ALL;
      });

      describe('with custom aside', () => {
        it('output message with aside', () => {
          logger[formatter.name]('message', { aside: 'aside' });
          expect(stripAnsi(mockFor(formatter).mock.calls[0][0])).toEqual('message');
        });
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
