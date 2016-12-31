import {
  loadBabelConfigFrom,
  isFunction,
  isStream,
  timestamp,
  promisify,
  Timer,
} from '../../lib/helpers';

const pkg = './spec/fixture/babel/package.json';
const babelrc = './spec/fixture/babel/babelrc';

describe('helpers', () => {
  describe(loadBabelConfigFrom.name, () => {
    it('Loads configuration from package.json', () => {
      expect(loadBabelConfigFrom(pkg).custom).toBe(true);
    });

    it('Loads configuration from babelrc', () => {
      expect(loadBabelConfigFrom(babelrc).custom).toBe(true);
    });
  });

  describe(isFunction.name, () => {
    it('matches a function', () => {
      function fn() {}
      expect(isFunction(fn)).toBeTruthy();
    });

    it('does not match a string', () => {
      expect(isFunction('fn')).toBeFalsy();
    });

    it('does not match a promise', () => {
      const promise = new Promise(() => {});
      expect(isFunction(promise)).toBeFalsy();
    });

    it('does not match undefined', () => {
      expect(isFunction(undefined)).toBeFalsy();
    });
  });

  describe(isStream.name, () => {
    it('matches a stream', () => {
      const stream = new (require('stream').Readable)();
      expect(isStream(stream)).toBeTruthy();
    });

    it('does not match a string', () => {
      expect(isStream('fn')).toBeFalsy();
    });

    it('does not match a promise', () => {
      const promise = new Promise(() => {});
      expect(isStream(promise)).toBeFalsy();
    });

    it('does not match undefined', () => {
      expect(isStream(undefined)).toBeFalsy();
    });
  });

  describe(timestamp.name, () => {
    let toTimeString;

    beforeEach(() => {
      toTimeString = global.Date.prototype.toTimeString;
      global.Date.prototype.toTimeString = jest.genMockFunction().mockReturnValue('11:49:17 GMT+0100 (CET)');
    });

    it('returns correct timestamp for default date', () => {
      expect(timestamp()).toEqual('11:49:17');
    });

    it('returns correct timestamp for custom date', () => {
      expect(timestamp({ date: new Date() })).toEqual('11:49:17');
    });

    afterEach(() => {
      global.Date.prototype.toTimeString = toTimeString;
    });
  });

  describe('promesify', () => {
    it('wraps function with callback around promise', async () => {
      function task(done) { done(null, true); }
      const result = await promisify(task)();
      expect(result).toBeTruthy();
    });

    it('handles callback errors with reject', async () => {
      function task(done) { done(true); }
      try {
        await promisify(task)();
      } catch (object) {
        expect(object).toBeTruthy();
      }
    });

    it('handles callback exception with reject', async () => {
      function task() { throw new Error('failure'); }
      try {
        await promisify(task)();
      } catch (object) {
        expect(object.message).toEqual('failure');
      }
    });

    it('wraps function with params and callback around promise', async () => {
      function task(a, b, done) { done(null, [a, b]); }
      const result = await promisify(task)(1, 2);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('Timer', () => {
    const timer = new Timer();

    beforeEach(() => {
      timer.stopTime = 1482938088464;
      timer.startTime = 1482838088464;
    });

    it('returns total time', () => {
      expect(timer.getTotalTime()).toEqual(100000000);
    });

    it('returns total time in seconds', () => {
      expect(timer.getTotalTimeInSec()).toEqual('100000.00');
    });
  });
});
