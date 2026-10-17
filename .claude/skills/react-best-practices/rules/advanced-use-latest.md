---
title: Stable Callback Refs for Effect Dependencies
impact: LOW
impactDescription: prevents effect re-runs
tags: advanced, hooks, useStableCallback, useEffectEvent, refs
---

## Stable Callback Refs for Effect Dependencies

A callback prop recreated by the parent on every render re-runs every effect that depends on it. **In this repo the fix is `useStableCallback`** (`@/frontend/hooks/useStableCallback`), not `useEffectEvent` and not a hand-rolled ref.

**Incorrect (effect re-runs on every parent render):**

```tsx
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timeout);
  }, [query, onSearch]);
}
```

**Correct (`useStableCallback`, and the wrapper stays in the deps):**

```tsx
import { useStableCallback } from '@/frontend/hooks/useStableCallback';

function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  const search = useStableCallback(onSearch);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);
}
```

`useStableCallback` is deliberately **not** `useEffectEvent`. It returns a new wrapper when the callback identity changes, so effect deps re-evaluate as they should — and it freezes the wrapper only after the identity changes more than 5 times in 100ms, reporting the runaway to Sentry. That circuit breaker is the point: a permanently stable ref hides the re-render loop instead of catching it.

Because the wrapper is a real dependency, **keep it in the dependency array** (the opposite of an effect event, see [Do Not Put Effect Events in Dependency Arrays](./advanced-effect-event-deps.md)).

Reach for `useEffectEvent` only when you specifically need an always-stable identity that never re-triggers the effect, and say why at the call site.
