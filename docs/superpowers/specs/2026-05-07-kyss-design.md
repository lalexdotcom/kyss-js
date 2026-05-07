# KYSS — Keep Your State Simple

**Date:** 2026-05-07  
**Package:** `kyss` (npm)  
**Status:** Approved

---

## Overview

KYSS is a lightweight state management library combining Zustand's global store model with Valtio's proxy-based selective re-rendering. It ships as a dual-entry npm package: a vanilla JS/TS core and a React 19 bindings layer.

---

## Package Structure

```
kyss/
├── src/
│   ├── index.ts          # vanilla core entry point
│   └── react/
│       └── index.ts      # React hooks entry point
├── rslib.config.ts
├── rstest.config.ts
└── package.json
```

Build tooling: **rslib** (build), **rsbuild** (dev/preview), **rstest** (tests).  
Project initialized via rslib scaffold.

### package.json exports map

```json
{
  "name": "kyss",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.cjs",
      "types": "./dist/react/index.d.ts"
    }
  },
  "peerDependencies": {
    "react": ">=19.0.0"
  }
}
```

React is a peer dependency — never bundled in the vanilla entry point.

---

## Vanilla Core (`kyss`)

### Types

```ts
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

export function createStore<S extends StateBase>(initialState: S): Store<S>
```

### `createStore` behavior

- Returns a `Store<S>` instance.
- State is held in a private closure variable.

### `setState` behavior (two-phase)

1. Compute the next state:
   - `replace = false` (default): shallow merge `{ ...prev, ...partial }`
   - `replace = true`: full replacement (caller must provide a complete `S`)
   - If `partial` is a function: called with current state, result is merged/replaced
2. Compare all top-level keys between prev and next (`!==`):
   - If **no key differs**: stop, no dispatch (prevents spurious notifications even if the object reference changed)
   - If **at least one key differs**: dispatch to listeners

### `addListener` behavior

- Registers a callback with an optional key filter.
- Returns an `unsubscribe` function.
- During dispatch:
  - Listeners **without** `keys`: always called when state changes
  - Listeners **with** `keys`: called only if at least one of their keys changed
- `clearListeners()` removes all registered listeners.

### Vanilla usage example

```ts
import { createStore } from 'kyss'

const store = createStore({ count: 0, user: { name: 'Alice' } })

const unsub = store.addListener(
  (state) => console.log(state.count),
  ['count']
)

store.setState({ count: 1 })               // listener called
store.setState({ user: { name: 'Bob' } })  // listener not called
store.setState({ count: 1 })               // no key changed → no dispatch
unsub()
```

---

## React Hooks (`kyss/react`)

### Types

```ts
// Capitalize is a TypeScript built-in helper (since 4.1)
type Setters<S extends StateBase> = {
  [K in keyof S as `set${Capitalize<string & K>}`]:
    (val: S[K] | ((prev: S[K]) => S[K])) => void
}

export type KyssProxy<S extends StateBase> = S & Setters<S>

export function useKyssStore<S extends StateBase>(
  store: Store<S>
): [state: S, setState: Store<S>['setState']]

export function useKyss<S extends StateBase>(
  store: Store<S>
): KyssProxy<S>
```

---

### `useKyssStore` — traditional hook

Re-renders on **any** state change. No proxy, no key tracking. Equivalent to a standard external store subscription.

```ts
function useKyssStore<S extends StateBase>(store: Store<S>) {
  const state = useSyncExternalStore(
    notify => store.addListener(notify), // () => void is assignable to (S, S) => void
    () => store.getState()
  )
  return [state, store.setState] as const
}
```

- `notify` ignores the `(state, prevState)` arguments — valid in TypeScript (fewer parameters = subtype).
- `store.setState` is passed directly as the setter (stable reference).

---

### `useKyss` — proxy-tracked hook

Re-renders **only** when accessed top-level keys change. Tracking is **shallow**: `state.user` is tracked as the `user` key, not its nested properties.

#### Tracking mechanism

1. A `ref` (`trackedRef`) accumulates the set of top-level keys accessed during renders.
2. `subscribe` listens to all store changes but calls `notify` only when a tracked key changed.
3. `useSyncExternalStore` handles the React integration and concurrent safety.
4. The returned proxy intercepts `get` to record accesses in `trackedRef` and route setter calls.

#### Key tracking semantics

- **Primary usage pattern is destructuring**: `const { count, setCount } = useKyss(store)`. Destructuring hits the proxy `get` trap during render, so tracking registers correctly for each accessed key.
- Keys **accumulate** across renders (once accessed, always subscribed).
- If `trackedRef` is empty (first render before any access), `notify` is always called — ensures the component renders at least once to discover its keys.
- Any implementation decision throughout the project must preserve the correctness of the destructuring pattern — in particular, the proxy `get` trap must fire during the render phase for each accessed key.

#### Setter generation

- Setters are built once per store (`useMemo([store])`), **not** per `rawState` update.
- Each setter calls `store.setState` directly to avoid stale closure over the snapshot.
- Functional update form (`prev => next`) receives the current live state from the store.

```ts
function useKyss<S extends StateBase>(store: Store<S>): KyssProxy<S> {
  const trackedRef = useRef(new Set<string>())

  const subscribe = useCallback((notify: () => void) =>
    store.addListener((next, prev) => {
      const tracked = trackedRef.current
      const changed =
        tracked.size === 0 ||
        Array.from(tracked).some(k => next[k] !== prev[k])
      if (changed) notify()
    })
  , [store])

  const rawState = useSyncExternalStore(subscribe, () => store.getState())

  const setters = useMemo(() =>
    Object.fromEntries(
      Object.keys(store.getState()).map(key => [
        `set${key[0].toUpperCase()}${key.slice(1)}`,
        (val: unknown) => store.setState(
          typeof val === 'function'
            ? prev => ({ [key]: (val as Function)(prev[key]) })
            : { [key]: val }
        )
      ])
    )
  , [store])

  return useMemo(() =>
    new Proxy(rawState, {
      get(target, prop: string | symbol) {
        if (typeof prop === 'string') {
          if (prop in setters) return setters[prop]
          trackedRef.current.add(prop)
        }
        return Reflect.get(target, prop)
      }
    }) as KyssProxy<S>
  , [rawState, setters])
}
```

#### React usage examples

```ts
import { createStore } from 'kyss'
import { useKyss, useKyssStore } from 'kyss/react'

const store = createStore({ count: 0, user: { name: 'Alice' } })

// DX-first: destructuring is the primary pattern
// re-renders only when accessed keys change
function Counter() {
  const { count, setCount } = useKyss(store)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

// Traditional: re-renders on any state change
function UserPanel() {
  const [state, setState] = useKyssStore(store)
  return <span>{state.user.name}</span>
}
```

**Inferred setter types** for `createStore({ count: 0, user: { name: 'Alice' } })`:
- `setCount: (val: number | ((prev: number) => number)) => void`
- `setUser: (val: { name: string } | ((prev: { name: string }) => { name: string })) => void`

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Proxy depth | Shallow (top-level keys only) | Simpler, predictable, sufficient for most use cases |
| Key tracking | Accumulative | Simple and predictable for v1 |
| Setter closure | `store.setState` direct | Prevents stale state in functional updates |
| `useKyssStore` proxy | None | Re-renders on all changes, no tracking overhead |
| Base state type | `Record<string, any>` | Compatible with all plain objects |
| React version | ≥19 | `useSyncExternalStore` is stable, concurrent-safe |

---

## Out of Scope (v1)

- Deep (nested) proxy tracking
- Devtools integration
- Middleware / enhancers
- Async actions
- Reset tracked keys per render
