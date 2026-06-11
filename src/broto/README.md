# Broto

Broto is the reactive runtime used by Fábrica. It owns state, dependency tracking,
effect scheduling, ownership, cleanup stacks, context propagation and async resources.

## Core primitives

```ts
import {
  signal,
  computed,
  effect,
  batch,
  resource,
  createRoot,
  createContext,
  provide,
  useContext,
} from './broto'
```

## Signals

```ts
const count = signal(0)
const doubled = computed(() => count() * 2)

const stop = effect(() => {
  console.log(doubled())
})

count.update((value) => value + 1)
stop()
```

## Ownership

Ownership is the lifecycle graph. Effects, resources and UI components attach cleanup
work to the current owner.

```ts
const [value, dispose] = createRoot(() => {
  const count = signal(0)

  effect(() => {
    console.log(count())
  })

  return count
}, { name: 'CounterRoot' })

dispose()
```

## Cleanup stack

```ts
createRoot(() => {
  const id = setInterval(() => console.log('tick'), 1000)
  onOwnerCleanup(() => clearInterval(id))
})
```

## Context

```ts
const ThemeContext = createContext('dark', 'Theme')

createRoot(() => {
  provide(ThemeContext, 'forest')
  console.log(useContext(ThemeContext))
})
```

## Resources

Resources receive an `AbortSignal` and are automatically aborted when their owner is
disposed.

```ts
const profile = resource((signal) => {
  return fetch('/me', { signal }).then((response) => response.json())
})

profile.reload()
profile.abort()
```

## Scheduler

```ts
configureScheduler({ mode: 'microtask', maxFlushIterations: 500 })

scheduleTask(() => expensiveWork(), 'background')
flushSync()
```

## Debugging

```ts
console.log(inspectOwnerGraph())
```

## Owner error propagation

Input:

```ts
const [_, dispose] = createRoot(() => {
  onOwnerError((error) => {
    console.error(error);
    return true;
  });

  effect(() => {
    throw new Error("boom");
  });
});

dispose();
```

Output:

```txt
Error: boom
```

## Resource source/cache/retry

Input:

```ts
const id = signal("rod");
const profile = resource(
  (abort, userId) => fetch(`/users/${userId}`, { signal: abort }).then((r) => r.json()),
  { source: id, cacheKey: (userId) => `user:${userId}`, retries: 1, timeoutMs: 5000 },
);
```

Output state:

```ts
profile();
// { loading: false, value: { name: "Rod" }, error: undefined, stale: false }
```
