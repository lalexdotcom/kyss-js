import type { StateBase, Store } from '../index'
import type { KyssProxy } from './types'

export function useKyss<S extends StateBase>(_store: Store<S>): KyssProxy<S> {
  // implemented in Task 7
  throw new Error('not implemented')
}
