import { useRef, useCallback, useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import type { StateBase, Store } from '../index'
import type { KyssProxy } from './types'

export function useKyss<S extends StateBase>(store: Store<S>): KyssProxy<S> {
  const trackedRef = useRef(new Set<string>())

  const subscribe = useCallback(
    (notify: () => void) =>
      store.addListener((next, prev) => {
        const tracked = trackedRef.current
        const changed =
          tracked.size === 0 ||
          Array.from(tracked).some(
            k => (next as StateBase)[k] !== (prev as StateBase)[k]
          )
        if (changed) notify()
      }),
    [store]
  )

  const rawState = useSyncExternalStore(subscribe, () => store.getState())

  // Setters are memoized on store only — they call store.setState directly
  // to avoid stale closure over rawState
  const setters = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(store.getState()).map(key => [
          `set${key[0].toUpperCase()}${key.slice(1)}`,
          (val: unknown) =>
            store.setState(
              typeof val === 'function'
                ? (prev: S) => ({
                    [key]: (val as (p: unknown) => unknown)(prev[key as keyof S]),
                  } as Partial<S>)
                : { [key]: val } as Partial<S>
            ),
        ])
      ),
    [store]
  )

  return useMemo(
    () =>
      new Proxy(rawState as object, {
        get(target, prop: string | symbol) {
          if (typeof prop === 'string') {
            if (prop in setters) return setters[prop]
            trackedRef.current.add(prop)
          }
          return Reflect.get(target, prop)
        },
      }) as KyssProxy<S>,
    [rawState, setters]
  )
}
