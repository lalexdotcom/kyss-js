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

  return useMemo(
    () =>
      new Proxy(rawState as object, {
        get(target, prop: string | symbol) {
          if (typeof prop === 'string') {
            trackedRef.current.add(prop)
          }
          return Reflect.get(target, prop)
        },
      }) as KyssProxy<S>,
    [rawState]
  )
}
