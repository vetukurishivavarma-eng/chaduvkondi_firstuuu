# Folder Structure — Coding Interview Preparation Platform

## Current Structure (Preserved)

All existing files remain. New files are added alongside.

```
src/
├── app/
│   ├── (auth)/          ← Existing (preserved)
│   ├── admin/           ← Existing (preserved, enhanced)
│   ├── ai-tutor/        ← Existing (preserved)
│   ├── api/             ← Existing APIs (preserved)
│   │   ├── admin/
│   │   ├── ai-tutor/
│   │   ├── auth/
│   │   ├── badges/
│   │   ├── battles/
│   │   ├── challenges/
│   │   ├── concepts/
│   │   ├── dashboard/
│   │   ├── hints/
│   │   ├── leaderboard/
│   │   ├── playground/
│   │   ├── quiz/
│   │   ├── roadmaps/
│   │   ├── spaced-repetition/
│   │   └── user/
│   ├── badges/
│   ├── battles/
│   ├── challenges/
│   ├── dashboard/
│   ├── leaderboard/
│   ├── onboarding/
│   ├── playground/
│   ├── profile/
│   ├── quiz/
│   ├── roadmaps/
│   └── spaced-repetition/
├── components/
│   ├── ui/              ← Existing
│   ├── daily-challenge.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── streak-visualization.tsx
└── lib/
    ├── auth.ts
    ├── api-helpers.ts
    ├── prisma.ts
    └── utils.ts
```

## NEW Structure (Additions)

```
src/
├── app/
│   ├── problems/                              # NEW: Coding Problems hub
│   │   ├── page.tsx                           # Browse/Search problems
│   │   ├── layout.tsx                         # Problems layout
│   │   └── [slug]/
│   │       ├── page.tsx                       # Problem solve page
│   │       └── solution/
│   │           └── page.tsx                   # Solution viewer
│   │
│   ├── contests/                              # NEW: Coding Contests
│   │   ├── page.tsx                           # Contest list
│   │   └── [slug]/
│   │       ├── page.tsx                       # Contest detail
│   │       └── rank/
│   │           └── page.tsx                   # Contest rankings
│   │
│   ├── interviews/                            # NEW: Mock Interviews
│   │   ├── page.tsx                           # Interview dashboard
│   │   ├── generate/
│   │   │   └── page.tsx                       # Interview generator form
│   │   └── [id]/
│   │       ├── page.tsx                       # Active interview
│   │       └── results/
│   │           └── page.tsx                   # Interview results
│   │
│   ├── api/
│   │   ├── problems/                          # NEW: Coding Problems API
│   │   │   ├── route.ts                       # GET (list), POST (create)
│   │   │   ├── search/
│   │   │   │   └── route.ts                   # Search problems
│   │   │   └── [slug]/
│   │   │       ├── route.ts                   # GET (detail)
│   │   │       ├── submit/
│   │   │       │   └── route.ts               # POST (submit solution)
│   │   │       ├── bookmark/
│   │   │       │   └── route.ts               # POST (toggle bookmark)
│   │   │       └── solution/
│   │   │           └── route.ts               # GET (solution)
│   │   │
│   │   ├── ai/
│   │   │   ├── generate-problem/
│   │   │   │   └── route.ts                   # POST: Generate problem
│   │   │   ├── explain/
│   │   │   │   └── route.ts                   # POST: AI explain
│   │   │   ├── generate-tests/
│   │   │   │   └── route.ts                   # POST: Generate tests
│   │   │   └── improve-solution/
│   │   │       └── route.ts                   # POST: Improve/optimize
│   │   │
│   │   ├── judge/                             # NEW: Online Judge
│   │   │   ├── route.ts                       # POST: Submit for judging
│   │   │   ├── run/
│   │   │   │   └── route.ts                   # POST: Quick run
│   │   │   └── submissions/
│   │   │       └── [id]/
│   │   │           └── route.ts               # GET: Submission status
│   │   │
│   │   ├── interviews/                        # NEW: Mock Interviews
│   │   │   ├── route.ts                       # GET: List interviews
│   │   │   ├── generate/
│   │   │   │   └── route.ts                   # POST: Generate interview
│   │   │   └── [id]/
│   │   │       ├── route.ts                   # GET: Interview detail
│   │   │       ├── submit/
│   │   │       │   └── route.ts               # POST: Submit answers
│   │   │       └── results/
│   │   │           └── route.ts               # GET: Interview results
│   │   │
│   │   ├── contests/                          # NEW: Coding Contests
│   │   │   ├── route.ts                       # GET: List contests
│   │   │   └── [slug]/
│   │   │       ├── route.ts                   # GET: Contest detail
│   │   │       ├── register/
│   │   │       │   └── route.ts               # POST: Register
│   │   │       ├── start/
│   │   │       │   └── route.ts               # POST: Start
│   │   │       ├── submit/
│   │   │       │   └── route.ts               # POST: Submit
│   │   │       └── rankings/
│   │   │           └── route.ts               # GET: Rankings
│   │   │
│   │   ├── companies/
│   │   │   └── route.ts                       # GET: List companies
│   │   ├── topics/
│   │   │   └── route.ts                       # GET: List topics
│   │   └── languages/
│   │       └── route.ts                       # GET: List languages
│   │
│   ├── admin/
│   │   └── problems/                          # NEW: Admin problem management
│   │       ├── page.tsx                       # Problem CRUD admin
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx               # Problem editor
│   │
│   └── companies/                             # NEW: Company pages
│       └── [slug]/
│           └── page.tsx                       # Company-wise problems
│
├── components/
│   ├── problems/                              # NEW: Problem components
│   │   ├── problem-card.tsx                   # Problem listing card
│   │   ├── problem-list.tsx                   # Problem list with filters
│   │   ├── problem-description.tsx            # Problem description panel
│   │   ├── problem-filters.tsx                # Advanced filter bar
│   │   ├── problem-search.tsx                 # Search input with dropdown
│   │   ├── problem-solution.tsx               # Solution display
│   │   ├── problem-compare.tsx                # Compare your solution
│   │   └── problem-stats.tsx                  # Problem statistics
│   │
│   ├── editor/                                # NEW: Code Editor
│   │   ├── code-editor.tsx                    # Monaco Editor wrapper
│   │   ├── editor-toolbar.tsx                 # Editor action buttons
│   │   └── language-selector.tsx              # Language dropdown
│   │
│   ├── judge/                                 # NEW: Judge components
│   │   ├── judge-results.tsx                  # Test results display
│   │   ├── judge-submission.tsx               # Submission status
│   │   └── judge-progress.tsx                 # Execution progress bar
│   │
│   ├── interviews/                            # NEW: Interview components
│   │   ├── interview-generator.tsx            # Interview creation form
│   │   ├── interview-timer.tsx                # Countdown timer
│   │   ├── interview-progress.tsx             # Question progress
│   │   └── interview-results.tsx              # Results & feedback
│   │
│   ├── contests/                              # NEW: Contest components
│   │   ├── contest-card.tsx                   # Contest listing card
│   │   ├── contest-timer.tsx                  # Contest countdown
│   │   ├── contest-rankings.tsx               # Live rankings table
│   │   └── contest-problem-list.tsx           # Problem list in contest
│   │
│   ├── dashboard/                             # NEW: Dashboard widgets
│   │   ├── problems-summary.tsx               # Solved/Attempted stats
│   │   ├── progress-heatmap.tsx               # GitHub-style heatmap
│   │   ├── coding-streak.tsx                  # Coding streak display
│   │   └── recent-submissions.tsx             # Recent activity feed
│   │
│   └── shared/                                # Shared components
│       ├── pagination.tsx                     # Reusable pagination
│       ├── empty-state.tsx                    # Empty state display
│       └── loading-skeleton.tsx               # Skeleton loaders
│
└── lib/
    ├── judge/                                 # NEW: Judge service
    │   ├── index.ts                           # Judge orchestrator
    │   ├── piston.ts                          # Piston API integration
    │   ├── judge0.ts                          # Judge0 integration
    │   └── sandbox.ts                         # Local sandbox executor
    ├── ai/
    │   ├── index.ts                           # AI service orchestrator
    │   ├── generate-problem.ts                # Problem generation prompt
    │   ├── explain-code.ts                    # Code explanation prompt
    │   └── generate-tests.ts                  # Test generation prompt
    └── constants/
        ├── companies.ts                       # Company definitions
        ├── topics.ts                          # Topic definitions
        ├── languages.ts                       # Language configurations
        └── difficulties.ts                    # Difficulty configurations
```

## Key Principles
1. **Preserve all existing files** — never delete or restructure existing code
2. **Add new files alongside** — new features get new directories
3. **Reuse existing components** — leverage `@/components/ui/*` and existing patterns
4. **Follow existing conventions** — same auth pattern, same API response format
