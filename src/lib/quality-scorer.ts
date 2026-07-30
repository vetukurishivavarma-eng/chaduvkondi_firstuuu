/**
 * Quality Scorer for AI-Generated Coding Problems
 *
 * Evaluates generated problems across 5 dimensions and produces:
 * - A composite score (0-100)
 * - Per-dimension breakdown
 * - Actionable improvement feedback for auto-retry prompt engineering
 */

import { GeneratedProblem, GeneratorConfig } from "./ai-generator";

// ── Score breakdown ──

export interface QualityScore {
  total: number; // 0-100
  completeness: number; // 0-30
  uniqueness: number; // 0-20
  consistency: number; // 0-20
  clarity: number; // 0-15
  difficultyMatch: number; // 0-15
  breakdown: QualityBreakdown;
}

export interface QualityBreakdown {
  completeness: { score: number; max: number; issues: string[] };
  uniqueness: { score: number; max: number; issues: string[] };
  consistency: { score: number; max: number; issues: string[] };
  clarity: { score: number; max: number; issues: string[] };
  difficultyMatch: { score: number; max: number; issues: string[] };
}

export interface RetryFeedback {
  score: number;
  weaknesses: string[];
  improvementPrompt: string; // Injected into next generation prompt
}

// ── Common low-quality problem titles to flag ──

const COMMON_TITLE_PATTERNS = [
  /^two sum/i,
  /^reverse linked/i,
  /^valid parenthes/i,
  /^merge two sorted/i,
  /^maximum subarray/i,
  /^binary search/i,
  /^invert binary/i,
  /^palindrome/i,
  /^fizz.?buzz/i,
  /^fibonacci/i,
  /^factorial/i,
  /^bubble.?sort/i,
  /^quick.?sort/i,
  /^linked.?list cycle/i,
  /^contains.?duplicate/i,
  /^best time.*stock/i,
  /^climbing stairs/i,
  /^single number/i,
  /^majority element/i,
  /^move zeroes/i,
  /^symmetric tree/i,
  /^maximum depth.*tree/i,
  /^same tree/i,
  /^path sum/i,
  /^roman to integer/i,
  /^longest common prefix/i,
  /^valid anagram/i,
  /^first unique/i,
  /^intersection.*array/i,
];

const COMMON_STORY_WORDS = [
  "e-commerce", "shopping cart", "social media feed",
  "search engine", "ride sharing", "food delivery",
  "movie recommendation", "streaming service",
];

// ── Difficulty vs complexity mapping ──

const COMPLEXITY_KEYWORDS: Record<string, string[]> = {
  easy: ["O(n)", "O(n log n)", "O(1)", "linear", "hash map", "array", "string", "two pointer"],
  medium: ["O(n²)", "O(n log n)", "dynamic programming", "dfs", "bfs", "backtracking", "greedy", "sliding window"],
  hard: ["O(n³)", "memoization", "segment tree", "trie", "union find", "topological sort", "dijkstra"],
  expert: ["O(2^n)", "fenwick tree", "heavy-light", "suffix array", "max flow", "min cut", "NP-complete"],
};

// ── Main scoring function ──

export function scoreProblem(
  problem: GeneratedProblem,
  config: GeneratorConfig
): QualityScore {
  const issues: string[] = [];

  // 1. Completeness (30 points)
  const completenessResult = scoreCompleteness(problem, config);
  issues.push(...completenessResult.issues);

  // 2. Uniqueness (20 points)
  const uniquenessResult = scoreUniqueness(problem);
  issues.push(...uniquenessResult.issues);

  // 3. Consistency (20 points)
  const consistencyResult = scoreConsistency(problem);
  issues.push(...consistencyResult.issues);

  // 4. Clarity (15 points)
  const clarityResult = scoreClarity(problem);
  issues.push(...clarityResult.issues);

  // 5. Difficulty Match (15 points)
  const difficultyResult = scoreDifficultyMatch(problem);
  issues.push(...difficultyResult.issues);

  const total = Math.min(
    100,
    completenessResult.score +
      uniquenessResult.score +
      consistencyResult.score +
      clarityResult.score +
      difficultyResult.score
  );

  return {
    total,
    completeness: completenessResult.score,
    uniqueness: uniquenessResult.score,
    consistency: consistencyResult.score,
    clarity: clarityResult.score,
    difficultyMatch: difficultyResult.score,
    breakdown: {
      completeness: completenessResult,
      uniqueness: uniquenessResult,
      consistency: consistencyResult,
      clarity: clarityResult,
      difficultyMatch: difficultyResult,
    },
  };
}

// ── Quality thresholds ──

export const QUALITY_THRESHOLD = 65; // Minimum score to accept without retry
export const MINIMUM_ACCEPTABLE = 40; // Minimum score to accept at all
export const MAX_RETRIES = 2;

export function isHighQuality(score: number): boolean {
  return score >= QUALITY_THRESHOLD;
}

export function isAcceptable(score: number): boolean {
  return score >= MINIMUM_ACCEPTABLE;
}

// ── Build retry prompt with feedback ──

export function buildRetryPrompt(
  config: GeneratorConfig,
  previousScore: QualityScore,
  retryCount: number
): string {
  const weaknesses = collectWeaknesses(previousScore);
  const weaknessText = weaknesses.join("\n- ");

  return `IMPORTANT FEEDBACK FROM PREVIOUS ATTEMPT (retry ${retryCount + 1}/${MAX_RETRIES + 1}):
The previous version had quality issues that MUST be improved:
- ${weaknessText}

Score breakdown from previous attempt:
- Completeness: ${previousScore.breakdown.completeness.score}/${previousScore.breakdown.completeness.max}
- Uniqueness: ${previousScore.breakdown.uniqueness.score}/${previousScore.breakdown.uniqueness.max}
- Consistency: ${previousScore.breakdown.consistency.score}/${previousScore.breakdown.consistency.max}
- Clarity: ${previousScore.breakdown.clarity.score}/${previousScore.breakdown.clarity.max}
- Difficulty Match: ${previousScore.breakdown.difficultyMatch.score}/${previousScore.breakdown.difficultyMatch.max}

Generate a COMPLETELY NEW problem. Do NOT reuse the same title, story, or approach.
Focus on fixing the specific issues listed above.`;
}

function collectWeaknesses(score: QualityScore): string[] {
  const weaknesses: string[] = [];

  if (score.breakdown.completeness.score < score.breakdown.completeness.max * 0.6) {
    weaknesses.push(score.breakdown.completeness.issues[0] || "Missing essential fields — all solutions, test cases, and analysis must be complete");
  }
  if (score.breakdown.uniqueness.score < score.breakdown.uniqueness.max * 0.6) {
    weaknesses.push(score.breakdown.uniqueness.issues[0] || "Problem is too similar to common known problems — invent a novel twist");
  }
  if (score.breakdown.consistency.score < score.breakdown.consistency.max * 0.6) {
    weaknesses.push(score.breakdown.consistency.issues[0] || "Examples, test cases, and dry run must be consistent with each other");
  }
  if (score.breakdown.clarity.score < score.breakdown.clarity.max * 0.6) {
    weaknesses.push(score.breakdown.clarity.issues[0] || "Problem statement must be crystal clear and well-formatted");
  }
  if (score.breakdown.difficultyMatch.score < score.breakdown.difficultyMatch.max * 0.6) {
    weaknesses.push(score.breakdown.difficultyMatch.issues[0] || "Solution complexity doesn't match the declared difficulty level");
  }

  return weaknesses;
}

// ── Dimension: Completeness (30 points) ──

function scoreCompleteness(problem: GeneratedProblem, config: GeneratorConfig): QualityScore["breakdown"]["completeness"] {
  const issues: string[] = [];
  let score = 0;
  const max = 30;

  // Title (2 pts)
  if (problem.title && problem.title.length >= 5) score += 2;
  else issues.push("Title is too short or missing");

  // Story (3 pts)
  if (problem.story && problem.story.length > 30) score += 3;
  else issues.push("Story is missing or too short");

  // Problem Statement (5 pts)
  if (problem.problemStatement && problem.problemStatement.length > 50) score += 5;
  else issues.push("Problem statement is missing or too brief");

  // Input/Output format (3 pts)
  if (problem.inputFormat && problem.inputFormat.length > 10) score += 1.5;
  else issues.push("Input format is missing or too brief");
  if (problem.outputFormat && problem.outputFormat.length > 10) score += 1.5;
  else issues.push("Output format is missing or too brief");

  // Constraints (2 pts)
  if (problem.constraints && problem.constraints.length > 15) score += 2;
  else issues.push("Constraints are missing or too generic");

  // Examples (4 pts)
  if (Array.isArray(problem.examples) && problem.examples.length >= 2) {
    score += 2;
    const hasExplanations = problem.examples.every((e) => e.explanation?.length > 5);
    if (hasExplanations) score += 2;
    else issues.push("Examples lack proper explanations");
  } else {
    issues.push("Need at least 2 examples with explanations");
  }

  // Solutions (6 pts — 1 each for Java, Python, C++, JS, Go, Kotlin)
  const solutions = [
    { key: "solutionJava", name: "Java" },
    { key: "solutionPython", name: "Python" },
    { key: "solutionCpp", name: "C++" },
    { key: "solutionJavaScript", name: "JavaScript" },
    { key: "solutionGo", name: "Go" },
    { key: "solutionKotlin", name: "Kotlin" },
  ];
  let missingSolutions = 0;
  for (const sol of solutions) {
    const code = (problem as any)[sol.key];
    if (code && code.length > 20 && !code.includes("Implement solution here")) {
      score += 1;
    } else {
      missingSolutions++;
    }
  }
  if (missingSolutions > 0) {
    issues.push(`${missingSolutions} language solution(s) are incomplete or missing`);
  }

  // Analysis (3 pts)
  if (problem.complexityAnalysis && problem.complexityAnalysis.length > 30) score += 1.5;
  else issues.push("Complexity analysis is missing or too brief");
  if (problem.dryRun && problem.dryRun.length > 30) score += 1.5;
  else issues.push("Dry run is missing or too brief");

  // Test cases (2 pts)
  if (Array.isArray(problem.testCases) && problem.testCases.length >= 2) score += 1;
  else issues.push("Need at least 2 public test cases");
  if (Array.isArray(problem.hiddenTestCases) && problem.hiddenTestCases.length >= 2) score += 1;
  else issues.push("Need at least 2 hidden test cases");

  return { score: Math.min(score, max), max, issues };
}

// ── Dimension: Uniqueness (20 points) ──

function scoreUniqueness(problem: GeneratedProblem): QualityScore["breakdown"]["uniqueness"] {
  const issues: string[] = [];
  let score = 0;
  const max = 20;

  // Check title against common problem patterns
  let titleUnique = true;
  for (const pattern of COMMON_TITLE_PATTERNS) {
    if (pattern.test(problem.title)) {
      titleUnique = false;
      break;
    }
  }

  if (titleUnique) {
    score += 8;
  } else {
    issues.push("Title matches a known common coding problem — needs a unique twist");
  }

  // Check story originality (avoid overused scenarios)
  const storyLower = problem.story.toLowerCase();
  let storyUnique = true;
  for (const word of COMMON_STORY_WORDS) {
    if (storyLower.includes(word)) {
      storyUnique = false;
      break;
    }
  }

  if (storyUnique) {
    score += 6;
  } else {
    issues.push("Story uses a common/cliché scenario — invent something fresh");
  }

  // Check if title length suggests creativity (> 20 chars is good)
  if (problem.title.length > 20) {
    score += 3;
  } else {
    issues.push("Title is too generic — add more descriptive specificity");
  }

  // Check tags for variety
  if (Array.isArray(problem.tags) && problem.tags.length >= 3) {
    score += 3;
  } else {
    issues.push("Need more diverse tags to describe the problem");
  }

  return { score: Math.min(score, max), max, issues };
}

// ── Dimension: Consistency (20 points) ──

function scoreConsistency(problem: GeneratedProblem): QualityScore["breakdown"]["consistency"] {
  const issues: string[] = [];
  let score = 0;
  const max = 20;

  // Check examples have matching input/output shape
  if (Array.isArray(problem.examples)) {
    let allHaveIO = true;
    for (const ex of problem.examples) {
      if (!ex.input || !ex.output) {
        allHaveIO = false;
        break;
      }
    }
    if (allHaveIO) score += 5;
    else issues.push("Some examples are missing input or output");
  }

  // Check test cases have matching input/expected
  const allTestCases = [
    ...(Array.isArray(problem.testCases) ? problem.testCases : []),
    ...(Array.isArray(problem.hiddenTestCases) ? problem.hiddenTestCases : []),
  ];

  if (allTestCases.length >= 2) {
    let allHaveIO = true;
    for (const tc of allTestCases) {
      if (!tc.input || tc.expected === undefined || tc.expected === null) {
        allHaveIO = false;
        break;
      }
    }
    if (allHaveIO) score += 5;
    else issues.push("Some test cases are missing input or expected output");
  } else {
    issues.push("Need more test cases for consistency check");
  }

  // Check dry run references the first example
  const firstExample = Array.isArray(problem.examples) ? problem.examples[0] : null;
  if (firstExample && problem.dryRun) {
    const dryRunLower = problem.dryRun.toLowerCase();
    const firstInput = firstExample.input.toLowerCase().slice(0, 30);
    const firstOutput = firstExample.output.toLowerCase().slice(0, 10);

    if (dryRunLower.includes(firstInput) || dryRunLower.includes(firstOutput)) {
      score += 5;
    } else {
      issues.push("Dry run doesn't reference the first example — they should align");
    }
  }

  // Check brute force and optimal are different
  if (
    problem.bruteForceSolution &&
    problem.optimalSolution &&
    problem.bruteForceSolution.length > 20 &&
    problem.optimalSolution.length > 20 &&
    problem.bruteForceSolution !== problem.optimalSolution
  ) {
    score += 5;
  } else {
    issues.push("Brute force and optimal solutions should be distinct and substantive");
  }

  return { score: Math.min(score, max), max, issues };
}

// ── Dimension: Clarity (15 points) ──

function scoreClarity(problem: GeneratedProblem): QualityScore["breakdown"]["clarity"] {
  const issues: string[] = [];
  let score = 0;
  const max = 15;

  // Problem statement length as clarity proxy
  if (problem.problemStatement.length > 100) score += 4;
  else issues.push("Problem statement is too short to be clear");

  // Has helpful hints
  if (Array.isArray(problem.hints) && problem.hints.length >= 2) {
    const hasSubstance = problem.hints.some((h) => h.length > 30);
    if (hasSubstance) score += 3;
    else issues.push("Hints are too generic — add more specific guidance");
  } else {
    issues.push("Need at least 2 meaningful hints");
  }

  // Has edge cases
  if (Array.isArray(problem.edgeCases) && problem.edgeCases.length >= 2) {
    score += 3;
  } else {
    issues.push("Need at least 2 edge cases");
  }

  // Interview tips and common mistakes
  if (problem.interviewTips && problem.interviewTips.length > 30) score += 2.5;
  else issues.push("Interview tips are missing or too brief");

  if (problem.commonMistakes && problem.commonMistakes.length > 30) score += 2.5;
  else issues.push("Common mistakes section is missing or too brief");

  return { score: Math.min(score, max), max, issues };
}

// ── Dimension: Difficulty Match (15 points) ──

function scoreDifficultyMatch(problem: GeneratedProblem): QualityScore["breakdown"]["difficultyMatch"] {
  const issues: string[] = [];
  let score = 0;
  const max = 15;

  // Check if complexity analysis mentions keywords appropriate for the difficulty
  const complexityLower = (problem.complexityAnalysis || "").toLowerCase();
  const expectedKeywords = COMPLEXITY_KEYWORDS[problem.difficulty] || COMPLEXITY_KEYWORDS.medium;

  let matchedKeywords = 0;
  for (const keyword of expectedKeywords) {
    if (complexityLower.includes(keyword)) {
      matchedKeywords++;
    }
  }

  // Should match at least 2 keywords for the declared difficulty
  if (matchedKeywords >= 2) {
    score += 7;
  } else {
    issues.push(`Complexity analysis doesn't match ${problem.difficulty} difficulty — expected keywords: ${expectedKeywords.slice(0, 3).join(", ")}`);
  }

  // Check if brute force and optimal have reasonable complexity claims
  const bruteForceComplexity = extractComplexity(problem.bruteForceSolution);
  const optimalComplexity = extractComplexity(problem.optimalSolution);

  if (bruteForceComplexity && optimalComplexity) {
    // Optimal should be better than brute force
    if (compareComplexity(optimalComplexity, bruteForceComplexity) < 0) {
      score += 5;
    } else {
      issues.push("Optimal solution should be strictly better than brute force");
    }
  }

  // Check optional vs required field presence
  const pseudoCode = problem.pseudoCode?.trim();
  if (pseudoCode && pseudoCode.length > 20) score += 3;
  else issues.push("Pseudo code is missing or too brief");

  return { score: Math.min(score, max), max, issues };
}

// ── Helpers ──

interface ComplexityEstimate {
  time: string;
  space: string;
}

function extractComplexity(text: string): ComplexityEstimate | null {
  if (!text) return null;

  // Try to find O(...) patterns
  const timeMatch = text.match(/O\s*\(([^)]+)\)/i);
  if (!timeMatch) return null;

  return {
    time: timeMatch[1].toLowerCase(),
    space: "unknown", // We don't need space for comparison
  };
}

function compareComplexity(a: ComplexityEstimate, b: ComplexityEstimate): number {
  // Returns < 0 if a is better (lower complexity) than b
  // Check longest patterns first so "n²" is matched before "n"
  const order = ["1", "log n", "n", "n log n", "n²", "n³", "2^n", "n!"];
  
  function complexityIndex(est: ComplexityEstimate): number {
    // Sort by descending length: longer patterns checked first avoids substring ambiguity
    const sorted = [...order].sort((a, b) => b.length - a.length);
    for (const o of sorted) {
      if (est.time.includes(o)) return order.indexOf(o);
    }
    return -1;
  }

  const aIdx = complexityIndex(a);
  const bIdx = complexityIndex(b);
  if (aIdx === -1 && bIdx === -1) return 0;
  if (aIdx === -1) return 1;
  if (bIdx === -1) return -1;
  return aIdx - bIdx;
}
