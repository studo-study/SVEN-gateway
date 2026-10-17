---
name: clean-code
description: >
  Language-agnostic clean-code principles: naming, function size and shape, types instead of
  comments, error shape, a pure core with I/O at the edges, and the smells worth naming out loud.
  Use this skill when:
  (1) writing new code in any language,
  (2) reviewing a diff or a pull request,
  (3) refactoring code that works but reads badly,
  (4) naming things, shaping errors, or deciding where a function should split.
  Language specifics live in /rust-best-practices and /react-best-practices.
risk: safe
source: "ClawForge (https://github.com/jackjin1997/ClawForge), after Robert C. Martin's Clean Code"
adapted: 'Class/inheritance-era advice restated for functions over plain data; language specifics delegated to the stack skills.'
date_added: '2026-09-19'
allowed-tools: Read Write Edit Glob Grep
---

# Clean Code

> "Code is clean if it can be read, and enhanced by a developer other than its original author."
> — Grady Booch

The original _Clean Code_ was written for 2008-era Java, so its advice arrives wrapped in classes,
inheritance and exceptions. The ideas survive; the packaging does not. Neither stack here has
inheritance to speak of: the unit of design is a **function over plain data**, and the guidance
below is stated in those terms.

**This file is deliberately language-agnostic.** Anything that needs a language's own vocabulary
is one level down, and this file never overrules it:

| The question                                                   | Where it is answered                                                 |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| Ownership, `Result`/`Option`, dispatch, Rust tests and docs    | `/rust-best-practices`, then `rust-monorepo/AGENTS.md`               |
| Component structure, re-renders, effects, client data fetching | `/react-best-practices`, then `.agents/rules/react-idioms.md`        |
| This repo's helpers, tables, endpoints, and hazards            | Root `AGENTS.md`, `.agents/rules/`, `docs/conventions/`, `REVIEW.md` |

## Precedence

**Repo rulebooks win.** They name this repo's helpers, tables and hazards; this file is imported
general advice. Where the two disagree the repo's rule is the more specific one. The points
reconciled on import, so a future re-import does not silently undo them:

| Upstream said                                | This repo says                                                                                                                                                                                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write a test for every change, test-first    | A test that survives into the PR covers an **edge case, an error path you own, or a decision**. One written to check your own work is scaffolding: run it scoped, then delete it in the PR-prep sweep (`docs/conventions/tests-earn-their-place.md`) |
| Extract a function whenever one can be named | Extract **in place**. A helper earns its own module at two call sites; at one it inlines at the donor (`.agents/rules/code-reuse.md`, root `AGENTS.md` § "The extra helper")                                                                         |
| `TODO` with an owner                         | A `TODO`/`FIXME` carries a ticket reference or it is deleted (`docs/coding-agents/comments.md`)                                                                                                                                                      |
| Wrap every primitive in a newtype            | Inside a module, yes. Not in a type that forms a **cross-process contract** — changing one of those is a wire change, not a refactor                                                                                                                 |
| Delete stale scaffolding as you go           | Dead code, yes. Gating an error report, swallowing a catch or editing a failing test is **quieting a signal**, not cleanup: that is the user's call (`docs/conventions/bugfix-discipline.md`)                                                        |

## When to Use

- **Writing new code**: to get it right before review.
- **Reviewing pull requests**: to give feedback that cites a principle, not a preference.
- **Refactoring**: to name the smell instead of gesturing at it.

## 1. Meaningful Names

- **Intention-revealing**: `elapsed_time_in_days`, not `d`.
- **No disinformation**: don't call it a list if it is a map.
- **Meaningful distinctions**: `ProductData` vs `ProductInfo` is noise. If two names differ only
  by a filler word, one of them should not exist.
- **Searchable**: a name you can grep beats a name you have to decode (`genymdhms`).
- **Types are nouns.** A `…Manager` almost always means "I didn't decide what this does" — name
  the job instead, or better, use free functions in a module named for the domain.
- **Functions are verbs**, and a function named like a query answers rather than acts.
- **Follow the language's casing** and let the formatter settle the rest.

## 2. Functions

- **Small.** Smaller than you think. A screen is already long.
- **Do one thing.** If you can extract a meaningfully-named function from the middle of it, it was
  doing more than one thing.
- **Extract in place.** The extraction is a private function in the same file. A helper earns its
  own module at two call sites; at one it inlines at the donor (`.agents/rules/code-reuse.md`).
  "I could name this block" is not a licence for a new file.
- **One level of abstraction per function.** Don't mix "charge the customer" with byte fiddling.
- **Descriptive names beat comments**: `is_password_valid` over `check`.
- **Arguments**: 0–2 is comfortable, 3 needs a reason, more than 3 wants a parameter object.
- **Boolean parameters are a smell**: `render(true)` tells the reader nothing. Take an enum or
  split the function.
- **No hidden side effects.** A function named like a query should not mutate, write a file, or
  fire a request. Keep I/O at the edges and the core transformational.

## 3. Prefer Types to Comments

Both stacks here have type systems strong enough to say what a comment would say. Use them, and
the comment stops being able to go stale.

- **Enums instead of booleans**: `Visibility::Private` over `is_private: bool`.
- **Distinct types instead of interchangeable primitives**, so two ids of different kinds cannot
  be swapped by accident. Keep them inside the module — a type that crosses a process boundary
  (a serialized payload, a persisted row, a validated request) is a contract, and changing its
  shape is a wire change both sides have to make together.
- **Make illegal states unrepresentable.** Instead of a record with four optional fields where
  only certain combinations are valid, use one variant per real state:

  ```ts
  type LoadState<T> = { status: 'loading' } | { status: 'error'; error: LoadError } | { status: 'ready'; data: T };
  ```

  The branch over `status` is then exhaustively checked, and there is no `data` to read while
  loading.

- **Parse, don't validate.** Convert untrusted input into a type that carries the guarantee once,
  at the boundary, rather than re-checking the same invariant at every call site.

## 4. Comments

- **Don't comment bad code — rewrite it.** Most comments are an apology for a name.
- **Explain yourself in code**:

  ```rust
  // Check if employee is eligible for full benefits
  if employee.flags & HOURLY != 0 && employee.age > 65 {
  ```

  vs

  ```rust
  if employee.is_eligible_for_full_benefits() {
  ```

- **Good comments**: why-not-what, a non-obvious invariant, the reason for a workaround, the intent
  of a regex, a living cross-process sync pointer, a `TODO` carrying a ticket, and doc comments
  that document a public API and its errors.
- **Bad comments**: restating the code, commented-out code (the history remembers), banner
  dividers, changelogs in the file header, provenance ("ported from X", "moved from Y"), a bare
  `TODO`, and anything that has drifted from the code below it.
- Full policy, and the PR-prep sweep that enforces it: `docs/coding-agents/comments.md`.

## 5. Data and Behaviour

- **Composition over inheritance — there is no inheritance.** Share behaviour through the
  language's composition mechanism, not a type hierarchy.
- **An interface describes a capability, not a taxonomy.** Define one when more than one type must
  be used interchangeably, not to give a single type a parent.
- **Plain data is fine.** A record of public fields with no methods is a legitimate design — a
  DTO, a row model, a props type. Don't wrap it in ceremonial getters and setters.
- **Don't reach through objects** (Law of Demeter). `a.get_b().get_c().do_something()` couples you
  to a shape you don't own; ask the thing you have for what you need. Builder and iterator chains
  are _not_ violations: each link returns the same abstraction on purpose.
- **Prefer immutability.** Return new values rather than mutating arguments — especially where the
  framework decides what changed by identity.

## 6. Errors

- **Model failure in the signature.** A caller that cannot see the failure will not handle it.
- **Type your errors** so the caller can branch on the kind, not on a message string.
- **Add context as the error travels.** A failure that surfaces "No such file" with no path is a
  bug report nobody can act on.
- **Absence and failure are different types**, and neither is a sentinel. `-1`, `""` and a magic
  null say nothing.
- **Handle errors where you can act.** A catch that logs and continues with a half-built value is
  worse than the crash it prevented.
- **Use the language's error combinators** so the happy path reads top to bottom instead of
  nesting inside the error handling.
- **Each layer's taxonomy is already fixed** — a queue worker's retry/terminal/delayed mapping, an
  HTTP handler's error type. Map into the existing one rather than inventing a parallel scheme
  (`docs/conventions/error-handling-pattern.md`).

## 7. Functional Style

- **Transformations over index loops.** `filter`/`map`/`sum` says what you want; a loop with a
  mutable accumulator makes the reader reconstruct it. Keep the chain short enough to read — when
  it needs a comment mid-chain, name an intermediate binding or extract a function.
- **Push side effects to the edge.** A pure core (transform data, decide) with a thin effectful
  shell (DB, HTTP, filesystem) is the single largest testability win available.
- **Small composable functions over flags.** Two clear functions beat one function with a `mode`
  parameter branching at the top.
- **Beware the unnecessary intermediate collection.** Materialising a sequence only to walk it once
  is the functional equivalent of a temporary variable nobody reads.

## 8. Formatting

- **The newspaper metaphor**: the file opens with the high-level story; details live further down.
  Called functions below callers reads top-down.
- **Vertical density**: related lines stay together; a blank line separates thoughts.
- **Declare variables near their use**, not in a prologue.
- **Let the formatter win.** It is not an opinion to negotiate with.

## 9. Tests

- **A test earns its place or it goes.** A surviving test covers an edge case, an error path you
  own, or a decision someone could plausibly have made differently. The happy path doing the
  obvious thing with obvious input is scaffolding: run it scoped, then delete it in the PR-prep
  sweep. Keep/drop lists: `docs/conventions/tests-earn-their-place.md`.
- **Test-first is still a fine way to pin an interface** before the implementation biases it. It
  does not exempt the result from the bar above.
- **F.I.R.S.T.**: Fast, Independent, Repeatable, Self-validating, Timely.
- **One reason to fail per test.** A test named `creates_workspace_with_default_branch` should not
  also assert the audit log.
- **Names describe the behaviour, not the mechanism**: `rejects_backgrounded_command` beats
  `test_bash_2`.
- **Test through the public surface.** If a test can only be written against a private helper, the
  helper probably wants to be its own module with its own public API.
- **Test code is production code.** The same naming and duplication rules apply.

## 10. Smells and Heuristics

- **Rigidity**: a small change forces edits across many files.
- **Fragility**: a change breaks things that look unrelated.
- **Immobility**: a useful piece can't be reused without dragging its world along.
- **Viscosity**: the hacky way is easier than the right way (usually slow tests or slow builds).
- **Needless complexity**: abstraction built for a requirement that never arrived.
- **Repetition**: the same decision expressed in three places. But duplication is cheaper than the
  wrong abstraction — wait for the third occurrence, and make sure the copies are the same
  _decision_, not merely the same _shape_.
- **Primitive obsession**: the same untyped tuple threaded through five functions.
- **Stale scaffolding**: dead code, unused feature flags, back-compat shims, a scaffolding test
  that merged by inertia — delete them as you go. Quieting a signal is not cleanup: gating an
  error report, swallowing a catch, downgrading a severity or editing a failing test changes the
  reporting and not the behaviour, and that call belongs to the user
  (`docs/conventions/bugfix-discipline.md`).

## Implementation Checklist

- [ ] Does each function do one thing, at one level of abstraction?
- [ ] Are the names intention-revealing and greppable?
- [ ] Did a type replace what would have been a comment or a runtime check?
- [ ] Are errors typed, contextual, and impossible to ignore silently?
- [ ] Is the core pure, with I/O at the edges?
- [ ] Is anything mutated that could have been rebuilt?
- [ ] More than two arguments, or a boolean argument?
- [ ] Does every test in the diff cover an edge case, an error path, or a decision?
- [ ] Does the stack's own skill agree — `/rust-best-practices`, `/react-best-practices`?
- [ ] Does the repo gate pass (root `AGENTS.md` § Commands)?

## Limitations

- These are heuristics, not laws. A rule that makes a specific piece of code harder to read loses
  to the code.
- Refactoring is not a licence to change behaviour. Keep the diff minimal and reviewable; don't
  widen the change beyond what was asked.
- This is no substitute for running the project's own lint, typecheck and test commands.
- Stop and ask when the inputs, permissions, or success criteria are missing.
