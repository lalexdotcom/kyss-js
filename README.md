# kyss-js

**Keep Your State Simple** — proxy-tracked global state for React.

Combines Zustand's global store model with Valtio's selective re-rendering: components only re-render when the state keys they actually read have changed.

```tsx
const store = createStore({ count: 0, name: 'Alice' })

function Counter() {
  const { count, setCount } = useKyss(store)
  // re-renders only when `count` changes — not when `name` changes
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

## Install

```bash
npm install kyss-js
```

React ≥ 18 is a peer dependency.

## Usage

### Create a store

```ts
import { createStore } from 'kyss-js'

const store = createStore({ count: 0, user: { name: 'Alice' } })
```

### `useKyss` — proxy-tracked hook (recommended)

Re-renders only when the keys accessed during render have changed. The primary usage pattern is destructuring.

```tsx
import { useKyss } from 'kyss-js/react'

function Counter() {
  const { count, setCount } = useKyss(store)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

function UserPanel() {
  const { user, setUser } = useKyss(store)
  return (
    <input
      value={user.name}
      onChange={e => setUser({ name: e.target.value })}
    />
  )
}
```

Auto-generated setters accept a value or an updater function:

```ts
setCount(42)
setCount(prev => prev + 1)
```

Tracking is **shallow**: accessing `user` subscribes to changes of the `user` key, not its nested properties.

### `useKyssStore` — traditional hook

Re-renders on any state change. No proxy, no key tracking.

```tsx
import { useKyssStore } from 'kyss-js/react'

function App() {
  const [state, setState] = useKyssStore(store)
  return <span>{state.user.name}</span>
}
```

### Vanilla usage

Works outside React — useful for services, tests, or framework-agnostic code.

```ts
import { createStore } from 'kyss-js'

const store = createStore({ count: 0 })

const unsub = store.addListener((state, prev) => {
  console.log('count changed:', state.count)
}, ['count'])

store.setState({ count: 1 })  // listener called
store.setState({ count: 1 })  // no change — no dispatch
unsub()
```

## API

### `createStore<S>(initialState): Store<S>`

Creates a store from a plain object.

```ts
interface Store<S> {
  getState(): S
  setState(partial: Partial<S> | ((prev: S) => Partial<S>), replace?: boolean): void
  addListener(callback: (state: S, prevState: S) => void, keys?: (keyof S)[]): () => void
  clearListeners(): void
}
```

`setState` merges by default (`replace = false`). Pass `replace: true` to fully replace the state. Dispatch is skipped when no top-level key has changed.

`addListener` accepts an optional `keys` array to receive notifications only for specific keys.

### `useKyss<S>(store): KyssProxy<S>`

Returns a proxy combining the current state with auto-generated setters. The setter for key `foo` is `setFoo`.

```ts
type KyssProxy<S> = Readonly<S> & {
  [K in keyof S as `set${Capitalize<string & K>}`]: (val: S[K] | ((prev: S[K]) => S[K])) => void
}
```

### `useKyssStore<S>(store): [state: S, setState: Store<S>['setState']]`

Returns the current state and the store's `setState` function.

## TypeScript

The library is written in strict TypeScript. Setter types are fully inferred from the store's initial state:

```ts
const store = createStore({ count: 0, label: 'hello' })

// inferred:
// setCount: (val: number | ((prev: number) => number)) => void
// setLabel: (val: string | ((prev: string) => string)) => void
const { count, setCount, label, setLabel } = useKyss(store)
```

## Design notes

- **Shallow tracking only.** `useKyss` tracks top-level keys. Accessing `state.user` subscribes to changes of `user` as a whole, not to `user.name`.
- **Accumulative tracking.** Once a key is accessed, the component stays subscribed to it for the lifetime of the component instance.
- **No stale closures.** Setters call `store.setState` directly and always receive the live state, even when used with functional updates.

## License

MIT
