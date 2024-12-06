/* eslint-disable no-restricted-syntax */
import v8 from 'v8'
import { Store } from './store'

const SYNC_STORE_SIZE = 64 * 1024 * 1024

export class SyncStore<T extends Record<string, any> = Record<string, any>>
  extends Store<T> {

   private execSync(method: string, ...args: unknown[]) {
    const sharedBuffer = new SharedArrayBuffer(SYNC_STORE_SIZE)
    const semaphore = new Int32Array(sharedBuffer)
    this.worker!.postMessage({
      method,
      args,
      res: sharedBuffer,
    })
    Atomics.wait(semaphore, 0, 0)
    const resBuf = Buffer.from(sharedBuffer)
    let len = resBuf.readInt32LE()
    let didThrow
    if (len < 0) {
      len = 0 - len
      didThrow = true
    }
    const res = v8.deserialize(
      resBuf.subarray(Int32Array.BYTES_PER_ELEMENT, Int32Array.BYTES_PER_ELEMENT + len),
    )
    if (didThrow) {
      throw res
    }
    return res
  }

  initSync() {
    if (!this.storeMap) {
      this.storeMap = this.execSync('storeMap') as Map<keyof T, T[keyof T]>
    }
    return this
  }
}

