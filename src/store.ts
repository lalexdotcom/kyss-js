import type { StateBase, Store } from './index'

export function createStore<S extends StateBase>(initialState: S): Store<S> {
  let state: S = initialState

  return {
    getState() {
      return state
    },

    setState(
      _partial: Partial<S> | ((prev: S) => Partial<S>),
      _replace?: boolean
    ) {
      // implemented in Task 3
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
