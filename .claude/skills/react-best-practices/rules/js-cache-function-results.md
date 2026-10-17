---
title: Cache Repeated Function Calls
impact: MEDIUM
impactDescription: avoid redundant computation
tags: javascript, cache, memoization, performance
---

## Cache Repeated Function Calls

Use a module-level Map to cache function results when the same function is called repeatedly with the same inputs during render.

**Incorrect (redundant computation):**

```typescript
function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // slugify() called 100+ times for same project names
        const slug = slugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

**Correct (cached results):**

```typescript
// Module-level cache
const slugifyCache = new Map<string, string>()

function cachedSlugify(text: string): string {
  if (slugifyCache.has(text)) {
    return slugifyCache.get(text)!
  }
  const result = slugify(text)
  slugifyCache.set(text, result)
  return result
}

function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // Computed only once per unique project name
        const slug = cachedSlugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

Keyed caches like this are fine because the function is **pure**: the same input always maps to the same output, so a stale entry is impossible.

**Do not cache a runtime-derived value this way.** A module-level snapshot of auth state, a feature flag, config, or the current time freezes at first import and never updates — the login that just succeeded keeps reading the logged-out snapshot. See `docs/conventions/no-module-level-env-cache.md`:

```typescript
// Wrong: frozen at first call, never reflects a later login or logout
let isLoggedInCache: boolean | null = null;

function isLoggedIn(): boolean {
  if (isLoggedInCache !== null) return isLoggedInCache;
  isLoggedInCache = document.cookie.includes('auth=');
  return isLoggedInCache;
}
```

Read that kind of value per call, or hold it in state the UI already subscribes to.
