# API Design — Coding Interview Preparation Platform

## API Base URL: `/api`

## Authentication
All authenticated routes require JWT token in cookie (`token`) or Authorization header.
Use `getSession()` / `requireAuth()` from `@/lib/auth`.

---

## 1. CODING PROBLEMS

### `GET /api/problems`
List problems with pagination, filtering, and search.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 50) |
| difficulty | string | Filter: easy, medium, hard, expert |
| company | string | Company slug |
| language | string | Language slug |
| topic | string | Topic slug |
| search | string | Search in title |
| tags | string | Comma-separated tags |
| status | string | solved, unsolved, bookmarked |
| sort | string | popularity, newest, difficulty, acceptance |
| order | string | asc, desc (default: desc) |

**Response:**
```json
{
  "success": true,
  "data": {
    "problems": [{ id, title, slug, difficulty, company, language, topic, tags,
                   totalSubmissions, totalAccepted, acceptanceRate, isSolved, isBookmarked }],
    "pagination": { page, limit, total, totalPages }
  }
}
```

### `GET /api/problems/[slug]`
Get full problem details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id", "title", "slug", "difficulty", "story", "problemStatement",
    "inputFormat", "outputFormat", "constraints", "examples", "edgeCases",
    "hints", "testCases", "tags",
    "company": { name, logoUrl },
    "language": { name, icon },
    "topic": { name, icon },
    "stats": { totalSubmissions, totalAccepted, acceptanceRate, upvotes, downvotes },
    "userProgress": { solved, attempts, bookmarked, bestScore } | null,
    "relatedProblems": [{ id, title, difficulty, slug }],
    "interviewTips", "commonMistakes"
  }
}
```

### `POST /api/problems/[slug]/submit`
Submit a solution to be judged.

**Body:**
```json
{ "code": "string", "language": "java" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "string",
    "status": "accepted",
    "testCasesPassed": 8,
    "totalTestCases": 10,
    "executionTimeMs": 45,
    "memoryUsedKb": 12345,
    "score": 80,
    "testResults": [{ "name", "passed", "input", "expected", "actual", "error" }]
  }
}
```

### `POST /api/problems/[slug]/bookmark`
Toggle bookmark status.

**Response:** `{ "success": true, "data": { "bookmarked": true } }`

### `GET /api/problems/[slug]/solution`
Get the solution (only accessible after solving or with hint tokens).

**Response:**
```json
{
  "success": true,
  "data": {
    "bruteForceSolution", "optimalSolution",
    "complexityAnalysis", "dryRun", "pseudoCode",
    "solutions": { java, python, cpp, javascript, go, rust, kotlin }
  }
}
```

---

## 2. AI QUESTION GENERATOR

### `POST /api/ai/generate-problem`
Generate an original coding problem.

**Body:**
```json
{
  "difficulty": "medium",
  "topic": "Dynamic Programming",
  "company": "Google",
  "language": "java"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title", "problemStatement", "inputFormat", "outputFormat",
    "constraints", "examples", "hints",
    "solutionJava", "solutionPython", "testCases", "hiddenTestCases",
    "isAiGenerated": true
  }
}
```

### `POST /api/ai/explain`
AI-powered code explanation.

**Body:** `{ "code": "string", "language": "java", "type": "time_complexity" | "space_complexity" | "solution" | "bugs" | "optimize" | "convert", "targetLanguage?": "python" }`

### `POST /api/ai/generate-tests`
Generate test cases for a problem.

**Body:** `{ "problemId": "string", "count": 5, "includeHidden": true }`

---

## 3. ONLINE JUDGE

### `POST /api/judge/submit`
Submit code for execution against test cases.

**Body:** `{ "code": "string", "language": "java", "testCases": [...], "timeLimit": 2000, "memoryLimit": 256000 }`

### `GET /api/judge/submissions/[id]`
Poll submission status.

### `POST /api/judge/run`
Run code without test cases (quick run).

**Body:** `{ "code": "string", "language": "java", "input": "string" }`

---

## 4. MOCK INTERVIEWS

### `POST /api/interviews/generate`
Generate a mock interview session.

**Body:**
```json
{
  "company": "amazon",
  "experienceYears": 2,
  "durationMinutes": 60,
  "types": ["coding", "mcq", "sql", "debugging", "lld", "system_design"],
  "language": "java"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interviewId": "string",
    "title": "Amazon Java Interview - 2 Years Experience",
    "durationMinutes": 60,
    "problems": [...],
    "questions": [...],
    "startTime": "ISO date"
  }
}
```

### `GET /api/interviews` — List user's interviews
### `GET /api/interviews/[id]` — Get interview details
### `POST /api/interviews/[id]/submit` — Submit interview answers
### `GET /api/interviews/[id]/results` — Get evaluation and score

---

## 5. CODING CONTESTS

### `GET /api/contests` — List contests (upcoming, active, past)
### `GET /api/contests/[slug]` — Get contest details
### `POST /api/contests/[slug]/register` — Register for contest
### `POST /api/contests/[slug]/start` — Start contest (or virtual)
### `POST /api/contests/[slug]/submit` — Submit answer during contest
### `GET /api/contests/[slug]/rankings` — Get live rankings
### `GET /api/contests/[slug]/my-rank` — Get current user's rank

---

## 6. COMPANIES & TOPICS

### `GET /api/companies` — List all companies with problem counts
### `GET /api/topics` — List all topics (hierarchical) with problem counts
### `GET /api/languages` — List all supported languages

---

## 7. SEARCH

### `GET /api/search?q=...&type=problems&page=1&limit=20`
Unified search across problems, companies, topics.

---

## 8. DASHBOARD (Enhanced)

### `GET /api/dashboard` — Enhanced with coding problem stats
Adds to existing:
```json
{
  "codingStats": {
    "totalSolved": 42,
    "totalAttempted": 67,
    "accuracy": 62.7,
    "byDifficulty": { "easy": 20, "medium": 15, "hard": 5, "expert": 2 },
    "byCompany": [...],
    "byTopic": [...],
    "byLanguage": [...],
    "currentStreak": 5,
    "longestStreak": 12,
    "heatmap": [{ date: "2026-01-01", count: 3 }, ...]
  }
}
```

---

## 9. EXISTING APIs (Preserved)
All existing APIs continue to work unchanged:
- `/api/auth/*` — Login, Signup, Logout, Me, Forgot/Reset Password
- `/api/quiz/*` — Quiz start, answer
- `/api/challenges/*` — Code challenges (legacy)
- `/api/battles/*` — Quiz battles
- `/api/playground/*` — Code playground
- `/api/dashboard/*` — Dashboard data
- `/api/concepts/*` — Concepts
- `/api/hints/*` — Hints
- `/api/roadmaps/*` — Roadmaps
- `/api/spaced-repetition/*` — Spaced repetition
- `/api/badges/*` — Badges
- `/api/leaderboard/*` — Leaderboards
- `/api/admin/*` — Admin panel
- `/api/ai-tutor/*` — AI Tutor
- `/api/user/*` — User avatar/profile

---

## 10. ADMIN APIs (Coding Problems)

### `POST /api/admin/problems` — Create problem
### `PUT /api/admin/problems/[id]` — Update problem
### `DELETE /api/admin/problems/[id]` — Delete problem
### `GET /api/admin/problems` — List all (including drafts)
### `POST /api/admin/problems/[id]/approve` — Approve AI-generated problem
### `POST /api/admin/problems/[id]/reject` — Reject with reason
