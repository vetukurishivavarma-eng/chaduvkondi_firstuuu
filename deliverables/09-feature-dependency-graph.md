# Feature Dependency Graph — Coding Interview Preparation Platform

## Dependency Relationships

```
                    ┌─────────────────────────────┐
                    │  Database Schema (Phase 1)   │
                    │  Companies, Topics, Langs,   │
                    │  Problems, Contests, Interv. │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │   Constants & Configs       │
                    │   (Phase 1)                 │
                    └─────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                        │
          ▼                       ▼                        ▼
┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐
│ Problem API      │   │ Judge Service    │   │ AI Service         │
│ Routes (Ph 2)    │   │ (Phase 3)        │   │ (Phase 4)          │
└────────┬─────────┘   └────────┬─────────┘   └─────────┬──────────┘
         │                      │                        │
         ▼                      ▼                        │
┌──────────────────┐   ┌──────────────────┐              │
│ Problem Listing  │   │ Submit Solution  │              │
│ Page (Ph 2.2)    │   │ Flow (Ph 2.3)    │              │
└──────────────────┘   └────────┬─────────┘              │
                                │                        │
                                ▼                        ▼
                      ┌──────────────────┐   ┌────────────────────┐
                      │ Judge Results    │   │ AI Generator       │
                      │ Display (Ph 2.3) │   │ (Phase 4.1)        │
                      └──────────────────┘   └─────────┬──────────┘
                                                        │
                                                        ▼
                                          ┌────────────────────┐
                                          │ AI Explanations    │
                                          │ (Phase 4.2)        │
                                          └────────────────────┘

          ┌───────────────────────┬────────────────────────────┐
          │                       │                            │
          ▼                       ▼                            ▼
┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐
│ Company/Topic    │   │ Mock Interviews  │   │ Coding Contests    │
│ Pages (Ph 5)     │   │ (Phase 6)        │   │ (Phase 7)          │
└──────────────────┘   └────────┬─────────┘   └─────────┬──────────┘
                                │                        │
                                ▼                        ▼
                      ┌──────────────────┐   ┌────────────────────┐
                      │ Interview Timer  │   │ Contest Timer      │
                      │ (Ph 6.2)        │   │ (Ph 7)             │
                      └──────────────────┘   └────────────────────┘

          ┌───────────────────────┬────────────────────────────┐
          │                       │                            │
          ▼                       ▼                            ▼
┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐
│ Enhanced         │   │ Enhanced         │   │ Admin Panel        │
│ Dashboard (Ph 8) │   │ Leaderboard(Ph 8)│   │ (Phase 9)          │
└──────────────────┘   └──────────────────┘   └────────────────────┘
          │                       │                            │
          └───────────────────────┴────────────────────────────┘
                                        │
                                        ▼
                              ┌────────────────────┐
                              │ SEO & Performance  │
                              │ (Phase 10)         │
                              └────────────────────┘
```

## Dependency Matrix

| Feature | Depends On | Required By |
|---------|------------|-------------|
| Database Schema | Nothing (root) | Everything |
| Constants & Configs | Nothing (root) | Problem API, Judge, AI, Companies |
| Problem API Routes | Database Schema, Constants | Problem Pages |
| Problem Listing Page | Problem API Routes | — |
| Problem Solve Page | Problem API Routes, Judge Service, AI Service | — |
| Judge Service | Database Schema, Constants | Problem Solve Page |
| Judge Results Display | Judge Service | — |
| AI Service | Database Schema | AI Generator, AI Explain |
| AI Generator | AI Service, Constants | Admin Panel |
| AI Explanations | AI Service | Problem Solve Page |
| Company/Topic Pages | Problem API Routes | — |
| Mock Interviews | Problem API Routes, AI Service, Judge | — |
| Coding Contests | Problem API Routes, Judge Service | — |
| Enhanced Dashboard | Problem API Routes | — |
| Enhanced Leaderboard | Problem API Routes | — |
| Admin Panel | Problem API Routes, AI Generator | — |
| SEO & Performance | All above | — |

## Critical Path (Minimum Viable Product)

The **critical path** represents the minimum set of features needed for a usable coding interview platform:

```
Database Schema → Constants → Problem API Routes → Problem Listing Page 
→ Problem Solve Page → Judge Service → Submit Flow → Results Display
```

**Estimated MVP Timeline:** 5-6 weeks

## Deferrable Features (Post-MVP)
- AI Problem Generator (manual creation works)
- Mock Interviews (complex, standalone)
- Coding Contests (complex, standalone)
- Enhanced Analytics (nice-to-have)
- SEO Optimization (can be done anytime)

## Parallel Execution Groups

**Group A** (can run in parallel with B & C):
- Database Schema
- Constants & Configs
- Mock Interviews (design/architecture only)

**Group B** (can run in parallel with A & C):
- Judge Service Architecture
- AI Service Architecture
- Companies/Topics Constants

**Group C** (can run in parallel with A & B):
- Frontend Component Library (shared components)
- Dashboard Enhancements (design only)
- Admin Panel (design only)
