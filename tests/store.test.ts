import { describe, it, expect } from '@rstest/core'
import { createStore } from '../src/index'

describe('createStore', () => {
  it('returns an object with getState', () => {
    const store = createStore({ count: 0 })
    expect(typeof store.getState).toBe('function')
  })

  it('getState returns the initial state', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    expect(store.getState()).toEqual({ count: 0, name: 'Alice' })
  })

  it('getState returns the same reference when state has not changed', () => {
    const store = createStore({ count: 0 })
    expect(store.getState()).toBe(store.getState())
  })
})

describe('setState', () => {
  it('merges partial state (default replace=false)', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    store.setState({ count: 1 })
    expect(store.getState()).toEqual({ count: 1, name: 'Alice' })
  })

  it('accepts an updater function', () => {
    const store = createStore({ count: 5 })
    store.setState(prev => ({ count: prev.count + 1 }))
    expect(store.getState().count).toBe(6)
  })

  it('replaces entire state when replace=true', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    store.setState({ count: 1 } as any, true)
    expect(store.getState()).toEqual({ count: 1 })
    expect((store.getState() as any).name).toBeUndefined()
  })

  it('does not change state reference when all values are identical', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    const before = store.getState()
    store.setState({ count: 0 })
    expect(store.getState()).toBe(before)
  })

  it('does not change state reference when updater returns identical values', () => {
    const store = createStore({ count: 0 })
    const before = store.getState()
    store.setState(s => ({ count: s.count }))
    expect(store.getState()).toBe(before)
  })
})
