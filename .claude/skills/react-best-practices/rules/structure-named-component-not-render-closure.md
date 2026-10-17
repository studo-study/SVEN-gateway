---
title: A Named Component, Not a Render Closure
impact: MEDIUM
impactDescription: readability, DevTools, memoisation
tags: structure, components, readability
---

## A render\* Closure Called From Your Own JSX Is a Component

When a block of JSX has a name, give it the name in the place names go. A named component declares its
props, appears in React DevTools, can memoise, and can be tested.

**Incorrect (`SterlingSetup.tsx`):**

```tsx
const renderContent = (): React.ReactNode => {
  if (hasSyncedFiles) return (/* ~40 lines */);
  if (subStep === 'dataroom-selection') return (/* ~40 lines */);
  return (/* ~40 lines */);
};

if (!isConnected) return <Spinner />;   // the component's own early return, mid-declaration

const renderContinueButton = (): React.ReactNode => { /* … */ };
```

An early `return` of the whole component sitting _between_ two closure declarations is the tell.

**Correct:** extract `SterlingSetupContent` and `SterlingContinueButton` as components with props.

**Legitimate `render*` closures pass a callback to an API that asks for one** — `renderRow` handed to a
virtualiser, `renderCell` handed to `.map()`. The distinction is whether something else calls it.

Distinct from [Don't Define Components Inside Components](./rerender-no-inline-components.md): that one
is a remount bug, this one is a readability rule. A `render*` closure does not remount its output.
