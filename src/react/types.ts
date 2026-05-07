import type { StateBase } from '../index'

export type Setters<S extends StateBase> = {
  [K in keyof S as `set${Capitalize<string & K>}`]: (
    val: S[K] | ((prev: S[K]) => S[K])
  ) => void
}

export type KyssProxy<S extends StateBase> = S & Setters<S>
