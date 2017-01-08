/**
 * This export global used by spinr to
 * ease testing, e.g. with jest.mock
 */
module.exports = {
  log: global.console.log,
  stdout: global.process.stdout,
  stderr: global.process.stderr,
};
