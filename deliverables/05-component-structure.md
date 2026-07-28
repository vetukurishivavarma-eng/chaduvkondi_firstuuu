# Component Structure — Coding Interview Preparation Platform

## Component Hierarchy

```
RootLayout
├── ThemeProvider
├── ServiceWorkerRegister
└── DashboardLayout (Protected)
    ├── Sidebar (existing, enhanced with "Problems" & "Contests" links)
    ├── MobileHeader
    └── <Page Content>
        ├── ProblemsPage
        │   ├── ProblemSearch
        │   ├── ProblemFilters
        │   │   ├── DifficultyFilter
        │   │   ├── CompanyFilter
        │   │   ├── TopicFilter
        │   │   ├── LanguageFilter
        │   │   └── StatusFilter (Solved/Unsolved/Bookmarked)
        │   ├── ProblemList
        │   │   └── ProblemCard (×N)
        │   │       ├── DifficultyBadge
        │   │       ├── CompanyTag
        │   │       ├── LanguageTag
        │   │       ├── AcceptanceRate
        │   │       └── StatusIcon
        │   └── Pagination
        │
        ├── ProblemSolvePage (problems/[slug])
        │   ├── ProblemDescription
        │   │   ├── ProblemHeader (title, difficulty, company, language)
        │   │   ├── StorySection
        │   │   ├── ProblemStatement
        │   │   ├── InputOutputFormat
        │   │   ├── Constraints
        │   │   ├── Examples (×N)
        │   │   ├── EdgeCases (collapsible)
        │   │   └── Hints (collapsible, progressive reveal)
        │   ├── CodeEditor (Monaco)
        │   │   ├── EditorToolbar
        │   │   │   ├── LanguageSelector
        │   │   │   ├── ThemeToggle (light/dark editor)
        │   │   │   ├── FullscreenToggle
        │   │   │   ├── ResetButton
        │   │   │   └── KeyboardShortcutHint
        │   │   └── MonacoEditor (lazy loaded)
        │   ├── ActionButtons
        │   │   ├── RunButton (quick run)
        │   │   ├── SubmitButton
        │   │   └── AiButton (AI explain/optimize)
        │   ├── JudgeResults
        │   │   ├── OverallResult (Accepted/WA/TLE/MLE)
        │   │   ├── TestCaseResults (×N)
        │   │   ├── ExecutionStats (time, memory)
        │   │   └── SubmissionHistory
        │   └── SolutionSection (after solve)
        │       ├── BruteForceTab
        │       ├── OptimalTab
        │       ├── ComplexityAnalysis
        │       ├── DryRun
        │       ├── PseudoCode
        │       └── MultiLanguageSolutions
        │
        ├── ContestsPage
        │   ├── ContestFilters (upcoming/active/past)
        │   ├── ContestList
        │   │   └── ContestCard (×N)
        │   │       ├── ContestTimer (countdown)
        │   │       ├── PrizeInfo
        │   │       ├── RegistrationStatus
        │   │       └── DifficultyIndicator
        │   └── Pagination
        │
        ├── ContestDetailPage (contests/[slug])
        │   ├── ContestHeader
        │   │   ├── Title & Description
        │   │   ├── StatusBadge
        │   │   ├── Timer
        │   │   └── RegisterButton
        │   ├── ContestProblemList
        │   │   └── ContestProblemRow (×N)
        │   │       ├── ProblemNumber
        │   │       ├── ProblemTitle
        │   │       ├── Difficulty
        │   │       ├── Points
        │   │       └── SolvedStatus
        │   ├── ContestRankings
        │   │   ├── RankingHeader
        │   │   └── RankingRow (×N)
        │   │       ├── Rank
        │   │       ├── Username
        │   │       ├── Score
        │   │       ├── ProblemsSolved
        │   │       └── Time
        │   └── MyRank (sticky)
        │
        ├── InterviewsPage
        │   ├── InterviewGenerator
        │   │   ├── CompanySelector
        │   │   ├── ExperienceSlider
        │   │   ├── DurationSelector
        │   │   ├── InterviewTypeSelector (multi-select)
        │   │   └── LanguageSelector
        │   ├── InterviewHistory
        │   │   └── InterviewCard (×N)
        │   └── EmptyState
        │
        ├── InterviewSessionPage (interviews/[id])
        │   ├── InterviewHeader
        │   │   ├── Title
        │   │   ├── Timer (countdown)
        │   │   ├── ProgressBar
        │   │   └── QuestionNavigator
        │   ├── InterviewQuestionPanel
        │   │   ├── CodingQuestion → CodeEditor
        │   │   ├── MCQQuestion → RadioGroup
        │   │   ├── SQLQuestion → CodeEditor
        │   │   ├── DebuggingQuestion → DiffViewer
        │   │   ├── LLDQuestion → TextEditor
        │   │   └── SystemDesignQuestion → TextEditor + DiagramTool
        │   └── SubmitButton
        │
        └── EnhancedDashboard
            ├── ProblemsSummary
            │   ├── TotalSolvedCard
            │   ├── AccuracyCard
            │   ├── StreakCard
            │   └── DifficultyBreakdown
            ├── ProgressHeatmap
            │   └── HeatmapCell (×365)
            ├── RecentSubmissions
            │   └── SubmissionRow (×N)
            ├── WeakTopics (existing, extended)
            └── DailyChallenge (existing)
```

## Key Component Patterns

### CodeEditor Component
```tsx
<CodeEditor
  language="java"
  value={code}
  onChange={setCode}
  readOnly={false}
  theme="vs-dark" // or "light"
  height="500px"
  options={{
    minimap: false,
    fontSize: 14,
    lineNumbers: true,
    automaticLayout: true,
    tabSize: 4,
  }}
/>
```
- Lazy loaded via `next/dynamic` with `ssr: false`
- Supports Java, Python, C++, C, JavaScript, TypeScript, Go, Rust, Kotlin, Swift, PHP, C#, Ruby
- Dark/light theme syncs with app theme
- Keyboard shortcuts: Ctrl+Enter to run, Ctrl+Shift+Enter to submit

### ProblemFilters Component
```tsx
<ProblemFilters
  onFilterChange={(filters) => fetchProblems(filters)}
  companies={companies}
  topics={topics}
  languages={languages}
  currentFilters={{ difficulty, company, topic, language, status, sort }}
/>
```
- All filters are URL-param driven for shareable links
- "Clear all" button
- Active filter count badge

### JudgeResults Component
```tsx
<JudgeResults
  status="accepted"
  testResults={[
    { name: "Test 1", passed: true, input: "5", expected: "25", actual: "25" },
    { name: "Test 2", passed: false, input: "10", expected: "100", actual: "120", error: "Output mismatch" },
  ]}
  executionTimeMs={45}
  memoryUsedKb={12345}
/>
```
- Green checkmarks for passed, red X for failed
- Expandable test case details
- Execution time and memory usage bars
- Smooth animations for results appearing
