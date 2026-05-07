import { useSyncExternalStore } from 'react'
import type { StateBase, Store } from '../index'

export function useKyssStore<S extends StateBase>(
  store: Store<S>
): [state: S, setState: Store<S>['setState']] {
  const state = useSyncExternalStore(
    notify => store.addListener(notify),
    () => store.getState()
  )
  return [state, store.setState]
}
