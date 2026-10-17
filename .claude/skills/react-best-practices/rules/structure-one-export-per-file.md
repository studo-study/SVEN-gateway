---
title: One Exported Component Per File
impact: HIGH
impactDescription: predictable paths, smaller reads
tags: structure, files, exports, organisation
---

## One Exported Component Per File

A `.tsx` file has exactly one public component. Everything else in it is private: the sub-components it
renders, its props interface, its label maps. The payoff is that a component's path is predictable from
its name, and opening it loads that component and nothing else.

Private sub-components go **above** the export when it reads better with them already defined, **below**
when the export is the headline. A private component moves to its own file the moment a second file
imports it, and not before — a new file per 10-line component costs a resolve-and-open on every read
for nothing.

**Incorrect (a grab-bag: one file holding a plural category):**

```tsx
// QuestionTableCells.tsx — six exported cells, one importer
export const QuestionPriorityCell: React.FC<…> = …;
export const QuestionTitleCell: React.FC<…> = …;
export const QuestionContentCell: React.FC<…> = …;
export const QuestionCategoryCell: React.FC<…> = …;
export const QuestionCommentsCell: React.FC<…> = …;
export const QuestionStatusCell: React.FC<…> = …;
```

**Correct (one cell per file, private helpers inside):**

```tsx
// IRLResponseCell.tsx
const StatusIndicator: React.FC<{ status: IrlResponseStatus }> = …;       // private
const StatusIndicatorWithText: React.FC<{ … }> = …;                       // private
export const IRLResponseCell: React.FC<IRLResponseCellProps> = …;         // the one export
```

A cell is then found by its own path and changed without loading its five siblings.

**Exempt: a genuine family** the call sites pick between, where each member is meaningless alone —
`Logo.tsx` (mark, wordmark, shared path data), `UploadButton.tsx` (three arrangements of one upload
flow). A grab-bag is a category; a family is one thing with variants.

Donor: `src/frontend/app/irl/spreadsheet/IRLResponseCell.tsx`, and its `IRLPriorityCell` /
`IRLQuestionCell` neighbours.
