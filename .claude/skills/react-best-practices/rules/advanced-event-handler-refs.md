---
title: Stable Handlers for Long-Lived Subscriptions
impact: LOW
impactDescription: stable subscriptions
tags: advanced, hooks, refs, event-handlers, subscriptions
---

## Stable Handlers for Long-Lived Subscriptions

A subscription effect that lists the handler in its dependencies tears down and re-subscribes on every parent render.

**Incorrect (re-subscribes on every render):**

```tsx
function useWindowEvent(event: string, handler: (e: Event) => void) {
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler]);
}
```

**Correct (stable subscription via the repo helper):**

```tsx
import { useStableCallback } from '@/frontend/hooks/useStableCallback';

function useWindowEvent(event: string, handler: (e: Event) => void) {
  const onEvent = useStableCallback(handler);

  useEffect(() => {
    window.addEventListener(event, onEvent);
    return () => window.removeEventListener(event, onEvent);
  }, [event, onEvent]);
}
```

Do not hand-roll the `handlerRef` + sync-effect version of this. `useStableCallback` is the one implementation, and it carries the runaway-identity circuit breaker that a bare ref does not — see [Stable Callback Refs for Effect Dependencies](./advanced-use-latest.md).
