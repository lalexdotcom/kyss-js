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
