import type { StateBase, Store } from './index'

export function createStore<S extends StateBase>(initialState: S): Store<S> {
  let state: S = initialState

  type Listener = {
    callback: (state: S, prevState: S) => void
    keys?: (keyof S)[]
  }

  const listeners = new Set<Listener>()

  return {
    getState() {
      return state
    },

    setState(partial: Partial<S> | S | ((prev: S) => Partial<S> | S), replace = false) {
      const prev = state
      const update = typeof partial === 'function' ? partial(state) : partial
      const next: S = replace ? (update as S) : { ...state, ...update }

      const allKeys = [
        ...new Set([
          ...Object.keys(prev as object),
          ...Object.keys(next as object),
        ]),
      ]
      const hasChanged = allKeys.some(
        k => (prev as StateBase)[k] !== (next as StateBase)[k]
      )
      if (!hasChanged) return

      state = next

      for (const listener of listeners) {
        if (!listener.keys) {
          listener.callback(state, prev)
        } else if (listener.keys.some(k => state[k] !== prev[k])) {
          listener.callback(state, prev)
        }
      }
    },

    addListener(callback, keys) {
      const listener: Listener = { callback, keys }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    clearListeners() {
      listeners.clear()
    },
  }
}
