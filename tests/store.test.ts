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

describe('addListener (no key filter)', () => {
  it('calls the listener when state changes', () => {
    const store = createStore({ count: 0 })
    const calls: number[] = []
    store.addListener(state => calls.push(state.count))
    store.setState({ count: 1 })
    expect(calls).toEqual([1])
  })

  it('passes both next and prev state to the callback', () => {
    const store = createStore({ count: 0 })
    let received: [number, number] | null = null
    store.addListener((next, prev) => {
      received = [next.count, prev.count]
    })
    store.setState({ count: 5 })
    expect(received).toEqual([5, 0])
  })

  it('does not call the listener when state does not change (no-op)', () => {
    const store = createStore({ count: 0 })
    const calls: number[] = []
    store.addListener(state => calls.push(state.count))
    store.setState({ count: 0 })
    expect(calls).toHaveLength(0)
  })

  it('returns an unsubscribe function that stops notifications', () => {
    const store = createStore({ count: 0 })
    const calls: number[] = []
    const unsub = store.addListener(state => calls.push(state.count))
    store.setState({ count: 1 })
    unsub()
    store.setState({ count: 2 })
    expect(calls).toEqual([1])
  })

  it('supports multiple independent listeners', () => {
    const store = createStore({ count: 0 })
    const a: number[] = []
    const b: number[] = []
    store.addListener(s => a.push(s.count))
    store.addListener(s => b.push(s.count))
    store.setState({ count: 1 })
    expect(a).toEqual([1])
    expect(b).toEqual([1])
  })
})
