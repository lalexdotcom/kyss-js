import type { StateBase, Store } from './index'

export function createStore<S extends StateBase>(initialState: S): Store<S> {
  let state: S = initialState

  return {
    getState() {
      return state
    },

    setState(partial, replace = false) {
      const prev = state
      const update = typeof partial === 'function' ? partial(state) : partial
      const next: S = replace ? (update as S) : { ...state, ...update }

      // No-op check: stop if no top-level key differs
      const allKeys = [
        ...new Set([
          ...Object.keys(prev as object),
          ...Object.keys(next as object),
        ]),
      ]
      const hasChanged = allKeys.some(k => (prev as StateBase)[k] !== (next as StateBase)[k])
      if (!hasChanged) return

      state = next
    },

    addListener(
      _callback: (state: S, prevState: S) => void,
      _keys?: (keyof S)[]
    ) {
      // implemented in Task 4
      return () => {}
    },

    clearListeners() {
      // implemented in Task 5
    },
  }
}
