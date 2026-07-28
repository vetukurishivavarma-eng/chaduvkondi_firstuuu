# Coding Interview Preparation Platform — Deliverables

## Overview

This document set outlines the complete plan to transform **Chaduvkondi** from its current state (multi-language quiz & mastery platform) into a **world-class Coding Interview Preparation Platform** that competes with LeetCode, HackerRank, CodeChef, and others — while preserving all existing quiz functionality.

## Current State Summary

- **Stack**: Next.js 16, TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS v4
- **Existing Features**: Quizzes, Code Challenges, Battles, AI Tutor, Playground, Spaced Repetition, Roadmaps, Badges, Leaderboards, Profiles
- **Code Editor**: Basic textarea (no Monaco Editor)
- **Code Execution**: Simulated for most languages via `/api/playground`
- **Problem Set**: Limited `CodeChallenge` model tied to concepts

## Deliverables

| # | Document | Description |
|---|----------|-------------|
| 1 | [Architecture Diagram](./01-architecture-diagram.md) | High-level architecture with client, API, service, and data layers |
| 2 | [Database ER Diagram](./02-database-er-diagram.md) | 15 new models: CodingProblem, Company, Topic, Contest, Interview, etc. |
| 3 | [API Design](./03-api-design.md) | 30+ new API endpoints organized by domain |
| 4 | [Folder Structure](./04-folder-structure.md) | New directories alongside existing code (no modifications) |
| 5 | [Component Structure](./05-component-structure.md) | Component hierarchy and patterns for all new features |
| 6 | [Implementation Plan](./06-implementation-plan.md) | 10-phase plan over 8-12 weeks |
| 7 | [Migration Strategy](./07-migration-strategy.md) | Zero-breakage approach — extend, never replace |
| 8 | [Risk Analysis](./08-risk-analysis.md) | 10 identified risks with mitigation strategies |
| 9 | [Feature Dependency Graph](./09-feature-dependency-graph.md) | Dependency matrix and critical path for MVP |
| 10 | [Performance Plan](./10-performance-plan.md) | Optimization targets for DB, frontend, caching, and judge |
| 11 | [Security Plan](./11-security-plan.md) | Code execution sandbox, rate limiting, input validation, CSP |

## Key Architectural Decisions

### 1. New `CodingProblem` Model (not extending `CodeChallenge`)
- **Reason**: `CodeChallenge` is tightly coupled to `Concept` and `SubDomain`. Adding company, topic, language, and rich solution fields would break existing queries.
- **Benefit**: Zero risk to existing functionality.

### 2. New API Routes (not modifying existing)
- `/api/problems/*` — new coding problem endpoints
- `/api/judge/*` — new online judge endpoints
- `/api/ai/*` — new AI generation endpoints
- `/api/contests/*` — new contest endpoints
- `/api/interviews/*` — new mock interview endpoints

### 3. Monaco Editor (lazy-loaded)
- **Why**: Professional coding experience with syntax highlighting, auto-completion
- **How**: `next/dynamic` with `ssr: false`

### 4. Piston API for Code Execution (MVP)
- **Why**: Free, sandboxed, no infrastructure to manage
- **Fallback**: Judge0 CE self-hosted for production scale

## Preservation Guarantees

The following will remain **completely unchanged**:
- All database models (User, Track, Concept, Question, QuizAttempt, etc.)
- All auth APIs and middleware
- All quiz APIs and pages
- All battle APIs and pages
- All challenge APIs and pages
- All existing UI components
- All existing library utilities

## Next Steps

1. Review and approve these deliverables
2. Start Phase 1: Database schema migration
3. Begin Phase 2: Core coding problems implementation
