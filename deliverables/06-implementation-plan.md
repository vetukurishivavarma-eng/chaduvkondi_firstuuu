# Implementation Plan — Coding Interview Preparation Platform

## Overview
**Total Estimated Effort:** 8-12 weeks (parallel tracks where possible)
**Strategy:** Extend, never replace. Each phase adds new capabilities without touching existing code.

---

## PHASE 1: Foundation (Week 1-2)

### 1.1 Database Schema Migration
**Files:** `prisma/schema.prisma`, `prisma/seed.ts`

**Tasks:**
- [ ] Add new enums: `ProblemDifficulty`, `ProblemStatus`, `InterviewType`, `InterviewStatus`, `ContestStatus`, `SubmissionStatus`
- [ ] Add new models: `CodingProblem`, `Company`, `ProgrammingLanguage`, `Topic`, `CompanyTag`, `ProblemSubmission`, `ProblemBookmark`, `UserProblemProgress`, `MockInterview`, `InterviewProblem`, `InterviewQuestion`, `Contest`, `ContestProblem`, `ContestRegistration`, `ContestRanking`, `AiGenerationLog`
- [ ] Add relations to existing `User` model
- [ ] Run `prisma migrate dev` to create migration
- [ ] Create seed data: Companies (Amazon, Google, etc.), Programming Languages (13 languages), Topics (40+ topics), 20 original sample problems
- [ ] Verify: `npm run db:seed` works, `prisma studio` shows all models

**Risk:** Migration may conflict with existing data. **Mitigation:** Generate migration that handles existing rows gracefully (nullable new fields, defaults).

### 1.2 Library Installation
```bash
npm install @monaco-editor/react
# No other major external dependencies needed initially
```

### 1.3 Constants & Configuration Files
**Files:** `src/lib/constants/companies.ts`, `src/lib/constants/topics.ts`, `src/lib/constants/languages.ts`, `src/lib/constants/difficulties.ts`

**Tasks:**
- [ ] Define `COMPANIES` array with names, slugs, logos, descriptions
- [ ] Define `TOPICS` array with names, slugs, parent relationships
- [ ] Define `LANGUAGES` array with Monaco IDs, Judge0 IDs, icons, colors
- [ ] Export all as typed constants

---

## PHASE 2: Core Coding Problems (Week 2-4)

### 2.1 API Routes — Problems
**Files:** `src/app/api/problems/route.ts`, `src/app/api/problems/[slug]/route.ts`, `src/app/api/problems/[slug]/submit/route.ts`, `src/app/api/problems/[slug]/bookmark/route.ts`, `src/app/api/problems/[slug]/solution/route.ts`, `src/app/api/problems/search/route.ts`

**Tasks:**
- [ ] `GET /api/problems` — List with pagination, filters (difficulty, company, topic, language, status, search), sorting
- [ ] `GET /api/problems/[slug]` — Full problem detail with stats
- [ ] `POST /api/problems/[slug]/submit` — Submit code for judging (calls judge service)
- [ ] `POST /api/problems/[slug]/bookmark` — Toggle bookmark
- [ ] `GET /api/problems/[slug]/solution` — Solution (after solve)
- [ ] `GET /api/problems/search` — Unified search
- [ ] All routes: Use existing `getSession()` / `requireAuth()` pattern
- [ ] All routes: Use existing `successResponse` / `errorResponse` / `handleApiError` pattern
- [ ] All routes: Use pagination utility

**Validation:** Test each endpoint with curl/Postman

### 2.2 Frontend — Problem Listing Page
**Files:** `src/app/problems/page.tsx`, `src/app/problems/layout.tsx`, `src/components/problems/problem-card.tsx`, `src/components/problems/problem-list.tsx`, `src/components/problems/problem-filters.tsx`, `src/components/problems/problem-search.tsx`, `src/components/shared/pagination.tsx`

**Tasks:**
- [ ] Problem filters component with difficulty, company, topic, language, status, sort dropdowns
- [ ] Search input with debounced queries
- [ ] Problem card component with title, difficulty badge, company tag, acceptance rate, status icon
- [ ] Grid layout for cards
- [ ] Pagination component
- [ ] URL param driven filters (shareable filtered URLs)
- [ ] Add "Problems" to sidebar navigation

**UI Polish:** Card hover effects, filter animation, loading skeletons, empty states

### 2.3 Frontend — Problem Solve Page
**Files:** `src/app/problems/[slug]/page.tsx`, `src/components/problems/problem-description.tsx`, `src/components/editor/code-editor.tsx`, `src/components/editor/editor-toolbar.tsx`, `src/components/editor/language-selector.tsx`, `src/components/judge/judge-results.tsx`, `src/components/judge/judge-submission.tsx`, `src/app/problems/[slug]/solution/page.tsx`, `src/components/problems/problem-solution.tsx`

**Tasks:**
- [ ] Monaco Editor integration (lazy loaded, SSR disabled)
- [ ] Problem description panel (story, problem statement, I/O format, constraints, examples, edge cases, hints)
- [ ] Language selector dropdown
- [ ] Run/Submit buttons
- [ ] Judge results panel with test case results
- [ ] Solution view accessible after solving
- [ ] Multi-language solution tabs
- [ ] Keyboard shortcuts (Ctrl+Enter = Run, Ctrl+Shift+Enter = Submit)
- [ ] Fullscreen toggle for editor

**UI Polish:** Split panel layout (description left, editor right), resizable, smooth transitions

---

## PHASE 3: Online Judge (Week 3-5)

### 3.1 Judge Service
**Files:** `src/lib/judge/index.ts`, `src/lib/judge/piston.ts`, `src/lib/judge/judge0.ts`, `src/lib/judge/sandbox.ts`

**Tasks:**
- [ ] Implement Piston API integration (free, public code execution API)
- [ ] Implement Judge0 CE integration (self-hosted option)
- [ ] Abstract judge interface for swapping backends
- [ ] Time limit enforcement (per problem)
- [ ] Memory limit enforcement
- [ ] Support all 13 languages
- [ ] Handle compilation errors, runtime errors, TLE, MLE

### 3.2 Judge API Routes
**Files:** `src/app/api/judge/route.ts`, `src/app/api/judge/run/route.ts`, `src/app/api/judge/submissions/[id]/route.ts`

**Tasks:**
- [ ] `POST /api/judge/submit` — Submit code with test cases
- [ ] `POST /api/judge/run` — Quick run without test cases
- [ ] `GET /api/judge/submissions/[id]` — Poll for status
- [ ] Update problem submission stats on completion

### 3.3 Enhance Existing Playground
**Files:** `src/app/playground/page.tsx`, `src/app/api/playground/route.ts`

**Tasks:**
- [ ] Replace textarea with Monaco Editor in playground
- [ ] Improve output display
- [ ] Add more languages

---

## PHASE 4: AI Features (Week 4-6)

### 4.1 AI Problem Generator
**Files:** `src/lib/ai/index.ts`, `src/lib/ai/generate-problem.ts`, `src/app/api/ai/generate-problem/route.ts`

**Tasks:**
- [ ] Create structured prompt for generating original coding problems
- [ ] Include all required fields: title, statement, I/O format, constraints, examples, edge cases, hints, solutions, test cases
- [ ] Ensure uniqueness via prompt engineering (include existing problem titles to avoid duplicates)
- [ ] Implement caching to avoid regenerating identical prompts
- [ ] Admin approval flow for AI-generated problems

### 4.2 AI Explanations
**Files:** `src/lib/ai/explain-code.ts`, `src/app/api/ai/explain/route.ts`

**Tasks:**
- [ ] Time complexity explanation
- [ ] Space complexity explanation
- [ ] Solution walkthrough
- [ ] Bug detection
- [ ] Code optimization suggestions
- [ ] Code conversion between languages
- [ ] Test case generation
- [ ] Compiler error explanations

### 4.3 AI Integration in Problem Page
**Files:** `src/app/problems/[slug]/page.tsx`, `src/components/editor/code-editor.tsx`

**Tasks:**
- [ ] "Explain" button next to problem
- [ ] "Optimize Code" button in editor
- [ ] "Find Bugs" button
- [ ] AI response display in slide-out panel or modal

---

## PHASE 5: Companies & Topics (Week 5-6)

### 5.1 Company & Topic Pages
**Files:** `src/app/companies/[slug]/page.tsx`, `src/app/api/companies/route.ts`, `src/app/api/topics/route.ts`, `src/app/api/languages/route.ts`

**Tasks:**
- [ ] Company detail page showing all problems for that company
- [ ] Topic detail page showing all problems for that topic
- [ ] Language page showing all problems for that language
- [ ] Company-specific statistics and interview tips
- [ ] Topic progress tracking

---

## PHASE 6: Mock Interviews (Week 6-8)

### 6.1 Interview Generator
**Files:** `src/app/interviews/generate/page.tsx`, `src/components/interviews/interview-generator.tsx`, `src/app/api/interviews/generate/route.ts`

**Tasks:**
- [ ] Interview configuration form (company, experience, duration, types, language)
- [ ] AI-powered question generation based on configuration
- [ ] Mix of coding problems, MCQs, SQL, debugging, system design
- [ ] Save interview session to database

### 6.2 Interview Session
**Files:** `src/app/interviews/[id]/page.tsx`, `src/components/interviews/interview-timer.tsx`, `src/components/interviews/interview-progress.tsx`

**Tasks:**
- [ ] Countdown timer with warning states
- [ ] Question navigation
- [ ] MCQ selection UI
- [ ] Coding editor for coding questions
- [ ] Text input for system design answers
- [ ] Auto-save answers periodically

### 6.3 Interview Evaluation
**Files:** `src/app/interviews/[id]/results/page.tsx`, `src/components/interviews/interview-results.tsx`, `src/app/api/interviews/[id]/results/route.ts`

**Tasks:**
- [ ] Auto-evaluation of MCQs
- [ ] AI-powered evaluation of coding solutions
- [ ] Overall score calculation
- [ ] Detailed feedback per question
- [ ] Improvement suggestions

---

## PHASE 7: Coding Contests (Week 7-9)

### 7.1 Contest System
**Files:** `src/app/contests/page.tsx`, `src/app/contests/[slug]/page.tsx`, `src/components/contests/contest-card.tsx`, `src/components/contests/contest-timer.tsx`, `src/app/api/contests/route.ts`, `src/app/api/contests/[slug]/route.ts`, `src/app/api/contests/[slug]/register/route.ts`, `src/app/api/contests/[slug]/start/route.ts`, `src/app/api/contests/[slug]/submit/route.ts`, `src/app/api/contests/[slug]/rankings/route.ts`

**Tasks:**
- [ ] Contest creation (admin)
- [ ] Contest listing (upcoming, active, past)
- [ ] Contest registration
- [ ] Contest timer
- [ ] Problem submission during contest
- [ ] Live rankings
- [ ] Virtual contest support (allow starting after contest ends)
- [ ] Practice mode after contest

---

## PHASE 8: Enhanced Dashboard & Leaderboard (Week 8-9)

### 8.1 Coding Stats on Dashboard
**Files:** `src/components/dashboard/problems-summary.tsx`, `src/components/dashboard/progress-heatmap.tsx`, `src/components/dashboard/coding-streak.tsx`, `src/components/dashboard/recent-submissions.tsx`

**Tasks:**
- [ ] Solved/attempted statistics
- [ ] Difficulty breakdown chart
- [ ] Company-wise solved count
- [ ] Topic-wise progress
- [ ] GitHub-style contribution heatmap
- [ ] Recent coding submissions feed

### 8.2 Enhanced Leaderboards
**Files:** `src/components/leaderboard/`, `src/app/api/leaderboard/problems/route.ts`

**Tasks:**
- [ ] Coding problems leaderboard (most problems solved)
- [ ] Company-specific leaderboard
- [ ] Language-specific leaderboard
- [ ] Weekly/Monthly coding challenge leaderboard

---

## PHASE 9: Admin Panel (Week 9-10)

### 9.1 Problem Management Admin
**Files:** `src/app/admin/problems/page.tsx`, `src/app/admin/problems/[id]/edit/page.tsx`, `src/app/api/admin/problems/route.ts`

**Tasks:**
- [ ] Create/edit problems with rich text editor
- [ ] Test case management
- [ ] Solution management (multi-language)
- [ ] AI-generated problem approval/rejection
- [ ] Bulk import/export

### 9.2 Admin Analytics
**Files:** `src/app/admin/analytics/`

**Tasks:**
- [ ] Problem submission analytics
- [ ] User engagement metrics
- [ ] Company/topic popularity
- [ ] Contest participation stats

---

## PHASE 10: Polish & SEO (Week 10-12)

### 10.1 SEO
- [ ] SEO-friendly URLs for all problem pages
- [ ] Meta tags for each problem
- [ ] Open Graph tags
- [ ] Structured data (JSON-LD) for coding problems
- [ ] Sitemap generation
- [ ] `robots.txt`

### 10.2 Performance
- [ ] Lazy loading for Monaco Editor
- [ ] Image optimization for company logos
- [ ] Route prefetching
- [ ] API response caching (Redis if available)
- [ ] Pagination optimization (cursor-based for large datasets)

### 10.3 Testing
- [ ] Unit tests for judge service
- [ ] API route tests for problems
- [ ] Integration tests for submission flow
- [ ] End-to-end tests for critical paths

---

## Parallel Tracks

```
Week:    1  2  3  4  5  6  7  8  9  10 11 12
DB      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Problems ░░████████████░░░░░░░░░░░░░░░░░░
Judge    ░░░░██████░░░░░░░░░░░░░░░░░░░░░
AI       ░░░░░░░██████░░░░░░░░░░░░░░░░░░
Companies░░░░░░░████░░░░░░░░░░░░░░░░░░░░
Intervw  ░░░░░░░░░░████████░░░░░░░░░░░░░░
Contests ░░░░░░░░░░░░░░████████░░░░░░░░░░
Dashboard░░░░░░░░░░░░░░░░████████░░░░░░░░
Admin    ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░
SEO/Perf ░░░░░░░░░░░░░░░░░░░░░░░░████████
```

**Key Insight:** Phases 2-5 can partially overlap. Phase 3 (Judge) is a dependency for Phase 2 (Problems submit). Phase 4 (AI) can start in parallel with Phase 3.
