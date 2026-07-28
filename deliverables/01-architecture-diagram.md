# Architecture Diagram — Coding Interview Preparation Platform

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Landing     │  │  Dashboard   │  │  Coding       │              │
│  │   Page        │  │  (Protected) │  │  Problems     │              │
│  └──────────────┘  └──────────────┘  └──────┬───────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────┴───────┐              │
│  │  Mock         │  │  Contests    │  │  Monaco       │              │
│  │  Interviews   │  │              │  │  Editor       │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              NEXT.JS 16 APP ROUTER (Server Components)        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API LAYER (Route Handlers)                     │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   /api/auth/*     │  │  /api/problems/* │  │  /api/judge/*    │  │
│  │   Login/Signup    │  │  CRUD + Search   │  │  Execute/Submit  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  /api/ai/*       │  │  /api/contest/*  │  │  /api/interview/*│  │
│  │  Generator/Tutor │  │  CRUD + Rankings │  │  Mock Interviews │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │        MIDDLEWARE: Auth, Rate Limiting, Security Headers      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                   │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Auth Service │  │  Problem     │  │  Judge       │              │
│  │  JWT/BCrypt   │  │  Service     │  │  Service     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  AI Service   │  │  Interview   │  │  Contest     │              │
│  │  OpenAI/TBD   │  │  Service     │  │  Service     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   PRISMA ORM (PostgreSQL)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │  Coding   │ │ Company  │ │  Topic   │ │  User    │       │   │
│  │  │ Problems  │ │         │ │          │ │  Progress│       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ Contests │ │Interviews│ │Solutions │ │ AI Cache │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    REDIS CACHE (Optional)                      │   │
│  │  Session Cache | Problem Cache | Leaderboard Cache           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

## Key Design Decisions

### 1. Coding Problems - New Core Entity
- **Why**: The existing `CodeChallenge` model is tied to `Concept` and has limited metadata. We need a dedicated `CodingProblem` model with rich fields for company, language, difficulty, topic, solution explanations, hints, etc.
- **Strategy**: Create a new model rather than extending `CodeChallenge` to avoid breaking existing challenges. The new model powers the main interview prep experience.

### 2. Monaco Editor Integration
- **Why**: The current textarea is inadequate for a competitive coding platform. Monaco provides syntax highlighting, auto-completion, multi-language support, and a professional experience.
- **Strategy**: Install `@monaco-editor/react` as a client-side component. It's lazy-loaded to avoid impacting page load.

### 3. Online Judge (Code Execution Sandbox)
- **Why**: Currently, code execution goes through the `/api/playground` endpoint which returns simulated results for most languages. We need real execution with memory/time limits.
- **Strategy**: Deploy a microservice (Python-based) using Docker containers for safe code execution. For MVP, use Piston API (public) or Judge0 CE.

### 4. AI Question Generator
- **Why**: To generate unlimited original coding problems without scraping copyrighted content.
- **Strategy**: Create an API route that calls an LLM (OpenAI/Claude) with structured prompts to generate problems following our schema, including test cases and solutions.

### 5. Mock Interviews
- **Why**: A key differentiator from existing platforms.
- **Strategy**: Generate interview sessions combining coding problems, MCQs, SQL, debugging, and system design questions. Use AI-powered evaluation.

### 6. Coding Contests
- **Why**: To compete with LeetCode contests and Codeforces.
- **Strategy**: Extend the battle system pattern. Create a new Contest model with timer, rankings, and virtual contest support.
