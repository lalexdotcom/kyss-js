export type StateBase = Record<string, any>

export interface Store<S extends StateBase> {
  getState(): S
  setState(
    partial: Partial<S> | ((prev: S) => Partial<S>),
    replace?: boolean
  ): void
  addListener(
    callback: (state: S, prevState: S) => void,
    keys?: (keyof S)[]
  ): () => void
  clearListeners(): void
}

export { createStore } from './store'
