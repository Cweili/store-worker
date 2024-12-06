import {
  Store,
  Options,
} from './store'
import { SyncStore } from './syncStore'

export {
  Store,
  SyncStore,
}

export function createStore<T extends Record<string, any> = Record<string, any>>(options: Options<T>) {
  return (new Store(options)).init()
}

export function createStoreSync<T extends Record<string, any> = Record<string, any>>(options: Options<T>) {
  return (new SyncStore(options)).initSync()
}
