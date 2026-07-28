# Database ER Diagram — Extended Schema

## New Models (Add to Existing `prisma/schema.prisma`)

### New Enums
```prisma
enum ProblemDifficulty {
  easy
  medium
  hard
  expert
}

enum ProblemStatus {
  draft
  published
  archived
}

enum InterviewType {
  coding
  mcq
  sql
  debugging
  output_prediction
  lld
  system_design
}

enum InterviewStatus {
  pending
  in_progress
  completed
  evaluated
}

enum ContestStatus {
  upcoming
  active
  completed
}

enum SubmissionStatus {
  pending
  compiling
  running
  accepted
  wrong_answer
  time_limit_exceeded
  memory_limit_exceeded
  runtime_error
  compilation_error
}
```

### New Models

```prisma
// ─── CORE CODING PROBLEMS ─────────────────────────────────────────────

model CodingProblem {
  id              String   @id @default(cuid())
  title           String   @unique
  slug            String   @unique
  difficulty      ProblemDifficulty @default(easy)
  
  // Content
  story           String   @default("")
  problemStatement String
  inputFormat     String
  outputFormat    String
  constraints     String
  examples        String   // JSON array of { input, output, explanation }
  edgeCases       String   @default("[]") // JSON array
  hints           String   @default("[]") // JSON array
  
  // Solutions
  bruteForceSolution  String @default("")
  optimalSolution     String @default("")
  complexityAnalysis  String @default("")
  dryRun              String @default("")
  flowDiagramUrl      String? // URL to generated diagram
  pseudoCode          String @default("")
  
  // Multi-language solutions
  solutionJava       String @default("")
  solutionPython     String @default("")
  solutionCpp        String @default("")
  solutionC          String @default("")
  solutionJavaScript String @default("")
  solutionGo         String @default("")
  solutionRust       String @default("")
  solutionKotlin     String @default("")
  solutionSwift      String @default("")
  solutionPhp        String @default("")
  solutionCsharp     String @default("")
  solutionRuby       String @default("")
  solutionTypescript String @default("")
  
  // Test cases
  testCases     String @default("[]") // JSON: Public test cases
  hiddenTestCases String @default("[]") // JSON: Hidden test cases
  
  // Metadata
  tags          String @default("[]") // JSON array of tag strings
  totalSubmissions Int @default(0)
  totalAccepted    Int @default(0)
  acceptanceRate   Float @default(0.0)
  isAiGenerated    Boolean @default(false)
  status           ProblemStatus @default(published)
  upvotes          Int @default(0)
  downvotes        Int @default(0)
  
  // Relations
  authorId     String?
  companyId    String?
  languageId   String
  topicId      String?
  createdById  String? // User who created/approved
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // Relations
  author          User?          @relation("ProblemAuthor")
  company         Company?       @relation(fields: [companyId], references: [id])
  language        ProgrammingLanguage @relation(fields: [languageId], references: [id])
  topic           Topic?         @relation(fields: [topicId], references: [id])
  createdBy       User?          @relation("ProblemApprover")
  submissions     ProblemSubmission[]
  bookmarks       ProblemBookmark[]
  interviews      InterviewProblem[]
  contestProblems ContestProblem[]
  
  @@index([difficulty])
  @@index([companyId])
  @@index([languageId])
  @@index([topicId])
  @@index([status])
}


// ─── COMPANIES ─────────────────────────────────────────────────────────

model Company {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String   @default("")
  logoUrl     String?
  website     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  problems    CodingProblem[]
  tags        CompanyTag[]
}


// ─── PROGRAMMING LANGUAGES ─────────────────────────────────────────────

model ProgrammingLanguage {
  id          String   @id @default(cuid())
  name        String   @unique  // e.g., "Java", "Python", "C++"
  slug        String   @unique  // e.g., "java", "python", "cpp"
  extension   String   @default("") // e.g., ".java", ".py", ".cpp"
  monacoId    String   @default("") // Monaco editor language ID
  judge0Id    Int?     // Judge0 language ID
  icon        String   @default("📄")
  color       String   @default("#6366f1")
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  
  problems    CodingProblem[]
  submissions ProblemSubmission[]
}


// ─── TOPICS ────────────────────────────────────────────────────────────

model Topic {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String   @default("")
  icon        String   @default("📚")
  color       String   @default("#6366f1")
  parentId    String?
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  
  parent     Topic?          @relation("TopicHierarchy", fields: [parentId], references: [id])
  children   Topic[]         @relation("TopicHierarchy")
  problems   CodingProblem[]
  tags       CompanyTag[]
}


// ─── COMPANY-TOPIC TAGS ────────────────────────────────────────────────

model CompanyTag {
  id        String @id @default(cuid())
  companyId String
  topicId   String
  
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  topic   Topic   @relation(fields: [topicId], references: [id], onDelete: Cascade)
  
  @@unique([companyId, topicId])
}


// ─── PROBLEM SUBMISSIONS ────────────────────────────────────────────────

model ProblemSubmission {
  id            String          @id @default(cuid())
  userId        String
  problemId     String
  languageId    String
  code          String
  status        SubmissionStatus @default(pending)
  testCasesPassed Int           @default(0)
  totalTestCases Int            @default(0)
  executionTimeMs Int?
  memoryUsedKb  Int?
  errorMessage  String?
  score         Float?
  createdAt     DateTime        @default(now())
  
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem       CodingProblem   @relation(fields: [problemId], references: [id], onDelete: Cascade)
  language      ProgrammingLanguage @relation(fields: [languageId], references: [id])
  
  @@index([userId, problemId])
  @@index([problemId, status])
}


// ─── PROBLEM BOOKMARKS ─────────────────────────────────────────────────

model ProblemBookmark {
  id        String   @id @default(cuid())
  userId    String
  problemId String
  createdAt DateTime @default(now())
  
  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem CodingProblem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  
  @@unique([userId, problemId])
}


// ─── MOCK INTERVIEWS ──────────────────────────────────────────────────

model MockInterview {
  id              String          @id @default(cuid())
  userId          String
  title           String          @default("")
  type            InterviewType   @default(coding)
  companyId       String?
  experienceYears Float           @default(2)
  durationMinutes Int             @default(60)
  status          InterviewStatus @default(pending)
  score           Float?
  feedback        String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime        @default(now())
  
  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   Company?           @relation(fields: [companyId], references: [id])
  problems  InterviewProblem[]
  questions InterviewQuestion[]
}


// ─── INTERVIEW PROBLEMS ────────────────────────────────────────────────

model InterviewProblem {
  id           String   @id @default(cuid())
  interviewId  String
  problemId    String
  order        Int      @default(0)
  userCode     String   @default("")
  score        Float?
  feedback     String?
  solved       Boolean  @default(false)
  
  interview MockInterview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  problem   CodingProblem @relation(fields: [problemId], references: [id])
}


// ─── INTERVIEW QUESTIONS (MCQ, SQL, Debugging, etc.) ──────────────────

model InterviewQuestion {
  id           String   @id @default(cuid())
  interviewId  String
  questionText String
  type         InterviewType @default(mcq)
  choices      String   @default("[]") // JSON array for MCQs
  correctAnswer String  @default("")
  userAnswer   String   @default("")
  isCorrect    Boolean?
  explanation  String   @default("")
  score        Float?
  order        Int      @default(0)
  
  interview MockInterview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
}


// ─── CODING CONTESTS ──────────────────────────────────────────────────

model Contest {
  id             String        @id @default(cuid())
  title          String
  slug           String        @unique
  description    String
  startTime      DateTime
  endTime        DateTime
  duration       Int           // in minutes
  status         ContestStatus @default(upcoming)
  isVirtual      Boolean       @default(false)
  rules          String        @default("")
  prizes         String        @default("")
  createdById    String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  createdBy      User              @relation("ContestCreator", fields: [createdById], references: [id])
  problems       ContestProblem[]
  registrations  ContestRegistration[]
  rankings       ContestRanking[]
}


// ─── CONTEST PROBLEMS ─────────────────────────────────────────────────

model ContestProblem {
  id         String @id @default(cuid())
  contestId  String
  problemId  String
  order      Int    @default(0)
  points     Int    @default(100)
  
  contest Contest       @relation(fields: [contestId], references: [id], onDelete: Cascade)
  problem  CodingProblem @relation(fields: [problemId], references: [id])
  
  @@unique([contestId, problemId])
}


// ─── CONTEST REGISTRATIONS ────────────────────────────────────────────

model ContestRegistration {
  id        String   @id @default(cuid())
  contestId String
  userId    String
  createdAt DateTime @default(now())
  
  contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([contestId, userId])
}


// ─── CONTEST RANKINGS ─────────────────────────────────────────────────

model ContestRanking {
  id         String   @id @default(cuid())
  contestId  String
  userId     String
  score      Int      @default(0)
  rank       Int?
  problemsSolved Int @default(0)
  totalTime  Int      @default(0) // in seconds
  finishedAt DateTime?
  
  contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([contestId, userId])
}


// ─── AI GENERATION CACHE ───────────────────────────────────────────────

model AiGenerationLog {
  id            String   @id @default(cuid())
  prompt        String
  response      String
  model         String   @default("gpt-4")
  tokensUsed    Int      @default(0)
  generationType String  @default("problem") // problem, solution, hint, etc.
  createdAt     DateTime @default(now())
}


// ─── USER PROBLEM PROGRESS ────────────────────────────────────────────

model UserProblemProgress {
  id              String   @id @default(cuid())
  userId          String
  problemId       String
  attempts        Int      @default(0)
  solved          Boolean  @default(false)
  lastSolvedAt    DateTime?
  bestSolution    String   @default("")
  bestScore       Float?
  bookmarked      Boolean  @default(false)
  notes           String   @default("")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem CodingProblem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  
  @@unique([userId, problemId])
}
```

## Relationship Diagram (Text)

```
User ───< ProblemSubmission >─── CodingProblem
User ───< ProblemBookmark >─── CodingProblem
User ───< UserProblemProgress >─── CodingProblem
User ───< MockInterview >─── Company
MockInterview ───< InterviewProblem >─── CodingProblem
MockInterview ───< InterviewQuestion
Contest ───< ContestProblem >─── CodingProblem
Contest ───< ContestRegistration >─── User
Contest ───< ContestRanking >─── User
Company ───< CodingProblem
Company ───< CompanyTag >─── Topic
Topic ───< CodingProblem
ProgrammingLanguage ───< CodingProblem
ProgrammingLanguage ───< ProblemSubmission
```

## Key Changes from Existing Schema

1. **NEW**: `CodingProblem` - Standalone problems not tied to concepts (supports the interview prep focus)
2. **NEW**: `Company` - Interview prep companies (Amazon, Google, etc.)
3. **NEW**: `ProgrammingLanguage` - Dedicated language model (was inline in CodeChallenge)
4. **NEW**: `Topic` - Hierarchical topic categorization
5. **NEW**: `ProblemSubmission` - Track submissions with real judge results
6. **NEW**: `MockInterview` & related - Full mock interview system
7. **NEW**: `Contest` & related - Coding contests with rankings
8. **NEW**: `UserProblemProgress` - Per-problem progress tracking
9. **EXTEND**: Existing `User` model gains new relations
