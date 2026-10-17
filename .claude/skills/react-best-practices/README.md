# React Best Practices

Performance rules for client-rendered React, adapted from [Vercel's React Best Practices](https://github.com/vercel/react-best-practices) (MIT, originally by [@shuding](https://x.com/shuding)).

## What was removed, and why

Upstream carries 70 rules; 49 survive here. Two whole bodies of material were cut.

**Next.js and server rendering.** This repo ships a client-only React 19 SPA on Vite; the backend is Rust. Anything that only runs with a Node render pass was deleted rather than adapted:

- the whole `server-` section (server actions, RSC props/serialization, `React.cache`, `after()`, LRU caches, parallel RSC fetching)
- `async-api-routes` (Next.js route handlers)
- `async-suspense-boundaries` (async server components streaming into a shell)
- `rendering-hydration-no-flicker`, `rendering-hydration-suppress-warning` (no SSR, so no hydration)
- `rendering-script-defer-async` (no hand-written document `<head>`)

**Bundle-size optimization.** The app ships as one bundle: no `React.lazy`, no route-level code splitting, no chunk strategy. The entire `bundle-` section went with it, since none of it describes a lever anyone here pulls:

- `bundle-dynamic-imports`, `bundle-conditional`, `bundle-preload` (lazy loading and chunk preloading)
- `bundle-barrel-imports`, `bundle-analyzable-paths` (import cost and bundler static analysis)
- `bundle-defer-third-party` (deferring analytics into its own chunk)

The `preloadModule` / `preinitModule` half of `rendering-resource-hints` went for the same reason; `preconnect`, `preload`, and `preinit` stay because fonts and API origins still benefit.

**Do not reintroduce either body of material.** If a rule only makes sense with a server render or with code splitting, it does not belong in this repo.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `_sections.md` - Section metadata (titles, impacts, descriptions)
  - `_template.md` - Template for creating new rules
  - `area-description.md` - Individual rule files
- `SKILL.md` - Skill entry point and quick-reference index
- `AGENTS.md` - Compiled output (generated, do not hand-edit)
- `scripts/build-agents-md.py` - Regenerates `AGENTS.md` from `rules/`

## Adding or changing a rule

1. Copy `rules/_template.md` to `rules/area-description.md`, using the prefix for its section:
   `async-`, `client-`, `rerender-`, `rendering-`, `js-`, `advanced-`
2. Fill in the frontmatter (`title`, `impact`, `impactDescription`, `tags`) and the body.
3. Regenerate the compiled document and update the index in `SKILL.md`:

   ```bash
   python3 scripts/build-agents-md.py .
   ```

Section numbers and rule IDs are derived at build time; rules sort alphabetically by title within their section, so there are no numbers to maintain by hand.

## Impact Levels

`CRITICAL` · `HIGH` · `MEDIUM-HIGH` · `MEDIUM` · `LOW-MEDIUM` · `LOW`
