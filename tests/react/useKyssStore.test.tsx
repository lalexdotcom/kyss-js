import { describe, it, expect } from '@rstest/core'
import { renderHook, act } from '@testing-library/react'
import { createStore } from '../../src/index'
import { useKyssStore } from '../../src/react/index'

describe('useKyssStore', () => {
  it('returns initial state as first element of the tuple', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    const { result } = renderHook(() => useKyssStore(store))
    expect(result.current[0]).toEqual({ count: 0, name: 'Alice' })
  })

  it('re-renders when any key changes', () => {
    const store = createStore({ count: 0, name: 'Alice' })
    const { result } = renderHook(() => useKyssStore(store))

    act(() => { store.setState({ count: 1 }) })
    expect(result.current[0].count).toBe(1)

    act(() => { store.setState({ name: 'Bob' }) })
    expect(result.current[0].name).toBe('Bob')
  })

  it('does not re-render when setState is a no-op', () => {
    const store = createStore({ count: 0 })
    let renderCount = 0
    const { result } = renderHook(() => {
      renderCount++
      return useKyssStore(store)
    })
    const countAfterMount = renderCount

    act(() => { store.setState({ count: 0 }) })
    expect(renderCount).toBe(countAfterMount)
  })

  it('exposes store.setState as the second element', () => {
    const store = createStore({ count: 0 })
    const { result } = renderHook(() => useKyssStore(store))

    act(() => { result.current[1]({ count: 42 }) })
    expect(result.current[0].count).toBe(42)
  })

  it('unsubscribes from store on unmount', () => {
    const store = createStore({ count: 0 })
    let renderCount = 0
    const { unmount } = renderHook(() => {
      renderCount++
      return useKyssStore(store)
    })
    const countAfterMount = renderCount
    unmount()

    act(() => { store.setState({ count: 1 }) })
    expect(renderCount).toBe(countAfterMount)
  })
})
