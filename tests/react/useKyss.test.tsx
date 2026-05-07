import { describe, it, expect } from '@rstest/core'
import { renderHook, act } from '@testing-library/react'
import { createStore } from '../../src/index'
import { useKyss } from '../../src/react/index'

describe('useKyss — proxy tracking', () => {
  it('returns state values via destructuring', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    const { result } = renderHook(() => {
      const { count, name } = useKyss(store)
      return { count, name }
    })
    expect(result.current.count).toBe(0)
    expect(result.current.name).toBe('Alice')
  })

  it('re-renders when a destructured key changes', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    const { result } = renderHook(() => {
      const { count } = useKyss(store)
      return count
    })
    act(() => { store.setState({ count: 1 }) })
    expect(result.current).toBe(1)
  })

  it('does not re-render when a non-destructured key changes', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    let renderCount = 0
    renderHook(() => {
      renderCount++
      const { count } = useKyss(store)
      return count
    })
    const countAfterMount = renderCount

    act(() => { store.setState({ name: 'Bob' }) })
    expect(renderCount).toBe(countAfterMount)
  })

  it('re-renders for each distinct tracked key that changes', () => {
    const store = createStore({ a: 0, b: 0 })
    const { result } = renderHook(() => {
      const { a, b } = useKyss(store)
      return { a, b }
    })
    act(() => { store.setState({ a: 1 }) })
    expect(result.current.a).toBe(1)
    expect(result.current.b).toBe(0)
  })
})

describe('useKyss — setters', () => {
  it('exposes a setter for each key as set<Key>', () => {
    const store = createStore({ count: 0 })
    const { result } = renderHook(() => useKyss(store))
    expect(typeof (result.current as any).setCount).toBe('function')
  })

  it('setter with a value updates state', () => {
    const store = createStore({ count: 0 })
    const { result } = renderHook(() => {
      const { count, setCount } = useKyss(store)
      return { count, setCount }
    })
    act(() => { result.current.setCount(42) })
    expect(store.getState().count).toBe(42)
  })

  it('setter with a function receives the current state value', () => {
    const store = createStore({ count: 10 })
    const { result } = renderHook(() => {
      const { count, setCount } = useKyss(store)
      return { count, setCount }
    })
    act(() => { result.current.setCount(prev => prev + 5) })
    expect(store.getState().count).toBe(15)
  })

  it('setter with function always reads latest state (no stale closure)', () => {
    const store = createStore({ count: 0 })
    const { result } = renderHook(() => {
      const { setCount } = useKyss(store)
      return { setCount }
    })
    // Two synchronous updates: first directly on store, then via setter
    act(() => {
      store.setState({ count: 5 })
      result.current.setCount(prev => prev + 1)
    })
    expect(store.getState().count).toBe(6)
  })

  it('setter does not cause re-render in a component that only uses another key', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    let renderCount = 0
    renderHook(() => {
      renderCount++
      const { name } = useKyss(store)
      return name
    })
    const countAfterMount = renderCount

    act(() => { store.setState({ count: 1 }) })
    expect(renderCount).toBe(countAfterMount)
  })
})
