---
title: A Leaf Takes Data and Callbacks, and Nothing Else
impact: MEDIUM
impactDescription: reusable across surfaces
tags: structure, components, props, composition
---

## A Leaf Takes Data and Callbacks, and Nothing Else

A cell, a badge, an indicator: props in, JSX out. No hooks, no `model.ts` fetch, no store subscription —
those belong to the row, the panel, or the page above it, so the leaf stays droppable into any surface.
`IRLResponseCell` renders identically in the internal sheet and the counterparty portal because its
`side` prop only reaches a labels map.

**An optional callback is the variant.** Presence of the handler decides read-only versus interactive,
instead of a boolean flag sitting beside a handler that would then need a second rule about which wins:

```tsx
interface IRLPriorityCellProps {
  item: IIrlSpreadsheetItem;
  /** Omitted on the read-only variants, which show the value without a selector. */
  onChange?: (item: IIrlSpreadsheetItem, priority: IrlPriority) => void;
}

// read-only branch
if (onChange == null) {
  if (item.priority == null) return null;
  return <IrlPriorityIndicator priority={item.priority} />;
}
```

One prop, one state — rather than `readOnly: boolean` plus `onChange`, which can contradict each other.
