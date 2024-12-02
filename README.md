# store-worker

[![npm][badge-version]][npm]
[![bundle size][badge-size]][bundlephobia]
[![npm downloads][badge-downloads]][npm]
[![license][badge-license]][license]

[![github][badge-issues]][github]
[![build][badge-build]][workflows]
[![coverage][badge-coverage]][coveralls]

`store-worker` is a simple and efficient way to manage persistent configuration in Node.js or Electron applications. It leverages worker threads to handle storage operations, ensuring that your main process remains responsive.

## Installation

### NPM

```
npm install store-worker
```

```js
import Store from 'store-worker';
```

## Usage

```js
const store = new Store({
  saveThrottle: 10000, // The number of milliseconds to wait before saving the store to disk after a change. This can help to reduce the number of disk writes when making frequent changes to the store.
  ... // other serializable options are pass to Conf instance 
});

// Set a value
store.set('unicorn', '🦄');

// Get a value
console.log(store.get('unicorn'));
//=> '🦄'

// Delete a value
store.delete('unicorn');
```

Serializable options are pass to [Conf](https://www.npmjs.com/package/conf).

[badge-version]: https://img.shields.io/npm/v/store-worker.svg
[badge-downloads]: https://img.shields.io/npm/dt/store-worker.svg
[npm]: https://www.npmjs.com/package/store-worker

[badge-size]: https://img.shields.io/bundlephobia/minzip/store-worker.svg
[bundlephobia]: https://bundlephobia.com/result?p=store-worker

[badge-license]: https://img.shields.io/npm/l/store-worker.svg
[license]: https://github.com/Cweili/store-worker/blob/master/LICENSE

[badge-issues]: https://img.shields.io/github/issues/Cweili/store-worker.svg
[github]: https://github.com/Cweili/store-worker

[badge-build]: https://img.shields.io/github/actions/workflow/status/Cweili/store-worker/ci.yml?branch=master
[workflows]: https://github.com/Cweili/store-worker/actions/workflows/ci.yml?query=branch%3Amaster

[badge-coverage]: https://img.shields.io/coveralls/github/Cweili/store-worker/master.svg
[coveralls]: https://coveralls.io/github/Cweili/store-worker?branch=master
