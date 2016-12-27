import streamToPromise from 'stream-to-promise';
import { isFunction, isStream, promisify } from './helpers';

function wrap(task) {
  return {
    name: task.name,
    run: async (options) => {
      // Handle task with callback
      if (task.length === 2) {
        return promisify(task)(options);
      }

      // Handle task with both async and promise
      const result = await task(options);

      // Handle task with stream
      if (isStream(result)) {
        return streamToPromise(result);
      }

      return result;
    },
  };
}

export async function load(name, spinfile) {
  const task = spinfile[name];

  if (isFunction(task)) {
    return Promise.resolve(wrap(task));
  }

  return Promise.reject(`Task '${name}' not found.`);
}

export default {
  load,
};
