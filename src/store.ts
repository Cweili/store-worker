/* eslint-disable no-restricted-syntax */
import v8 from 'v8'
import { resolve as pathResolve } from 'path'
import { Worker } from 'worker_threads'
import type { Options as StoreOptions } from 'conf'
import { throttle } from 'throttle-debounce'

type Resolver<T = unknown> = ((value: T | PromiseLike<T>) => void) | ((reason?: Error) => void)

export interface Options<T> extends Omit<
  StoreOptions<T>,
  'accessPropertiesByDotNotation' | 'migrations' | 'serialize' | 'deserialize'
> {
  saveThrottle?: number
}

export class Store<T extends Record<string, any> = Record<string, any>> {
  protected options: Options<T>

  protected worker?: Worker

  protected storeMap?: Map<keyof T, T[keyof T]>

  private storeObj = {} as T

  private version = 0

  private storeObjVersion = -1

  private calls = new Map<number, Resolver[]>()

  private id = 0

  private terminated = false

  private saveThrottle: throttle<() => void>

  constructor(options: Options<T>) {
    this.options = {
      saveThrottle: 10000,
      ...options
    }
    this.saveThrottle = throttle(this.options.saveThrottle!, () => {
      this.save()
    })
    this.createWorker()
  }

  private restartWorker = (handleError?: boolean) => (err) => {
    if (handleError) console.error(err)
    if (this.terminated) return
    this.createWorker()
  }

  private createWorker() {
    this.worker = (new Worker(
      pathResolve(__dirname, process.env.JEST_WORKER_ID ? '../dist' : '', 'worker.js'),
      { workerData: this.options },
    ))
      .on('error', this.restartWorker(true))
      .on('exit', this.restartWorker())

    this.worker!.on('message', (resBuffer) => {
      const {
        id,
        res,
        didThrow,
      } = v8.deserialize(Buffer.from(resBuffer))
      const [
        resolveCall,
        rejectCall,
      ] = this.calls.get(id) || [];
      (didThrow ? rejectCall : resolveCall)?.(res)
      this.calls.delete(id)
    })
  }

  protected exec(method: string, ...args: unknown[]) {
    return new Promise((resolve, reject) => {
      const id = ++this.id
      const buf = v8.serialize({
        id,
        method,
        args,
      })
      const reqBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
      this.calls.set(id, [resolve, reject])
      this.worker!.postMessage(reqBuf, [reqBuf])
    })
  }

  public async init() {
    if (!this.storeMap) {
      this.storeMap = new Map<keyof T, T[keyof T]>()
      this.storeMap = await this.exec('storeMap') as Map<keyof T, T[keyof T]>
    }
    return this
  }

  public get store() {
    if (this.storeObjVersion !== this.version) {
      this.storeObj = Object.fromEntries(this.storeMap!) as T
      this.storeObjVersion = this.version
    }
    return this.storeObj
  }

  public get keys() {
    return Array.from(this.storeMap?.keys() || [])
  }

  public get values() {
    return Array.from(this.storeMap?.values() || [])
  }

  /**
    Get an item.

    @param key - The key of the item to get.
    @param defaultValue - The default value if the item does not exist.
    */
  public get<Key extends keyof T>(key: Key): T[Key];

  public get<Key extends keyof T>(key: Key, defaultValue: Required<T>[Key]): Required<T>[Key];

  // This overload is used for dot-notation access.
  // We exclude `keyof T` as an incorrect type for the default value
  // should not fall through to this overload.
  public get<Key extends string, Value = unknown>(key: Exclude<Key, keyof T>, defaultValue?: Value): Value;

  public get(key: string, defaultValue?: unknown): unknown {
    const { storeMap: store } = this
    return store!.has(key) ? store!.get(key) : defaultValue
  }

  /**
    Set an item or multiple items at once.

    @param {key|object} - You can use a hashmap of items to set at once.
    @param value - Must be JSON serializable. Trying to set the type `undefined`,
                  `function`, or `symbol` will result in a `TypeError`.
    */
  public set<Key extends keyof T>(key: Key, value?: T[Key]): void

  public set(key: string, value: unknown): void

  public set(object: Partial<T>): void

  public set<Key extends keyof T>(key: Partial<T> | Key | string, value?: T[Key] | unknown): void {
    ++this.version

    if (typeof key === 'object') {
      const object = key
      for (const [k, v] of Object.entries(object)) {
        this.storeMap!.set(k, v!)
      }
    } else {
      this.storeMap!.set(key, value as T[keyof T])
    }

    this.saveThrottle()
  }

  public save() {
    if (!this.storeMap) return Promise.resolve()
    return this.exec('setMap', this.storeMap)
  }

  /**
    Check if an item exists.

    @param key - The key of the item to check.
    */
  public has<Key extends keyof T>(key: Key | string): boolean {
    return this.storeMap!.has(key as string)
  }

  /**
    Delete an item.

    @param key - The key of the item to delete.
    */
  public delete<Key extends keyof T>(key: Key): void;

  public delete(key: string): void {
    if (this.storeMap!.delete(key)) {
      ++this.version
      this.saveThrottle()
    }
  }

  /**
    Delete all items.

    This resets known items to their default values,
    if defined by the `defaults` or `schema` option.
    */
  public clear(): void {
    ++this.version
    this.storeMap!.clear()
    this.saveThrottle()
  }

  /**
   * Destroy the store instance.
   */
  public async destroy() {
    this.saveThrottle.cancel()
    await this.save()
    this.terminated = true
    return this.worker!.terminate()
  }
}

