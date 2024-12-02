import { parentPort, MessagePort } from 'worker_threads'
import v8 from 'v8'
import { jest, describe, expect, test } from '@jest/globals'

interface Message {
  id: number
  method: string
  args: unknown[]
}

interface SyncMessage {
  method: string
  args: unknown[]
  res: SharedArrayBuffer
}

interface Result {
  id: number
  res: any
  didThrow?: boolean
}

interface MockedMessagePort extends MessagePort {
  _exec(message: Omit<Message, 'id'>): Promise<Result>
  _execSync(message: Omit<SyncMessage, 'res'>): Promise<Result>
}

jest.mock('worker_threads', () => ({
  parentPort: {
    postMessage: jest.fn(),
    on: jest.fn(),
    _exec: jest.fn(),
    _execSync: jest.fn(),
  },
  workerData: {
    configName: Date.now().toString(36),
  },
}))

const mockParentPort = parentPort as jest.Mocked<MockedMessagePort>

const ons: ((value: any) => void)[] = []
const calls = new Map()

let id = 0

mockParentPort.on.mockImplementation((event: string, callback: (value: any) => void) => {
  ons.push(callback)
  return mockParentPort
})
mockParentPort.postMessage.mockImplementation((value) => {
  const data = v8.deserialize(Buffer.from(value))
  calls.get(data.id)(data)
})
mockParentPort._exec.mockImplementation((message: Omit<Message, 'id'>) => {
  const messageId = ++id
  const data = v8.serialize({
    ...message,
    id: messageId,
  })
  return new Promise((resolve) => {
    calls.set(messageId, resolve)
    ons.forEach((on) => {
      on(data)
    })
  })
})
mockParentPort._execSync.mockImplementation((message: Omit<SyncMessage, 'res'>) => {
  const sharedBuffer = new SharedArrayBuffer(64 * 1024 * 1024)
  const semaphore = new Int32Array(sharedBuffer)
  const data = {
    ...message,
    res: sharedBuffer,
  }
  ons.forEach((on) => {
    on(data)
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
})

describe('Worker', () => {
  require('../src/worker')

  afterEach(() => {
    mockParentPort._exec({
      method: 'clear',
      args: [],
    })
  })

  test('should get store', async () => {
    const { res, didThrow } = await mockParentPort._exec({
      method: 'store',
      args: []
    })
    expect(res).toEqual({})
    expect(didThrow).toBeUndefined()
  })

  test('should set and get item in store', async () => {
    await mockParentPort._exec({
      method: 'set',
      args: ['key', 'value']
    })

    const { res, didThrow } = await mockParentPort._exec({
      method: 'get',
      args: ['key']
    })

    expect(res).toBe('value')
    expect(didThrow).toBeUndefined()
  })

  test('should delete item from store', async () => {
    await mockParentPort._exec({
      method: 'set',
      args: ['key', 'value']
    })

    await mockParentPort._exec({
      method: 'delete',
      args: ['key']
    })

    const { res, didThrow } = await mockParentPort._exec({
      method: 'get',
      args: ['key']
    })

    expect(res).toBeUndefined()
    expect(didThrow).toBeUndefined()
  })

  test('should clear store', async () => {
    await mockParentPort._exec({
      method: 'set',
      args: ['key', 'value']
    })

    await mockParentPort._exec({
      method: 'clear',
      args: []
    })

    const { res, didThrow } = await mockParentPort._exec({
      method: 'store',
      args: []
    })

    expect(res).toEqual({})
    expect(didThrow).toBeUndefined()
  })

  test('should check if item exists in store', async () => {
    await mockParentPort._exec({
      method: 'set',
      args: ['key', 'value']
    })

    const { res: hasRes, didThrow: hasDidThrow } = await mockParentPort._exec({
      method: 'has',
      args: ['key']
    })
    expect(hasRes).toBe(true)
    expect(hasDidThrow).toBeUndefined()

    await mockParentPort._exec({
      method: 'delete',
      args: ['key']
    })

    const { res: hasAfterDeleteRes, didThrow: hasAfterDeleteDidThrow } = await mockParentPort._exec({
      method: 'has',
      args: ['key']
    })
    expect(hasAfterDeleteRes).toBe(false)
    expect(hasAfterDeleteDidThrow).toBeUndefined()
  })

  test('should set store map', async () => {
    const map = new Map([['key', 'value']])
    await mockParentPort._exec({
      method: 'setMap',
      args: [map]
    })

    const { res, didThrow } = await mockParentPort._exec({
      method: 'storeMap',
      args: []
    })
    expect(Array.from(res.entries())).toEqual([['key', 'value']])
    expect(didThrow).toBeUndefined()
  })

  test('should handle sync message', async () => {
    const res = mockParentPort._execSync({
      method: 'set',
      args: ['key', 'value'],
    })

    expect(res).toBeUndefined()
  })
})
