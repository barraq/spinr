import {
  isAbsolute,
  join as joinPath,
} from 'path';
import fs from 'fs';

export function loadBabelConfigFrom(path, relative = process.cwd()) {
  const absPath = isAbsolute(path) ? path : joinPath(relative, path);
  const resource = JSON.parse(fs.readFileSync(absPath, 'utf8'));

  return resource.babel ? resource.babel : resource;
}

export function isFunction(thing) {
  return thing !== undefined &&
         thing !== null &&
         typeof thing === 'function';
}

export function isStream(thing) {
  return thing !== undefined &&
         thing !== null &&
         typeof thing === 'object' &&
         typeof thing.pipe === 'function';
}

export function timestamp(options = { date: new Date() }) {
  return options.date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

export function promisify(callback, options = {}) {
  return (...args) => new Promise((resolve, reject) => {
    try {
      const ctx = options.context || this;
      callback.apply(ctx, [...args, (err, res) => {
        if (err) {
          reject(err);
        }

        resolve(res);
      }]);
    } catch (e) {
      reject(e);
    }
  });
}

export class Timer {
  constructor() {
    this.start();
    this.stop();
  }

  start() {
    this.startTime = Date.now();
    return this;
  }

  stop() {
    this.stopTime = Date.now();
    return this;
  }

  getTotalTime() {
    return this.stopTime - this.startTime;
  }

  getTotalTimeInSec() {
    return (this.getTotalTime() / 1000).toFixed(2);
  }
}

export default {
  loadBabelConfigFrom,
  isFunction,
  isStream,
  timestamp,
  promisify,
  Timer,
};
