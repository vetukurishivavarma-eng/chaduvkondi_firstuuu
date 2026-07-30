/**
 * AI Problem Generator Service
 *
 * Generates original coding interview problems using a local Ollama model.
 * Features enhanced prompt engineering for llama3.2 including:
 * - Chain-of-thought reasoning before JSON output
 * - Structured JSON schema with field-by-field guidance
 * - Few-shot example for consistent formatting
 * - Two-phase fallback if initial generation fails
 * - Robust JSON extraction with multiple cleaning passes
 */

import { COMPANIES } from "@/lib/constants/companies";
import { TOPICS } from "@/lib/constants/topics";
import { LANGUAGES } from "@/lib/constants/languages";
import {
  scoreProblem,
  isHighQuality,
  isAcceptable,
  buildRetryPrompt,
  MAX_RETRIES,
  QUALITY_THRESHOLD,
  QualityScore,
} from "./quality-scorer";

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

export interface GenerationResult {
  problem: GeneratedProblem;
  usedAi: boolean;
  tokensUsed?: number;
  qualityScore?: QualityScore;
  retriesAttempted?: number;
}

// ── Difficulty Guides ──

const DIFFICULTY_GUIDES: Record<string, string> = {
  easy: "The problem should have a straightforward solution using basic data structures like arrays, strings, or hash maps. Time complexity O(n) or O(n log n). Solvable by a junior engineer in 15-20 minutes.",
  medium: "The problem requires combinations of data structures or a moderate algorithmic insight. Might involve two-pointer, sliding window, BFS/DFS, or basic DP. Time complexity O(n²) or better. Typical for mid-level interviews.",
  hard: "The problem requires advanced algorithmic thinking—complex DP, advanced graph algorithms, or multi-step optimizations. Edge cases matter significantly. Time complexity O(n log n) or better with careful optimization.",
  expert: "The problem is at the level of the hardest competitive programming or senior staff engineer interviews. May require advanced data structures (segment tree, Fenwick tree), intricate math, or multi-dimensional optimization.",
};

function getDifficultyGuide(difficulty: string): string {
  return DIFFICULTY_GUIDES[difficulty] || DIFFICULTY_GUIDES.medium;
}

// ── Slug Generator ──

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ── Ollama Configuration ──

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:latest";

export function getModelName(): string {
  return OLLAMA_MODEL;
}

interface OllamaResponse {
  response: string;
  done: boolean;
  error?: string;
}

// ── Enhanced System Prompt ──

export function buildSystemPrompt(): string {
  return `You are an expert coding interview problem generator. Your task is to create original, high-quality coding problems that test real algorithmic thinking, similar to what candidates encounter at top tech companies.

## YOUR RULES
1. Generate ONLY original problems — never copy from LeetCode, HackerRank, Codeforces, or any existing platform
2. Every problem must have a unique story/setting — invent a fresh scenario every time
3. Output ONLY valid JSON — no markdown, no triple backticks, no code fences, no commentary before or after
4. All code solutions must be syntactically correct, idiomatic, and runnable
5. Test cases must be correct and cover normal cases, edge cases, and corner cases
6. The problem must be well-defined and solvable within the given constraints
7. Be creative — combine topics in novel ways, invent new twists on classic patterns

## OUTPUT APPROACH
Before generating the JSON, think through these steps silently:
1. What novel problem can I create combining the given topic and company domain?
2. What's the cleanest problem statement that captures the essence?
3. What's the brute force approach? What's the optimal approach?
4. What test cases would catch common mistakes?
5. How would I explain this to a candidate in an interview?

Then output ONLY the JSON object. No explanations, no notes, no markdown.`;
}

// ── Enhanced Generation Prompt ──

export function buildGenerationPrompt(config: GeneratorConfig): string {
  const topicObj = config.topic !== "random"
    ? TOPICS.find((t) => t.slug === config.topic)
    : TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const companyObj = config.company !== "random"
    ? COMPANIES.find((c) => c.slug === config.company)
    : COMPANIES[Math.floor(Math.random() * COMPANIES.length)];

  const languageObj = config.language !== "random"
    ? LANGUAGES.find((l) => l.slug === config.language)
    : LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];

  const topic = topicObj?.name || "Algorithms";
  const company = companyObj?.name || "Tech";
  const language = languageObj?.name || "Python";
  const difficultyGuide = getDifficultyGuide(config.difficulty);

  return `Generate an original coding interview problem with these exact specifications:

## SPECIFICATIONS

DIFFICULTY: ${config.difficulty}
${difficultyGuide}

TOPIC: ${topic}
Domain context: ${topicObj?.description || "General algorithmic problem"}

COMPANY INSPIRATION: ${company}
Create a story scenario that relates to ${company}'s business domain (e.g., e-commerce for Amazon, search for Google, social for Meta, streaming for Netflix).

PRIMARY LANGUAGE: ${language}
You MUST provide complete, correct solutions in ALL six languages: Java, Python, C++, JavaScript, Go, and Kotlin.

## JSON OUTPUT FORMAT

Return ONLY this exact JSON structure — no markdown, no backticks, no additional text:

{
  "title": "A concise, descriptive problem title (max 60 chars)",
  "difficulty": "${config.difficulty}",
  "story": "A 2-3 sentence real-world scenario that makes the problem relatable. Must be unique — invent a new scenario each time.",
  "problemStatement": "Clear, precise problem description. Define the function signature, input parameters, return type, and expected behavior in detail.",
  "inputFormat": "Line-by-line description of the input format. Example:\\nFirst line: integer n (number of elements)\\nSecond line: n space-separated integers",
  "outputFormat": "Description of the expected output format with example.",
  "constraints": "All constraints as a clear list. Include:\\n- Array/input size ranges\\n- Value ranges for all inputs\\n- Time/memory limits if applicable",
  "examples": [
    {
      "input": "The exact input string as would be passed to the program",
      "output": "The exact expected output string",
      "explanation": "Step-by-step explanation of why this input produces this output"
    }
  ],
  "edgeCases": [
    "Describe edge case 1",
    "Describe edge case 2",
    "Describe edge case 3",
    "Describe edge case 4"
  ],
  "hints": [
    "Hint 1 — subtle observation (10% toward solution)",
    "Hint 2 — moderate hint (50% toward solution)",
    "Hint 3 — strong hint (almost gives away the approach)"
  ],
  "tags": ["topic-related-tag", "technique-tag", "data-structure-tag", "company-tag"],
  "bruteForceSolution": "Clear explanation of the naive approach. Include algorithm steps and why it's suboptimal.",
  "optimalSolution": "Detailed explanation of the optimal approach. Include algorithm steps, key insights, and proof of correctness.",
  "complexityAnalysis": "Time and space complexity for both approaches.\\n\\nBrute Force:\\n• Time: O(?) — explanation\\n• Space: O(?) — explanation\\n\\nOptimal:\\n• Time: O(?) — explanation\\n• Space: O(?) — explanation",
  "dryRun": "Step-by-step walkthrough of the optimal solution on the first example. Show each step with intermediate values.\\n\\nExample: ...\\nStep 1: ...\\nStep 2: ...\\n...\\nFinal: ...",
  "pseudoCode": "Clean, readable pseudo-code for the optimal solution. Use standard algorithmic notation.",
  "solutionJava": "Complete Java solution with 'class Solution { public ... }' using standard Java conventions.",
  "solutionPython": "Complete Python solution with def function definition, type hints, and docstring.",
  "solutionCpp": "Complete C++ solution with 'class Solution { public: ... };' using modern C++ (C++17).",
  "solutionJavaScript": "Complete JavaScript solution with function definition using modern JS (ES6+).",
  "solutionGo": "Complete Go solution with func definition and proper error handling if applicable.",
  "solutionKotlin": "Complete Kotlin solution with 'class Solution { fun ... }' using idiomatic Kotlin.",
  "testCases": [
    { "input": "Formatted input string 1", "expected": "Expected output 1" },
    { "input": "Formatted input string 2", "expected": "Expected output 2" }
  ],
  "hiddenTestCases": [
    { "input": "Edge case input 1", "expected": "Expected output for edge case 1" },
    { "input": "Edge case input 2", "expected": "Expected output for edge case 2" },
    { "input": "Corner case input", "expected": "Expected output for corner case" }
  ],
  "interviewTips": "What interviewers look for: key insights, common follow-up questions, and how to stand out.",
  "commonMistakes": "The 2-3 most common mistakes candidates make on this problem."
}

## QUALITY REQUIREMENTS

1. The problem MUST be ORIGINAL — combine the topic with a unique twist. Do NOT use standard problems like "Two Sum", "Reverse Linked List", "Valid Parentheses", etc.
2. Include exactly 3 examples showing different cases (typical, edge, complex)
3. Include at least 2 public test cases and 3 hidden test cases
4. All 6 language solutions must be COMPLETE, CORRECT, and COMPILABLE
5. The dry run must exactly match the first example's input/output
6. Examples, test cases, and dry run must be consistent with each other

Remember: Output ONLY valid JSON. No markdown. No backticks. No commentary. Just the JSON object.`;
}

// ── Ollama API Client (non-streaming) ──

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
          temperature: 0.3,
          top_p: 0.85,
          num_ctx: 8192,
          repeat_penalty: 1.1,
          stop: ["\n```", "```\n"],
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

// ── Ollama API Client (streaming) ──
// Returns an async generator that yields { token: string, done: boolean } chunks

export interface StreamChunk {
  token: string;
  done: boolean;
  fullText?: string; // Only present when done is true
}

export async function* callOllamaStreaming(
  prompt: string,
  systemPrompt: string
): AsyncGenerator<StreamChunk> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: true,
        options: {
          temperature: 0.3,
          top_p: 0.85,
          num_ctx: 8192,
          repeat_penalty: 1.1,
          stop: ["\n```", "```\n"],
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("Ollama response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines from the buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const token = parsed.response || "";
          fullText += token;

          if (parsed.done) {
            yield { token: "", done: true, fullText };
            return;
          }

          yield { token, done: false };
        } catch {
          // Skip malformed lines — they're rare but can happen
          continue;
        }
      }
    }

    // If we exit the loop without done=true, still yield the accumulated text
    yield { token: "", done: true, fullText };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Robust JSON Extractor ──

export function extractJson(raw: string): string {
  let cleaned = raw.trim();

  // Remove any BOM characters
  cleaned = cleaned.replace(/^\uFEFF/, "");

  // Try to find JSON between markdown code blocks (most common wrapping)
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Try to find JSON between triple backtick variants (some models use ``` or `````)
  const backtickMatch = cleaned.match(/````?\s*\n?([\s\S]*?)````?/);
  if (backtickMatch) {
    cleaned = backtickMatch[1].trim();
  }

  // Remove any leading text before the first { (model might add commentary)
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace > 0) {
    // Check if there's substantial non-JSON text before the brace
    const before = cleaned.substring(0, firstBrace).trim();
    if (before.length > 0 && !before.startsWith("[")) {
      cleaned = cleaned.substring(firstBrace);
    }
  }

  // Remove any trailing text after the last }
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }

  // Fix common JSON formatting issues
  cleaned = cleaned
    // Remove trailing commas before closing braces
    .replace(/,\s*}/g, "}")
    // Remove trailing commas before closing brackets
    .replace(/,\s*\]/g, "]")
    // Replace single quotes with double quotes (but not inside strings)
    .replace(/(?<!\\)'(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/g, '"')
    // Fix unquoted keys (common issue with smaller models)
    .replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Remove newlines and excessive whitespace within string values
    .replace(/\n\s*/g, " ")
    // Collapse multiple spaces
    .replace(/  +/g, " ");

  return cleaned;
}

// ── Simple fallback JSON parser ──

export function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ── Two-Phase Retry Generator ──
// If full problem generation fails, try a simpler prompt focused on just the problem description

async function generateWithRetry(config: GeneratorConfig): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const fullPrompt = buildGenerationPrompt(config);

  // Phase 1: Full generation
  try {
    const response = await callOllama(fullPrompt, systemPrompt);
    const cleaned = extractJson(response);
    const parsed = tryParseJson(cleaned);
    if (parsed && parsed.title && parsed.problemStatement) {
      return cleaned;
    }
    console.warn("Phase 1 JSON was incomplete, trying Phase 2...");
  } catch (e) {
    console.warn("Phase 1 failed, trying Phase 2...", e);
  }

  // Phase 2: Simpler prompt — just the essential fields
  const simplerPrompt = `Create an original coding problem.

DIFFICULTY: ${config.difficulty}
TOPIC: ${TOPICS.find((t) => t.slug === config.topic)?.name || "Algorithms"}
COMPANY: ${COMPANIES.find((c) => c.slug === config.company)?.name || "Tech"}

Output ONLY valid JSON with these fields:
- title (string)
- difficulty (string)
- story (string)
- problemStatement (string)
- inputFormat (string)
- outputFormat (string)
- constraints (string)
- examples (array of {input, output, explanation})
- edgeCases (array of strings)
- hints (array of strings)
- tags (array of strings)
- bruteForceSolution (string)
- optimalSolution (string)
- complexityAnalysis (string)
- dryRun (string)
- pseudoCode (string)
- solutionJava, solutionPython, solutionCpp, solutionJavaScript, solutionGo, solutionKotlin (each a complete code string)
- testCases, hiddenTestCases (arrays of {input, expected})
- interviewTips (string)
- commonMistakes (string)

IMPORTANT: Output ONLY valid JSON. No markdown. No backticks.`;

  const response = await callOllama(simplerPrompt, systemPrompt);
  return extractJson(response);
}

// ── Quality-Aware Retry Generator ──
// Re-generates with feedback from the previous attempt's quality score

async function generateWithRetryWithFeedback(
  config: GeneratorConfig,
  previousScore: QualityScore,
  retryIndex: number
): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const basePrompt = buildGenerationPrompt(config);
  const feedback = buildRetryPrompt(config, previousScore, retryIndex);

  // Full prompt with quality feedback appended
  const fullPrompt = `${basePrompt}\n\n${feedback}`;

  try {
    const response = await callOllama(fullPrompt, systemPrompt);
    const cleaned = extractJson(response);
    const parsed = tryParseJson(cleaned);
    if (parsed && parsed.title && parsed.problemStatement) {
      return cleaned;
    }
    console.warn("Quality retry Phase 1 failed, trying simpler prompt...");
  } catch (e) {
    console.warn("Quality retry Phase 1 failed, trying simpler...", e);
  }

  // Fall back to simpler prompt with feedback
  const simplerPrompt = `Create an original coding problem.

DIFFICULTY: ${config.difficulty}
TOPIC: ${TOPICS.find((t) => t.slug === config.topic)?.name || "Algorithms"}
COMPANY: ${COMPANIES.find((c) => c.slug === config.company)?.name || "Tech"}

PREVIOUS ATTEMPT FEEDBACK:
${feedback}

Output ONLY valid JSON with all required fields.
IMPORTANT: Output ONLY valid JSON. No markdown. No backticks.`;

  const response = await callOllama(simplerPrompt, systemPrompt);
  return extractJson(response);
}

// ── Validator ──

export function validateGeneratedProblem(data: any, config: GeneratorConfig): GeneratedProblem {
  const title = data.title?.trim();
  if (!title || title.length < 3) {
    throw new Error("Generated problem has invalid or missing title");
  }

  const difficulty = data.difficulty?.toLowerCase();
  const validDifficulty = difficulty && ["easy", "medium", "hard", "expert"].includes(difficulty)
    ? difficulty as "easy" | "medium" | "hard" | "expert"
    : config.difficulty as "easy" | "medium" | "hard" | "expert";

  return {
    title,
    slug: toSlug(title),
    difficulty: validDifficulty,
    story: data.story?.trim() || `A ${config.difficulty} coding challenge inspired by ${COMPANIES.find((c) => c.slug === config.company)?.name || "tech"} interviews.`,
    problemStatement: data.problemStatement?.trim() || data.description?.trim() || "Write a function that solves the described problem efficiently.",
    inputFormat: data.inputFormat?.trim() || "See examples for input format details.",
    outputFormat: data.outputFormat?.trim() || "See examples for expected output format.",
    constraints: data.constraints?.trim() || "Standard constraints apply. See examples for typical input sizes.",
    examples: Array.isArray(data.examples) ? data.examples.slice(0, 3) : [],
    edgeCases: Array.isArray(data.edgeCases) ? data.edgeCases.slice(0, 6) : [],
    hints: Array.isArray(data.hints) ? data.hints.slice(0, 5) : [
      "Think about what data structure would best organize the input data.",
      "Consider the time complexity constraints — what's the fastest possible approach?",
      "Try working through a small example manually to spot the pattern.",
    ],
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [config.topic, config.difficulty],
    companySlug: config.company,
    topicSlug: config.topic,
    languageSlug: config.language,
    bruteForceSolution: data.bruteForceSolution?.trim() || "See optimal solution for approach.",
    optimalSolution: data.optimalSolution?.trim() || "Implement the efficient solution described in the analysis.",
    complexityAnalysis: data.complexityAnalysis?.trim() || "Time complexity depends on the approach used. Space complexity depends on auxiliary data structures.",
    dryRun: data.dryRun?.trim() || "Trace through the algorithm with the first example to verify correctness.",
    pseudoCode: data.pseudoCode?.trim() || "Implement the algorithm in your preferred language following the problem constraints.",
    solutionJava: data.solutionJava?.trim() || "// Java solution\nclass Solution {\n    public void solve() {\n        // Implement solution here\n    }\n}",
    solutionPython: data.solutionPython?.trim() || "# Python solution\ndef solve():\n    pass  # Implement solution here",
    solutionCpp: data.solutionCpp?.trim() || "// C++ solution\nclass Solution {\npublic:\n    void solve() {\n        // Implement solution here\n    }\n};",
    solutionJavaScript: data.solutionJavaScript?.trim() || "// JavaScript solution\nfunction solve() {\n    // Implement solution here\n}",
    solutionGo: data.solutionGo?.trim() || "// Go solution\nfunc solve() {\n    // Implement solution here\n}",
    solutionKotlin: data.solutionKotlin?.trim() || "// Kotlin solution\nclass Solution {\n    fun solve() {\n        // Implement solution here\n    }\n}",
    testCases: Array.isArray(data.testCases) ? data.testCases.slice(0, 5) : [],
    hiddenTestCases: Array.isArray(data.hiddenTestCases) ? data.hiddenTestCases.slice(0, 5) : [],
    interviewTips: data.interviewTips?.trim() || "Focus on explaining your approach clearly before writing code. Discuss trade-offs between different solutions.",
    commonMistakes: data.commonMistakes?.trim() || "Rushing into coding without fully understanding the problem. Not considering edge cases.",
  };
}

// ── Fallback Template Generator ──

export function generateFallbackProblem(config: GeneratorConfig): GeneratedProblem {
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
    bruteForceSolution: `Linear Scan (O(n)):\nIterate through the array and check each element. If an element is greater than both its left and right neighbors (or is at the boundary), return its index.\n\nAlgorithm:\n1. If n == 1, return 0\n2. Check first element: if nums[0] > nums[1], return 0\n3. Check last element: if nums[n-1] > nums[n-2], return n-1\n4. For i = 1 to n-2: if nums[i] > nums[i-1] && nums[i] > nums[i+1], return i`,
    optimalSolution: `Binary Search (O(log n)):\nSince adjacent elements are unequal, we can use binary search. If nums[mid] > nums[mid+1], the peak is on the left side (including mid). Otherwise, the peak is on the right side. This works because the array inherently has a "peak-guaranteed" structure.\n\nAlgorithm:\n1. Initialize lo = 0, hi = n-1\n2. While lo < hi:\n   a. mid = (lo + hi) / 2\n   b. If nums[mid] > nums[mid+1], hi = mid (peak is on left)\n   c. Else lo = mid + 1 (peak is on right)\n3. Return lo`,
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

// ── Main Generator with Quality Scoring ──

export async function generateProblem(config: GeneratorConfig): Promise<GenerationResult> {
  // Check if Ollama is available first
  let ollamaAvailable = false;
  try {
    ollamaAvailable = await isOllamaAvailable();
  } catch {
    ollamaAvailable = false;
  }

  if (!ollamaAvailable) {
    console.warn("Ollama not available, using fallback template generator");
    const problem = generateFallbackProblem(config);
    return { problem, usedAi: false, tokensUsed: 0 };
  }

  // Phase 1: Try full generation with quality-aware retries
  let bestResult: GenerationResult | null = null;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    attempt++;

    try {
      const rawResponse = await (attempt === 1
        ? generateWithRetry(config)
        : generateWithRetryWithFeedback(config, bestResult!.qualityScore!, attempt - 2));

      const cleaned = extractJson(rawResponse);
      const parsed = tryParseJson(cleaned);

      if (!parsed) {
        if (attempt <= MAX_RETRIES) continue;
        throw new Error("JSON parsing failed after all retries");
      }

      const problem = validateGeneratedProblem(parsed, config);

      // Score the problem
      const qualityScore = scoreProblem(problem, config);

      const currentResult: GenerationResult = {
        problem,
        usedAi: true,
        tokensUsed: Math.round(rawResponse.length / 4),
        qualityScore,
        retriesAttempted: attempt - 1,
      };

      // Keep the best result
      if (!bestResult || qualityScore.total > (bestResult.qualityScore?.total || 0)) {
        bestResult = currentResult;
      }

      // If high quality, accept immediately
      if (isHighQuality(qualityScore.total)) {
        console.log(`Problem accepted: quality=${qualityScore.total}/100 (attempt ${attempt})`);
        return currentResult;
      }

      // If not acceptable, retry
      if (attempt <= MAX_RETRIES) {
        console.warn(`Quality score ${qualityScore.total}/100 below threshold ${QUALITY_THRESHOLD}, retrying (attempt ${attempt}/${MAX_RETRIES + 1})...`);
      }
    } catch (attemptError) {
      console.warn(`Attempt ${attempt} failed:`, attemptError);
      if (attempt > MAX_RETRIES) {
        console.warn("All retries exhausted, using fallback");
        const problem = generateFallbackProblem(config);
        return { problem, usedAi: false, tokensUsed: 0 };
      }
    }
  }

  // Return the best result even if below threshold
  if (bestResult) {
    console.warn(`Returning best result: quality=${bestResult.qualityScore?.total}/100 (below threshold ${QUALITY_THRESHOLD})`);
    return bestResult;
  }

  // Ultimate fallback
  console.warn("AI generation failed entirely, using fallback");
  const problem = generateFallbackProblem(config);
  return { problem, usedAi: false, tokensUsed: 0 };
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
