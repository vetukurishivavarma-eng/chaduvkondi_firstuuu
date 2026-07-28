# Migration Strategy — Zero-Breakage Approach

## Core Principle
**Never modify existing code unless absolutely necessary. Always extend.**

---

## 1. Database Migration Strategy

### Approach: Prisma Migrate with New Models Only

```prisma
// ❌ BAD: Modifying existing CodeChallenge model
model CodeChallenge {
  // Adding fields to existing model risks breaking queries
}

// ✅ GOOD: New model alongside existing
model CodingProblem {
  // New model, new relations, zero impact on CodeChallenge
}
```

### Migration Steps:
1. Add new enums, models, and relations to `schema.prisma`
2. Generate migration: `npx prisma migrate dev --name add_coding_platform`
3. Verify existing models unchanged: `npx prisma db push` (dry-run)
4. Seed new data with `prisma/seed.ts` (extend, don't modify existing seed)
5. Test: Existing API routes still return correct data

### Rollback Plan:
- Keep migration file versioned
- `npx prisma migrate down` if needed (though Prisma doesn't natively support this — we'd use a down migration)

---

## 2. API Migration Strategy

### Approach: New Routes, New Endpoints

```typescript
// ❌ BAD: Modifying existing /api/challenges route
// This route is used by multiple frontend pages

// ✅ GOOD: New /api/problems route
// Existing /api/challenges continues to work unchanged
```

### Coexistence:
| Old Route | Status | New Route | Status |
|-----------|--------|-----------|--------|
| `/api/challenges` | **Unchanged** | `/api/problems` | **New** |
| `/api/playground` | **Unchanged** | `/api/judge` | **New** |
| `/api/ai-tutor` | **Unchanged** | `/api/ai` | **New** |
| `/api/battles` | **Unchanged** | `/api/contests` | **New** |
| `/api/dashboard` | **Enhanced** | — | — |

### Dashboard Enhancement:
- New fields added to existing response (not removed)
- Frontend renders new fields when available, gracefully degrades otherwise

---

## 3. Frontend Migration Strategy

### Approach: New Pages, New Routes

```tsx
// ❌ BAD: Replacing /challenges page
// Existing users may have bookmarks/links

// ✅ GOOD: New /problems page alongside /challenges
```

### Sidebar Navigation:
```
// Enhanced nav items (existing preserved, new added)
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: Code2 },       // NEW
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/spaced-repetition", label: "Review", icon: RotateCcw },
  { href: "/roadmaps", label: "Roadmaps", icon: Map },
  { href: "/playground", label: "Playground", icon: Terminal },
  { href: "/challenges", label: "Challenges", icon: Puzzle },  // PRESERVED
  { href: "/contests", label: "Contests", icon: Trophy },      // NEW
  { href: "/interviews", label: "Interviews", icon: Users },   // NEW
  { href: "/badges", label: "Badges", icon: Medal },
  { href: "/ai-tutor", label: "AI Tutor", icon: Wand2 },
  { href: "/battles", label: "Battles", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: Sparkles },
];
```

### Middleware Updates:
```typescript
// Add new protected paths
const protectedPaths = [
  "/dashboard", "/quiz", "/admin", "/leaderboard",
  "/onboarding", "/profile", "/spaced-repetition", "/roadmaps",
  "/playground", "/battles", "/ai-tutor", "/challenges",
  "/badges",
  "/problems",    // NEW
  "/contests",    // NEW
  "/interviews",  // NEW
  "/companies",   // NEW
];
```

---

## 4. Data Migration Strategy

### Seed Data Updates:
- **Existing seeds**: Left completely untouched
- **New seeds**: Added at the end of `prisma/seed.ts` or in a new `prisma/seeds/` directory

### Zero-Downtime Data Loading:
```typescript
// In seed.ts, new seeding is additive:
const existingCompanies = await prisma.company.count();
if (existingCompanies === 0) {
  await prisma.company.createMany({ data: COMPANIES });
}
```

---

## 5. Testing Strategy

### Regression Tests:
1. Run existing seed to verify DB state
2. Hit every existing API endpoint — verify same response format
3. Navigate to every existing page — verify it renders correctly
4. Run `npm run build` — verify no type errors

### New Feature Tests:
1. Create test problems via API
2. Submit solutions via judge API
3. Generate mock interview
4. Register for contest

---

## 6. Git Strategy

```bash
# Feature branch approach
git checkout -b feat/coding-interview-platform

# Commit 1: Database schema
git add prisma/schema.prisma
git commit -m "feat(db): add CodingProblem, Company, Topic, Contest, Interview models"

# Commit 2: Constants
git add src/lib/constants/
git commit -m "feat(constants): add company, topic, language, difficulty configs"

# Commit 3: Problem API routes
git add src/app/api/problems/
git commit -m "feat(api): add coding problem CRUD, search, submit, bookmark endpoints"

# ... and so on for each phase
```

## Summary of What Stays Unchanged
| Component | Status |
|-----------|--------|
| `User` model (existing fields) | ✅ Unchanged |
| All auth APIs | ✅ Unchanged |
| Quiz system | ✅ Unchanged |
| Code Challenges | ✅ Unchanged |
| Battles | ✅ Unchanged |
| AI Tutor | ✅ Unchanged |
| Playground | ✅ Unchanged |
| Badges | ✅ Unchanged |
| Spaced Repetition | ✅ Unchanged |
| Roadmaps | ✅ Unchanged |
| All existing UI components | ✅ Unchanged |
| All existing lib utilities | ✅ Unchanged |
| Middleware (base logic) | ✅ Unchanged (enhanced) |
