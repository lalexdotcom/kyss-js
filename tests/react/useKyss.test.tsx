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
