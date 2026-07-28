/**
 * AI Problem Generator Service
 *
 * Generates original coding interview problems using a local Ollama model.
 * Falls back to a template-based generator if Ollama is unavailable.
 */

import { COMPANIES } from "@/lib/constants/companies";
import { TOPICS } from "@/lib/constants/topics";
import { LANGUAGES } from "@/lib/constants/languages";

export interface GeneratedProblem {
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  story: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation: string }>;
  edgeCases: string[];
  hints: string[];
  tags: string[];
  companySlug: string;
  topicSlug: string;
  languageSlug: string;
  bruteForceSolution: string;
  optimalSolution: string;
  complexityAnalysis: string;
  dryRun: string;
  pseudoCode: string;
  solutionJava: string;
  solutionPython: string;
  solutionCpp: string;
  solutionJavaScript: string;
  solutionGo: string;
  solutionKotlin: string;
  testCases: Array<{ input: string; expected: string }>;
  hiddenTestCases: Array<{ input: string; expected: string }>;
  interviewTips: string;
  commonMistakes: string;
}

export interface GeneratorConfig {
  difficulty: string;
  topic: string;
  company: string;
  language: string;
}

// ── Prompt Builder ──

const DIFFICULTY_GUIDES: Record<string, string> = {
  easy: "The problem should have a straightforward solution using basic data structures like arrays, strings, or hash maps. Time complexity O(n) or O(n log n). Solvable by a junior engineer in 15-20 minutes.",
  medium: "The problem requires combinations of data structures or a moderate algorithmic insight. Might involve two-pointer, sliding window, BFS/DFS, or basic DP. Time complexity O(n²) or better. Typical for mid-level interviews.",
  hard: "The problem requires advanced algorithmic thinking—complex DP, advanced graph algorithms, or multi-step optimizations. Edge cases matter significantly. Time complexity O(n log n) or better with careful optimization.",
  expert: "The problem is at the level of the hardest competitive programming or senior staff engineer interviews. May require advanced data structures (segment tree, Fenwick tree), intricate math, or multi-dimensional optimization.",
};

function getDifficultyGuide(difficulty: string): string {
  return DIFFICULTY_GUIDES[difficulty] || DIFFICULTY_GUIDES.medium;
}

function buildSystemPrompt(): string {
  return `You are an expert coding interview problem generator. You create original, high-quality coding problems that test real algorithmic thinking.

YOUR RULES:
1. Generate ONLY original problems — never copy from LeetCode, HackerRank, or other platforms
2. Every problem must have a unique story/setting
3. Output ONLY valid JSON — no markdown, no commentary
4. All solutions must be correct and optimal
5. Test cases must be correct and cover edge cases
6. The problem must be solvable and well-defined`;
}

function buildGenerationPrompt(config: GeneratorConfig): string {
  const topic = config.topic !== "random"
    ? TOPICS.find((t) => t.slug === config.topic)
    : TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const company = config.company !== "random"
    ? COMPANIES.find((c) => c.slug === config.company)
    : COMPANIES[Math.floor(Math.random() * COMPANIES.length)];

  const language = config.language !== "random"
    ? LANGUAGES.find((l) => l.slug === config.language)
    : LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];

  const difficultyGuide = getDifficultyGuide(config.difficulty);

  return `Generate a coding interview problem with these specifications:

DIFFICULTY: ${config.difficulty}
${difficultyGuide}

TOPIC: ${topic?.name || "General Algorithms"} (${topic?.description || ""})

INSPIRED BY COMPANY: ${company?.name || "General Tech"} — create a story relevant to ${company?.name || "a tech company"}'s domain

PRIMARY LANGUAGE: ${language?.name || "Python"} — provide solutions in ALL these languages: Java, Python, C++, JavaScript, Go, Kotlin

OUTPUT FORMAT — return STRICT JSON (no markdown, no triple backticks):
{
  "title": "Short, descriptive problem title",
  "difficulty": "${config.difficulty}",
  "story": "A 2-3 sentence real-world scenario inspired by ${company?.name || "a tech company"} that makes the problem relatable",
  "problemStatement": "Clear, precise problem description with input/output explanation",
  "inputFormat": "Description of input format with line-by-line breakdown",
  "outputFormat": "Description of expected output format",
  "constraints": "All constraints listed clearly (array sizes, value ranges, time limits)",
  "examples": [
    { "input": "Example input string", "output": "Expected output string", "explanation": "Why this output is correct" }
  ],
  "edgeCases": ["Edge case 1", "Edge case 2", "Edge case 3", "Edge case 4"],
  "hints": ["Hint 1 - subtle", "Hint 2 - moderate", "Hint 3 - strong hint"],
  "tags": ["tag1", "tag2", "tag3"],
  "bruteForceSolution": "Clear explanation of the naive approach with algorithm steps",
  "optimalSolution": "Clear explanation of the optimal approach with algorithm steps",
  "complexityAnalysis": "Time and space complexity for both brute force and optimal approaches",
  "dryRun": "Step-by-step walkthrough of the optimal solution on one example",
  "pseudoCode": "Clean pseudo-code for the optimal solution",
  "solutionJava": "Complete Java solution with class Solution and public method",
  "solutionPython": "Complete Python solution with function definition",
  "solutionCpp": "Complete C++ solution with class Solution and method",
  "solutionJavaScript": "Complete JavaScript solution with function",
  "solutionGo": "Complete Go solution with function",
  "solutionKotlin": "Complete Kotlin solution with class Solution and fun",
  "testCases": [
    { "input": "Formatted input string", "expected": "Expected output string" }
  ],
  "hiddenTestCases": [
    { "input": "More test input", "expected": "More expected output" }
  ],
  "interviewTips": "What interviewers look for in this problem (1-2 sentences)",
  "commonMistakes": "The most common mistakes candidates make (1-2 sentences)"
}

IMPORTANT:
- Include at least 2 public test cases and 2 hidden test cases
- All code solutions must be syntactically correct and idiomatic for each language
- The problem MUST be original — invent a new twist or combination
- Make examples and dry run match exactly`;
}

// ── Slug Generator ──

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ── Ollama API Client ──

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:latest";

interface OllamaResponse {
  response: string;
  done: boolean;
  error?: string;
}

async function callOllama(prompt: string, systemPrompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          num_ctx: 8192,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }

    const data: OllamaResponse = await res.json();
    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`);
    }

    return data.response;
  } finally {
    clearTimeout(timeout);
  }
}

// ── JSON Extractor ──

function extractJson(raw: string): string {
  let cleaned = raw.trim();
  
  // Try to find JSON between triple backticks (most common AI wrapping)
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Find the first { and last }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned;
}

// ── Validator ──

function validateGeneratedProblem(data: any, config: GeneratorConfig): GeneratedProblem {
  const title = data.title?.trim();
  if (!title || title.length < 3) {
    throw new Error("Generated problem has invalid or missing title");
  }

  const difficulty = data.difficulty?.toLowerCase() || config.difficulty;
  if (!["easy", "medium", "hard", "expert"].includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  return {
    title,
    slug: toSlug(title),
    difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
    story: data.story?.trim() || "Solve this coding challenge.",
    problemStatement: data.problemStatement?.trim() || data.description?.trim() || "Write a function that solves the problem.",
    inputFormat: data.inputFormat?.trim() || "See examples for input format.",
    outputFormat: data.outputFormat?.trim() || "See examples for output format.",
    constraints: data.constraints?.trim() || "Standard constraints apply.",
    examples: Array.isArray(data.examples) ? data.examples.slice(0, 3) : [],
    edgeCases: Array.isArray(data.edgeCases) ? data.edgeCases.slice(0, 6) : [],
    hints: Array.isArray(data.hints) ? data.hints.slice(0, 5) : [],
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [],
    companySlug: config.company,
    topicSlug: config.topic,
    languageSlug: config.language,
    bruteForceSolution: data.bruteForceSolution?.trim() || "",
    optimalSolution: data.optimalSolution?.trim() || "",
    complexityAnalysis: data.complexityAnalysis?.trim() || "",
    dryRun: data.dryRun?.trim() || "",
    pseudoCode: data.pseudoCode?.trim() || "",
    solutionJava: data.solutionJava?.trim() || "",
    solutionPython: data.solutionPython?.trim() || "",
    solutionCpp: data.solutionCpp?.trim() || "",
    solutionJavaScript: data.solutionJavaScript?.trim() || "",
    solutionGo: data.solutionGo?.trim() || "",
    solutionKotlin: data.solutionKotlin?.trim() || "",
    testCases: Array.isArray(data.testCases) ? data.testCases.slice(0, 5) : [],
    hiddenTestCases: Array.isArray(data.hiddenTestCases) ? data.hiddenTestCases.slice(0, 5) : [],
    interviewTips: data.interviewTips?.trim() || "",
    commonMistakes: data.commonMistakes?.trim() || "",
  };
}

// ── Fallback Template Generator ──

function generateFallbackProblem(config: GeneratorConfig): GeneratedProblem {
  const difficulty = config.difficulty as "easy" | "medium" | "hard" | "expert";
  const companyName = COMPANIES.find((c) => c.slug === config.company)?.name || "Tech";
  const topicConfig = TOPICS.find((t) => t.slug === config.topic);

  const id = Date.now();
  const problemNumber = id % 10000;

  return {
    title: `Find the ${topicConfig?.name || "Algorithmic"} Peak`,
    slug: `find-the-${topicConfig?.slug || "algorithmic"}-peak-${problemNumber}`,
    difficulty,
    story: `At ${companyName}, you're working on a data analysis pipeline that needs to identify peak values in streaming datasets.`,
    problemStatement: `Given an array of integers nums, find a peak element and return its index. A peak element is an element that is strictly greater than its neighbors. You may assume that nums[-1] = nums[n] = -∞. The array is guaranteed to have at least one peak.`,
    inputFormat: `First line: integer n (1 ≤ n ≤ 10^5)\nSecond line: n space-separated integers`,
    outputFormat: `Single integer — the index of any peak element`,
    constraints: `1 ≤ n ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9\nAt least one peak exists`,
    examples: [
      { input: "4\n1 2 3 1", output: "2", explanation: "nums[2] = 3 is greater than both neighbors (2 and null)." },
      { input: "7\n1 2 1 3 5 6 4", output: "5", explanation: "nums[5] = 6 is greater than both neighbors (5 and 4)." },
    ],
    edgeCases: [
      "Single element: n=1 → index 0",
      "Two elements: the larger element is the peak",
      "Descending array: first element is the peak",
      "Ascending array: last element is the peak",
    ],
    hints: [
      "Consider the relationship between adjacent elements — it creates a directional clue.",
      "If nums[mid] < nums[mid+1], the peak lies to the right.",
      "If nums[mid] < nums[mid-1], the peak lies to the left.",
      "Binary search works because the array has a 'gradient' structure.",
    ],
    tags: ["binary-search", "array", "peak-finding"],
    companySlug: config.company,
    topicSlug: config.topic,
    languageSlug: config.language,
    bruteForceSolution: `Linear Scan (O(n)):
Iterate through the array and check each element. If an element is greater than both its left and right neighbors (or is at the boundary), return its index.

Algorithm:
1. If n == 1, return 0
2. Check first element: if nums[0] > nums[1], return 0
3. Check last element: if nums[n-1] > nums[n-2], return n-1
4. For i = 1 to n-2: if nums[i] > nums[i-1] && nums[i] > nums[i+1], return i`,
    optimalSolution: `Binary Search (O(log n)):
Since adjacent elements are unequal, we can use binary search. If nums[mid] > nums[mid+1], the peak is on the left side (including mid). Otherwise, the peak is on the right side. This works because the array inherently has a "peak-guaranteed" structure.

Algorithm:
1. Initialize lo = 0, hi = n-1
2. While lo < hi:
   a. mid = (lo + hi) / 2
   b. If nums[mid] > nums[mid+1], hi = mid (peak is on left)
   c. Else lo = mid + 1 (peak is on right)
3. Return lo`,
    complexityAnalysis: `Brute Force:\n• Time: O(n) — linear scan\n• Space: O(1)\n\nOptimal (Binary Search):\n• Time: O(log n) — binary search traversal\n• Space: O(1) — iterative, no recursion`,
    dryRun: `Example: nums = [1, 2, 3, 1]\n\nlo=0, hi=3\nmid = (0+3)/2 = 1\nnums[1]=2 > nums[2]=3? No → lo = mid+1 = 2\n\nlo=2, hi=3\nmid = (2+3)/2 = 2\nnums[2]=3 > nums[3]=1? Yes → hi = mid = 2\n\nlo=2, hi=2 → break\nReturn 2 ✓`,
    pseudoCode: `function findPeak(nums):\n    lo = 0, hi = len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) / 2\n        if nums[mid] > nums[mid + 1]:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
    solutionJava: `class Solution {\n    public int findPeak(int[] nums) {\n        int lo = 0, hi = nums.length - 1;\n        while (lo < hi) {\n            int mid = lo + (hi - lo) / 2;\n            if (nums[mid] > nums[mid + 1]) {\n                hi = mid;\n            } else {\n                lo = mid + 1;\n            }\n        }\n        return lo;\n    }\n}`,
    solutionPython: `def find_peak(nums):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[mid + 1]:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
    solutionCpp: `class Solution {\npublic:\n    int findPeak(vector<int>& nums) {\n        int lo = 0, hi = nums.size() - 1;\n        while (lo < hi) {\n            int mid = lo + (hi - lo) / 2;\n            if (nums[mid] > nums[mid + 1]) {\n                hi = mid;\n            } else {\n                lo = mid + 1;\n            }\n        }\n        return lo;\n    }\n};`,
    solutionJavaScript: `function findPeak(nums) {\n    let lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        const mid = Math.floor((lo + hi) / 2);\n        if (nums[mid] > nums[mid + 1]) {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    return lo;\n}`,
    solutionGo: `func findPeak(nums []int) int {\n    lo, hi := 0, len(nums)-1\n    for lo < hi {\n        mid := (lo + hi) / 2\n        if nums[mid] > nums[mid+1] {\n            hi = mid\n        } else {\n            lo = mid + 1\n        }\n    }\n    return lo\n}`,
    solutionKotlin: `class Solution {\n    fun findPeak(nums: IntArray): Int {\n        var lo = 0\n        var hi = nums.size - 1\n        while (lo < hi) {\n            val mid = lo + (hi - lo) / 2\n            if (nums[mid] > nums[mid + 1]) hi = mid\n            else lo = mid + 1\n        }\n        return lo\n    }\n}`,
    testCases: [
      { input: "4\n1 2 3 1", expected: "2" },
      { input: "7\n1 2 1 3 5 6 4", expected: "5" },
    ],
    hiddenTestCases: [
      { input: "1\n5", expected: "0" },
      { input: "2\n10 5", expected: "0" },
      { input: "5\n1 2 3 4 5", expected: "4" },
    ],
    interviewTips: "Binary search on an array that isn't sorted puzzles many candidates. Explain the 'gradient' insight: comparing nums[mid] vs nums[mid+1] tells you which direction the peak lies. This problem tests whether you can think beyond classic sorted binary search.",
    commonMistakes: "Overcomplicating with peak validation on both sides. The O(log n) solution only needs to compare mid with mid+1, not both neighbors. Also, forgetting the O(n) brute force when asked during warm-up.",
  };
}

// ── Main Generator ──

export async function generateProblem(config: GeneratorConfig): Promise<{
  problem: GeneratedProblem;
  usedAi: boolean;
  tokensUsed?: number;
}> {
  const prompt = buildGenerationPrompt(config);
  const systemPrompt = buildSystemPrompt();

  try {
    const rawResponse = await callOllama(prompt, systemPrompt);
    const cleaned = extractJson(rawResponse);
    const parsed = JSON.parse(cleaned);
    const problem = validateGeneratedProblem(parsed, config);
    return { problem, usedAi: true, tokensUsed: Math.round(cleaned.length / 4) };
  } catch (aiError) {
    console.warn("AI generation failed, using fallback:", aiError);
    const problem = generateFallbackProblem(config);
    return { problem, usedAi: false, tokensUsed: 0 };
  }
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function listAvailableModels(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: any) => m.name);
  } catch {
    return [];
  }
}
