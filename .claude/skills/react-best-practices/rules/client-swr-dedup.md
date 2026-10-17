---
title: Use SWR for Automatic Deduplication
impact: MEDIUM-HIGH
impactDescription: automatic deduplication
tags: client, swr, deduplication, data-fetching
---

## Use SWR for Automatic Deduplication

SWR gives request deduplication, caching, and revalidation across component instances: ten components asking for the same key produce one request.

**In this repo the `useSWR` call lives in a `model.ts` hook, never in a component.** Every endpoint gets a typed model function plus a colocated `use<Resource>` hook, and components call the hook. That rule exists _because_ of deduplication: it only works when every caller shares one cache key, which a hand-rolled `useSWR` at a call site quietly breaks.

**Incorrect (no deduplication, each instance fetches):**

```tsx
function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then(setUsers);
  }, []);
}
```

**Also incorrect (deduplicates, but the key and options drift per call site):**

```tsx
function UserList() {
  const { data: users } = useSWR('/api/users', fetcher);
}
```

**Correct (one model function, one hook, one cache key):**

```ts
// src/api-models/user/model.ts
export function fetchWorkspaceUsers(workspaceId: string): Promise<WorkspaceUsersResponseType> {
  return fetchEndpointData(`/v1/workspace/user/list/${workspaceId}`);
}

function fetchWorkspaceUsersSWR([_key, workspaceId]: [string, string]) {
  return fetchWorkspaceUsers(workspaceId);
}

export function useWorkspaceUsers(workspaceId: string | undefined) {
  return useSWR<WorkspaceUsersResponseType>(
    workspaceId ? [`workspace-users-${workspaceId}`, workspaceId] : null,
    fetchWorkspaceUsersSWR,
    { revalidateOnFocus: false },
  );
}
```

```tsx
function UserList({ workspaceId }: { workspaceId: string }) {
  const { data: users } = useWorkspaceUsers(workspaceId);
}
```

The cache key interpolates every argument that affects the result, all fetcher arguments ride in the tuple rather than being closed over, and SWR options are baked into the hook instead of each call site. See the data-fetching section of the root `AGENTS.md`.

Reference: [https://swr.vercel.app](https://swr.vercel.app)
