---
title: One Renderer and One Label Map Per Domain Entity
impact: HIGH
impactDescription: prevents three surfaces drifting apart
tags: structure, enums, labels, reuse, duplication
---

## One Renderer and One Label Map Per Domain Entity

When the same entity appears on several surfaces, drift is guaranteed: three layouts, three label maps,
three sets of words for one enum value ("Open" / "Still open"; "Promoted to finding" / "Became a
finding" / raw `folded`). Lawyers read all three surfaces.

**A raw enum value must never reach the DOM.** `{member.role}` rendering lowercase `owner` in a pill
shipped on the guest Users page — in the same file as a correct label map the author didn't reach three
lines up for.

**Correct — one total map at module scope, annotated so a new variant fails the build:**

```tsx
const BUY_SIDE_IRL_RESPONSE_STATUS_LABELS: Record<IrlResponseStatus, string> = {
  [IrlResponseStatus.Acknowledged]: 'Acknowledged',
  [IrlResponseStatus.AnswerProvided]: 'Provided',
  [IrlResponseStatus.NotApplicable]: 'Not Applicable',
  [IrlResponseStatus.Todo]: 'Waiting on Sell Side',
};
```

Total `Record<Enum, …>` means no `?? rawValue` fallback and no `capitalize` on a snake_case value. When
an audience changes the wording, **branch by choosing the map**, never by branching on the string:

```tsx
const labelsMap = side === 'buy' ? BUY_SIDE_…_LABELS : SELL_SIDE_…_LABELS;
```

**One presentational component per entity**, taking a narrow view interface rather than any one
endpoint's response type — several endpoints return the same entity with different envelopes, so
declare the subset you render and let each caller narrow to it. Props that only some callers can supply
are optional and default to rendering nothing. **Never branch the component on which page it is on.**

The same rule covers **controls** (one column renders one widget — a member row where owners get a
static `Tag` and editors get a `SimpleSelect` puts two widgets at two widths in one visual column;
render the same control disabled instead) and **layout shells** (two branches returning two copy-pasted
wrappers is how wrappers drift; extract the shell once and branch only the content).

Before styling one instance, grep for the entity by name — it is routinely rendered three times in
three styles.
