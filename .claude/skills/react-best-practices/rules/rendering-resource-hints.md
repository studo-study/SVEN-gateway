---
title: Use React DOM Resource Hints
impact: HIGH
impactDescription: reduces load time for critical resources
tags: rendering, preload, preconnect, prefetch, resource-hints
---

## Use React DOM Resource Hints

React DOM provides APIs to hint the browser about resources it will need, so the connection or fetch
starts before the code that needs it runs.

- **`prefetchDNS(href)`**: Resolve DNS for a domain you expect to connect to
- **`preconnect(href)`**: Establish connection (DNS + TCP + TLS) to a server
- **`preload(href, options)`**: Fetch a resource (stylesheet, font, script, image) you'll use soon
- **`preinit(href, options)`**: Fetch and evaluate a stylesheet or script

**Example (preconnect to third-party APIs):**

```tsx
import { preconnect, prefetchDNS } from 'react-dom';

function App() {
  prefetchDNS('https://analytics.example.com');
  preconnect('https://api.example.com');

  return <main>{/* content */}</main>;
}
```

**Example (preload a critical font):**

```tsx
import { preload } from 'react-dom';

function App({ children }: { children: React.ReactNode }) {
  preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });

  return <>{children}</>;
}
```

**When to use each:**

| API           | Use case                                    |
| ------------- | ------------------------------------------- |
| `prefetchDNS` | Third-party domains you'll connect to later |
| `preconnect`  | APIs or CDNs you'll fetch from immediately  |
| `preload`     | Critical resources needed for current page  |
| `preinit`     | Stylesheets/scripts that must execute early |

Reference: [React DOM Resource Preloading APIs](https://react.dev/reference/react-dom#resource-preloading-apis)
