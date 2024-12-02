import {
  parentPort,
  workerData,
} from 'worker_threads'
import v8 from 'v8'
import Conf from 'conf'

const store = new Conf({
  ...workerData,
  serialize: (value) => JSON.stringify(value),
  accessPropertiesByDotNotation: false,
})

interface SyncMessage {
  method: string
  args: unknown[]
  res: SharedArrayBuffer
}

function exec(method: string, args: unknown[] = []) {
  let res
  let didThrow
  try {
    if (method === 'store') {
      res = store.store
    } else if (method === 'storeMap') {
      res = new Map<string, unknown>(Object.entries(store.store))
    } else if (method === 'setMap') {
      store.store = Object.fromEntries(args[0] as Map<string, unknown>)
    } else {
      res = store[method](...args)
    }
  } catch (err) {
    res = err
    didThrow = true
  }
  return [res, didThrow]
}

function sendResult(res: unknown, didThrow: boolean, id?: number) {
  const buf = v8.serialize({
    id,
    res,
    didThrow,
  })
  const resBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  parentPort!.postMessage(resBuf, [resBuf])
}

function sendResultSync(resBuf: SharedArrayBuffer, res: unknown, didThrow: boolean) {
  const semaphore = new Int32Array(resBuf)
  const buf = v8.serialize(res)
  buf.copy(Buffer.from(resBuf), Int32Array.BYTES_PER_ELEMENT)
  Atomics.store(semaphore, 0, didThrow ? (0 - buf.length) : buf.length)
  Atomics.notify(semaphore, 0)
}

parentPort!.on('message', (req: ArrayBuffer | SyncMessage) => {
  if (Object.prototype.hasOwnProperty.call(req, 'method')) {
    const {
      method,
      res,
      args = [],
    } = req as SyncMessage
    const [result, didThrow] = exec(method, args)
    sendResultSync(res, result, didThrow)
    return
  }

  const {
    id,
    method,
    args = [],
  } = v8.deserialize(Buffer.from(req as ArrayBuffer))
  const [result, didThrow] = exec(method, args)
  sendResult(result, didThrow, id)
})
