# Performance Plan — Coding Interview Preparation Platform

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Page Load (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| API Response Time (p50) | < 200ms | Server logs |
| API Response Time (p95) | < 500ms | Server logs |
| Problem List Query | < 100ms | Database query log |
| Monaco Editor Load | < 1s (lazy) | Chrome DevTools |
| Code Execution (quick) | < 2s | Judge timing |
| Lighthouse Score | > 85 | Lighthouse |

---

## 1. Database Optimization

### Indexing Strategy
```prisma
model CodingProblem {
  // Indexes for common query patterns
  @@index([difficulty])
  @@index([companyId])
  @@index([topicId])
  @@index([languageId])
  @@index([status])
  @@index([title]) // For search
  @@index([createdAt]) // For sorting by newest
  
  // Compound indexes for filtered queries
  @@index([difficulty, companyId, topicId])
  @@index([companyId, languageId])
}

model ProblemSubmission {
  @@index([userId, problemId])
  @@index([problemId, status])
  @@index([userId, createdAt]) // For user submission history
}
```

### Pagination
- **Cursor-based pagination** for problem lists (avoids OFFSET performance issues)
- **Offset-based pagination** for smaller datasets (< 1000 rows)
- Default limit: 20, max: 50

### Query Optimization
- Use `select` instead of `include` when only specific fields needed
- Batch queries with `findMany` instead of looped `findUnique`
- Use Prisma's `raw` for complex aggregation queries
- Implement Redis caching for frequently accessed data

---

## 2. Next.js Optimization

### Server Components
- Problem list page → **Server Component** (fetch data on server)
- Problem detail page → **Server Component** (SEO-friendly)
- Dashboard → **Server Component** with client islands for interactivity

### Client Components (where needed)
- Monaco Editor → Lazy-loaded (`next/dynamic`)
- Filters → Client component for instant UI response
- Judge results → Client component for real-time updates
- Contests timer → Client component

### Code Splitting
```typescript
// Monaco Editor - lazy loaded
const CodeEditor = dynamic(() => import('@/components/editor/code-editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

// AI features - lazy loaded
const AiPanel = dynamic(() => import('@/components/ai/ai-panel'), {
  ssr: false,
});
```

### Image Optimization
- Company logos → Use `next/image` with WebP format
- User avatars → Serve at appropriate sizes via `next/image`
- Placeholder blur effects for loading states

---

## 3. Caching Strategy

### In-Memory Cache (Node.js)
```typescript
// Simple in-memory cache for frequently accessed data
const problemListCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60_000; // 60 seconds

function getCachedProblemList(key: string) {
  const cached = problemListCache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;
  return null;
}
```

### Database-Level Caching (Prisma)
- Enable Prisma's built-in query caching
- Use materialized views for leaderboard/complex aggregations

### API Response Caching
- Add `Cache-Control` headers to problem list responses
- `stale-while-revalidate` for non-critical data

---

## 4. Frontend Performance

### Bundle Analysis
```bash
# Run after each major phase
npx next build
# Check .next/analyze output for bundle sizes
```

### Critical Rendering Path
- Inline critical CSS (Tailwind handles this)
- Preload fonts (Fraunces, Manrope)
- Defer non-critical JavaScript
- Use `priority` prop on above-the-fold images

### Virtual Scrolling
For problem lists with 500+ items:
```typescript
// Consider using @tanstack/react-virtual for large lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Debounced Search
```typescript
// 300ms debounce on search input
const debouncedSearch = useMemo(
  () => debounce((value: string) => setSearch(value), 300),
  []
);
```

---

## 5. Performance Monitoring

### Server-Side Logging
```typescript
// Monitor slow API routes
export async function GET(request: NextRequest) {
  const start = performance.now();
  // ... handle request
  const duration = performance.now() - start;
  if (duration > 500) {
    console.warn(`Slow API: ${request.url} - ${duration}ms`);
  }
}
```

### Web Vitals
```typescript
// Report Core Web Vitals
export function reportWebVitals(metric: any) {
  console.log(metric);
  // Send to analytics service
}
```

---

## 6. Judge Performance

### Time Limits Per Language
| Language | Time Limit | Memory Limit |
|----------|-----------|--------------|
| Java | 2x base | 512MB |
| Python | 3x base | 384MB |
| C++ | 1x base | 256MB |
| JavaScript | 2x base | 512MB |
| Go | 1x base | 256MB |
| Rust | 1x base | 256MB |

### Execution Queue
- Implement a simple queue for submission processing
- Max 5 concurrent executions
- Return submission ID immediately, poll for status
