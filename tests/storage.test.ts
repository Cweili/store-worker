import { describe, expect, test } from '@jest/globals'
import Store from '../src'

const getNewStore = () => new Store({ configName: Date.now().toString(36) })

describe('Store', () => {
  test('should get item from store', async () => {
    const store = getNewStore()
    await store.init()
    store.set('key', 'value')
    expect(store.get('key')).toBe('value')
    expect(store.store).toEqual({ key: 'value' })
    store.destroy()
  })

  test('should get item from store (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set('key', 'value')
    expect(store.get('key')).toBe('value')
    expect(store.store).toEqual({ key: 'value' })
    store.destroy()
  })

  test('should set item in store', async () => {
    const store = getNewStore()
    await store.init()
    store.set('key', 'value')
    expect(store.get('key')).toBe('value')
    expect(store.store).toEqual({ key: 'value' })
    store.destroy()
  })

  test('should set item in store (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set('key', 'value')
    expect(store.get('key')).toBe('value')
    expect(store.store).toEqual({ key: 'value' })
    store.destroy()
  })

  test('should delete item from store', async () => {
    const store = getNewStore()
    await store.init()
    store.set('key', 'value')
    store.delete('key')
    expect(store.get('key')).toBeUndefined()
    expect(store.store).toEqual({})
    store.destroy()
  })

  test('should delete item from store (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set('key', 'value')
    store.delete('key')
    expect(store.get('key')).toBeUndefined()
    expect(store.store).toEqual({})
    store.destroy()
  })

  test('should clear store', async () => {
    const store = getNewStore()
    await store.init()
    store.set('key', 'value')
    store.clear()
    expect(store.get('key')).toBeUndefined()
    expect(store.store).toEqual({})
    store.destroy()
  })

  test('should clear store (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set('key', 'value')
    store.clear()
    expect(store.get('key')).toBeUndefined()
    expect(store.store).toEqual({})
    store.destroy()
  })

  test('should check if item exists in store', async () => {
    const store = getNewStore()
    await store.init()
    store.set('key', 'value')
    expect(store.has('key')).toBe(true)
    expect(store.store).toEqual({ key: 'value' })
    store.delete('key')
    expect(store.has('key')).toBe(false)
    expect(store.store).toEqual({})
    store.destroy()
  })

  test('should check if item exists in store (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set('key', 'value')
    expect(store.has('key')).toBe(true)
    expect(store.store).toEqual({ key: 'value' })
    store.delete('key')
    expect(store.has('key')).toBe(false)
    expect(store.store).toEqual({})
    store.destroy()
  })

  test('should get store keys', async () => {
    const store = getNewStore()
    await store.init()
    store.set('key1', 'value1')
    store.set('key2', 'value2')
    expect(store.keys).toEqual(['key1', 'key2'])
    expect(store.store).toEqual({ key1: 'value1', key2: 'value2' })
    store.destroy()
  })

  test('should get store keys (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set('key1', 'value1')
    store.set('key2', 'value2')
    expect(store.keys).toEqual(['key1', 'key2'])
    expect(store.store).toEqual({ key1: 'value1', key2: 'value2' })
    store.destroy()
  })

  test('should get store values', async () => {
    const store = getNewStore()
    await store.init()
    store.set('key1', 'value1')
    store.set('key2', 'value2')
    expect(store.values).toEqual(['value1', 'value2'])
    expect(store.store).toEqual({ key1: 'value1', key2: 'value2' })
    store.destroy()
  })

  test('should get store values (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set('key1', 'value1')
    store.set('key2', 'value2')
    expect(store.values).toEqual(['value1', 'value2'])
    expect(store.store).toEqual({ key1: 'value1', key2: 'value2' })
    store.destroy()
  })

  test('should set multiple items in store', async () => {
    const store = getNewStore()
    await store.init()
    store.set({ key1: 'value1', key2: 'value2' })
    expect(store.get('key1')).toBe('value1')
    expect(store.get('key2')).toBe('value2')
    expect(store.store).toEqual({ key1: 'value1', key2: 'value2' })
    store.destroy()
  })

  test('should set multiple items in store (sync)', () => {
    const store = getNewStore()
    store.initSync()
    store.set({ key1: 'value1', key2: 'value2' })
    expect(store.get('key1')).toBe('value1')
    expect(store.get('key2')).toBe('value2')
    expect(store.store).toEqual({ key1: 'value1', key2: 'value2' })
    store.destroy()
  })
})
