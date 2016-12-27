# Spinr

[![Build](https://travis-ci.org/barraq/spinr.svg?branch=master)](https://travis-ci.org/barraq/spinr)
[![Coverage](https://coveralls.io/repos/github/barraq/spinr/badge.svg)](https://coveralls.io/github/barraq/spinr)

Minimalist task runner for [Node](https://nodejs.org/) that leverage the power of ES6 and ES7.

## Installation

``` shell
$ yarn add spinr
```

## Feature

- Leverage power of ES6 and ES7
- Run parallel, sequential tasks
- Support async, stream, promise, callback
- Easy extend with custom parameters
- Super easy to use

## Usage

1. Create a `spinfile.js` at the root of your project.
2. Export some functions from it, e.g. `export function build() { ... }`
3. Launch them using the CLI, e.g. `$ spin build`

Example `spinfile.js`:

``` javascript
import del from 'del';
import { rollup } from 'rollup';

// $ spin clean
export async function clean() {
  await del(['build']);
}

// $ spin build
export async function build() {
  await rollup({ /* options */}).then((bundle) => {
    return bundle.write(options);
  });
}

// $ spin deploy
export async function deploy() {
  await doTheDeploy();
}

// $ spin
export async default build;
```

Launch `clean` then `build`:

``` shell
$ spin clean build
```

Launch `clean` then `build` in parallel of `lint`:

``` shell
$ spin --parallel clean+build lint
```

## Documentation

- [Command Line Interface](#command-line-interface)
- [Task definition](#task-definition)
  - [Custom options](#custom-options)
  - [Task with Async](#task-with-async)
  - [Task with Promise](#task-with-promise)
  - [Task with Stream](#task-with-stream)
  - [Task with Callback](#task-with-callback)
- [Task orchestration](#task-orchestration)
  - [Sequential Orchestration](#sequential-orchestration)
  - [Parallel Orchestration](#parallel-orchestration)
  - [Hybrid Orchestration](#hybrid-orchestration)
- [Babel configuration](#babel-configuration)
  - [Run without Babel](#run-without-babel)
  - [Custom Babel Configuration](#custom-babel-configuration)

### Command Line Interface

Spinr uses the powerful [liftoff](https://github.com/js-cli/js-liftoff) command launcher together with [yargs](http://yargs.js.org) arguments parser.
The Command Line Interface (CLI) of Spinr is named `spin`.
An overview of the `spin` CLI options can be obtain by running:

``` shell
$ spin --help
```

### Task Definition

Spinr supports different task definition including: async/await, promise, stream and callback.
Tasks are defined as simple function in a `spinfile.js` file.
To be accessbile from Spinr, tasks must be exported.
The signature of a task is the following:

``` javascript
export function [name]([options[, callback]]) {
   statements
}
```

All tasks receive CLI options as argument.

#### Custom Options

Lets for instance have a basic `spinfile.js` with the following task:

``` javascript
export function say(options) {
  console.log(options.message);
}
```

You can launch `say` with the custom `message` option by doing:

``` shell
$ spin say --message "Hello World!"
```

#### Task with Async

Spinr supports `Async`/`Await`. 
The signature of such task is:

``` javascript
export async function [name]([options]) {
  await statements
}
```

Example:

``` javascript
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// $ spin wait
export async function wait({ time = 1000 }) {
  console.log(`waiting ${time}ms`);
  await timeout(time);
}
```

#### Task with Promise

Spinr supports `Promise`. 
The signature of such task is:

``` javascript
export function [name]([options]) {
  return new Promise((resolve, reject) => {
    statements
  });
}
```

Example:

``` javascript
import fs from 'fs';
import postcss from 'postcss';
import cssnano from 'cssnano';
import prefixer from 'autoprefixer';

export function css() {
  const src = 'lib/app.css';
  const dst = 'dist/app.css';
  const css = fs.readFileSync(src).toString('utf8');
  return postcss([prefixer, cssnano])
    .process(css, { from: src, to: dst, map: true })
    .then((result) => {
      fs.writeFileSync(dst, result.css);
      if (result.map) fs.writeFileSync(`${dst}.map`, result.map);
    });
}
```

#### Task with Stream

Spinr supports `Stream`. 
The signature of such task is:

``` javascript
export function [name]([options]) {
  statements
  return stream;
}
```

For example, you can easily integrate [Gulp](http://gulpjs.com) to spinr:

``` javascript
import gulp from 'gulp';

export function build({ src = 'lib', dest = 'dist' }) {
  return gulp.src(src).pipe(gulp.dest(dest));
}
```

#### Task with Callback

Spinr supports `Callback`.
The signature of such task is:

``` javascript
export function [name]([options[, callback]]) {
  statements
}
```

For example:

``` javascript
import path from 'path';
import ghpages from 'gh-pages';

export function publish({ silent, branch = 'origin' }, callback) {
  ghpages.publish(path.join(__dirname, 'dist'), {
    silent: options.slient,
    branch: options.branch,
    repo: 'https://github.com/space/repo.git',
  }, callback);
}
```

### Babel

Spinr uses [Babel](https://babeljs.io) with a setup adapted for [Node 6](https://nodejs.org/en/blog/release/v6.0.0/).
It is possible nevertheless to run Spinr without Babel or with a custom configuration.

#### Run without Babel

To disable Babel simply use `babel` option:

``` shell
$ spin --babel false [options] <tasks ...>
```

You would then define a `spinfile.js` compatible with your Node features.
For example a `spinfile.js` using `require` and `module.exports`:

``` javascript
const del = require('del');
const gulp = require('gulp');

function clean() {
  return del('dist')
}

function build() {
  return gulp.src('src').pipe(gulp.dest('dist'));
}

module.exports = {
  default: () => clean().then(() => build()),
  clean,
  build,
}
```

#### Custom Babel configuration

Depending on the Node version you use, or the functionalities you want to access; you can specify your own `babelrc` configuration:

``` shell
$ spin --babelrc ./path/to/babelrc [options] <tasks ...>
```

Spinr supports `Node 6` out of the box.
The default Babel configuration is the following:

``` json
"babel": {
  "presets": [
    "node6"
  ],
  "plugins": [
    "transform-async-to-generator",
    "transform-object-rest-spread"
  ]
},
```

### Tasks Orchestration

Spinr supports `sequential`, `parallel` and `hybrid` orchestration.

#### Sequential Orchestration

Sequential orchestration guarantees that tasks are executed one after the other.
For example, to execute `clean` then `build` then `test` simply do:

``` shell
$ spin clean build test
```

#### Parallel Orchestration

Parallel orchestration allows for tasks to be executed in parallel between each other's.
For example, to launch `build` in parallel of `test` simply do:

``` shell
$ spin --parallel build test
```

#### Hybrid Orchestration

Spinr supports orchestrating groups of tasks.
Each group will run in parallel with each other's.
A group can be composed of one or many tasks.
To group tasks simply use the `+` sign, e.g. `taskA+taskB+taskC`.

For example, to exectute `clean` and `build` in parallel of `test` simple do:

```
$ spin --parallel clean+build test
```

---

<small>_Lets spin a yarn!_</small>
