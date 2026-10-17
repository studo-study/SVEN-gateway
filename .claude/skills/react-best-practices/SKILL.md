---
name: react-best-practices
description: React component structure and performance rules for this repo's client-rendered SPA, adapted from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring any React component. Triggers on tasks involving React components, file and component layout, enum rendering, client data fetching, re-render cost, effect dependencies, or render performance.
license: MIT
metadata:
  author: vercel
  adapted: jurimesh-spaces
  version: '1.0.0'
---

# React Best Practices

Performance optimization guide for client-rendered React applications. 53 rules across 7 categories, prioritized by impact to guide automated refactoring and code generation.

Adapted from Vercel's React Best Practices (MIT). Two bodies of upstream material are removed and should not come back:

- **Next.js and server rendering.** This repo ships a client-only React 19 SPA on Vite with the backend in Rust, so server components, server actions, route handlers, and hydration do not exist here.
- **Bundle-size optimization.** The app ships as one bundle with no route-level code splitting, so lazy loading, chunk strategy, and barrel-import cost are not levers anyone pulls here.

This skill covers **how a component is built and how fast it runs**. Visual design is `.claude/rules/screen-anatomy.md` (shells, page anatomies, component vocabulary, state coverage) and `.claude/rules/design-foundations.md` (tokens, spacing, type).

## Precedence

**Written rules beat existing code, always.** These rules and the repo's own rulebooks (root `AGENTS.md`, `.agents/rules/`) are the standard; code that contradicts them is code to fix, not precedent to copy. Never settle a question by grepping for how the codebase currently does it — plenty of what is in there predates the rule, or is simply bad.

Two rulebooks can still disagree with each other, and that is a question about _rules_, not about code. Where this imported set disagreed with a repo rulebook, the repo's rule is the more specific one — it names this repo's helpers, components, and hazards — so these files were edited to match it. The reconciled points, so a future re-import does not silently undo them:

| Upstream said                                                      | This repo says                                                                                                                                                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useEffectEvent` / hand-rolled `handlerRef` for callback stability | `useStableCallback` (`@/frontend/hooks/useStableCallback`) — it keeps the dep live and trips a Sentry-reported circuit breaker on runaway identity changes                                                           |
| `useSWR` at the call site                                          | `useSWR` only inside a `model.ts` `use<Resource>` hook                                                                                                                                                               |
| Raw `<button>` / `<input>` in examples                             | Design-system `Button` (`onTrigger`, never `onClick`) and `Input` (`onChange` takes the value)                                                                                                                       |
| "Use a ternary instead of `&&`"                                    | `&&` is correct for booleans; `{open && <DialogContent …/>}` is the mandated mount guard. The hazard is only a number or `NaN` on the left                                                                           |
| Module-level cache for any repeated call                           | Keyed caches only for pure functions; never a module-level snapshot of auth, flags, config, or time                                                                                                                  |
| Examples declare components as `function Foo()`                    | Real components are `const Foo: React.FC<FooProps> = …` + `Foo.displayName`. The snippets stay in shorthand so the performance point is not buried in boilerplate — copy the **technique**, not the declaration form |

**React Compiler is enabled for non-development builds** (`vite.config.mts`), so it auto-memoizes production output. The `rerender-` rules still apply — they are about what you subscribe to and when effects re-run, which the compiler does not change — but do not add `useMemo`/`useCallback` purely for render-cost reasons you have not measured.

## When to Apply

Reference these guidelines when:

- Writing new React components
- Implementing client data fetching
- Reviewing code for performance issues
- Refactoring existing React code
- Chasing slow renders, wasted re-renders, or an unresponsive UI

## Rule Categories by Priority

| Priority | Category                  | Impact       | Prefix       |
| -------- | ------------------------- | ------------ | ------------ |
| 1        | Component Structure       | FOUNDATIONAL | `structure-` |
| 2        | Eliminating Waterfalls    | CRITICAL     | `async-`     |
| 3        | Client-Side Data Fetching | MEDIUM-HIGH  | `client-`    |
| 4        | Re-render Optimization    | MEDIUM       | `rerender-`  |
| 5        | Rendering Performance     | MEDIUM       | `rendering-` |
| 6        | JavaScript Performance    | LOW-MEDIUM   | `js-`        |
| 7        | Advanced Patterns         | LOW          | `advanced-`  |

## Quick Reference

### 1. Component Structure (FOUNDATIONAL)

- `structure-one-export-per-file` - One public component per `.tsx`; sub-components stay private in it
- `structure-one-renderer-per-entity` - One presentational component and one total `Record<Enum, …>` per entity
- `structure-named-component-not-render-closure` - Name the JSX block in the place names go
- `structure-leaf-components` - Props in, JSX out; an optional callback is the variant

### 2. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` - Check cheap sync conditions before awaiting flags or remote values
- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-dependencies` - Use better-all for partial dependencies

### 3. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-swr-dedup` - Use SWR for automatic request deduplication, from a `model.ts` hook
- `client-event-listeners` - Deduplicate global event listeners
- `client-passive-event-listeners` - Use passive listeners for scroll
- `client-localstorage-schema` - Version and minimize localStorage data

### 4. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` - Don't subscribe to state only used in callbacks
- `rerender-memo` - Extract expensive work into memoized components
- `rerender-memo-with-default-value` - Hoist default non-primitive props
- `rerender-dependencies` - Use primitive dependencies in effects
- `rerender-derived-state` - Subscribe to derived booleans, not raw values
- `rerender-derived-state-no-effect` - Derive state during render, not effects
- `rerender-functional-setstate` - Use functional setState for stable callbacks
- `rerender-lazy-state-init` - Pass function to useState for expensive values
- `rerender-simple-expression-in-memo` - Avoid memo for simple primitives
- `rerender-split-combined-hooks` - Split hooks with independent dependencies
- `rerender-move-effect-to-event` - Put interaction logic in event handlers
- `rerender-transitions` - Use startTransition for non-urgent updates
- `rerender-use-deferred-value` - Defer expensive renders to keep input responsive
- `rerender-use-ref-transient-values` - Use refs for transient frequent values
- `rerender-no-inline-components` - Don't define components inside components

### 5. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` - Animate div wrapper, not SVG element
- `rendering-content-visibility` - Use content-visibility for long lists
- `rendering-hoist-jsx` - Extract static JSX outside components
- `rendering-svg-precision` - Reduce SVG coordinate precision
- `rendering-activity` - Use Activity component for show/hide
- `rendering-conditional-render` - Ternary when the condition is a number; `&&` stays fine for booleans
- `rendering-usetransition-loading` - Prefer useTransition for loading state
- `rendering-resource-hints` - Use React DOM resource hints for preloading

### 6. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` - Group CSS changes via classes or cssText
- `js-index-maps` - Build Map for repeated lookups
- `js-cache-property-access` - Cache object properties in loops
- `js-cache-function-results` - Cache function results in module-level Map
- `js-cache-storage` - Cache localStorage/sessionStorage reads
- `js-combine-iterations` - Combine multiple filter/map into one loop
- `js-length-check-first` - Check array length before expensive comparison
- `js-early-exit` - Return early from functions
- `js-hoist-regexp` - Hoist RegExp creation outside loops
- `js-min-max-loop` - Use loop for min/max instead of sort
- `js-set-map-lookups` - Use Set/Map for O(1) lookups
- `js-tosorted-immutable` - Use toSorted() for immutability
- `js-flatmap-filter` - Use flatMap to map and filter in one pass
- `js-request-idle-callback` - Defer non-critical work to browser idle time

### 7. Advanced Patterns (LOW)

- `advanced-effect-event-deps` - Don't put `useEffectEvent` results in effect deps
- `advanced-event-handler-refs` - Stable handlers for long-lived subscriptions
- `advanced-init-once` - Initialize app once per app load
- `advanced-use-latest` - `useStableCallback` for callback props used in effect deps

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/async-parallel.md
rules/rerender-memo.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
