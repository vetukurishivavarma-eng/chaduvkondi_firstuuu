/**
 * Judge Service - Orchestrates code execution, test case evaluation, and submission processing.
 */
import { executeCode } from "./piston";

export interface TestCase {
  input: string;
  expected: string;
  description?: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

export interface JudgeResult {
  status:
    | "accepted"
    | "wrong_answer"
    | "time_limit_exceeded"
    | "runtime_error"
    | "compilation_error";
  testResults: TestResult[];
  testsPassed: number;
  totalTests: number;
  executionTimeMs: number;
  score: number;
}

/**
 * Evaluate code against a set of test cases.
 * Wraps the user's code with test case invocations and runs via Piston API.
 */
export async function evaluateSubmission(
  code: string,
  language: string,
  testCases: TestCase[],
  hiddenTestCases: TestCase[] = [],
  timeLimit: number = 5000
): Promise<JudgeResult> {
  const allTestCases = [...testCases, ...hiddenTestCases];
  const results: TestResult[] = [];
  let totalTime = 0;

  for (const tc of allTestCases) {
    const runnerCode = wrapWithTestCase(language, code, tc);
    const result = await executeCode(language, runnerCode, "", timeLimit);
    totalTime += result.executionTimeMs;

    if (result.exitCode === 124 || (result.error && result.error.includes("timeout"))) {
      results.push({
        name: tc.description || `Test Case ${results.length + 1}`,
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: "Time Limit Exceeded",
        error: "Execution timed out",
      });
      continue;
    }

    if (result.error && !result.output) {
      results.push({
        name: tc.description || `Test Case ${results.length + 1}`,
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: result.output || "",
        error: result.error,
      });
      continue;
    }

    const actualOutput = result.output?.trim() || "";
    const expectedOutput = tc.expected.trim();
    const passed = actualOutput === expectedOutput;

    results.push({
      name: tc.description || `Test Case ${results.length + 1}`,
      passed,
      input: tc.input,
      expected: expectedOutput,
      actual: actualOutput,
      error: passed ? undefined : "Output mismatch",
    });
  }

  const testsPassed = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const allPassed = testsPassed === totalTests;

  let status: JudgeResult["status"];
  if (results.some((r) => r.error?.includes("timeout"))) {
    status = "time_limit_exceeded";
  } else if (results.some((r) => r.error && r.error.includes("Compilation"))) {
    status = "compilation_error";
  } else if (results.some((r) => r.error && !r.passed)) {
    status = "runtime_error";
  } else if (allPassed) {
    status = "accepted";
  } else {
    status = "wrong_answer";
  }

  return {
    status,
    testResults: results,
    testsPassed,
    totalTests,
    executionTimeMs: totalTime,
    score: Math.round((testsPassed / totalTests) * 100),
  };
}

/**
 * Quick run: execute code without test cases checking (for playground-style runs).
 */
export async function quickRun(
  code: string,
  language: string,
  stdin: string = ""
): Promise<{
  output: string;
  error: string | null;
  exitCode: number;
  executionTimeMs: number;
}> {
  return executeCode(language, code, stdin);
}

function wrapWithTestCase(
  language: string,
  userCode: string,
  testCase: TestCase
): string {
  // Extract function name from code
  let funcName = "solution";

  // Try Python function definition
  const pyMatch = userCode.match(/def\s+(\w+)\s*\(/);
  if (pyMatch) funcName = pyMatch[1];

  // Try Java class with method (supports both Solution and Main classes)
  const javaMethodMatch = userCode.match(/public\s+static\s+\w+[<>]?\s+(\w+)\s*\(/);
  if (javaMethodMatch) funcName = javaMethodMatch[1];

  // Try JavaScript/TypeScript function
  const jsMatch = userCode.match(/(?:function|const|let|var)\s+(\w+)\s*(?:=|\(|\s*=>)/);
  if (jsMatch) funcName = jsMatch[1];

  switch (language) {
    case "python":
      return `${userCode}\n\n# Test runner\nresult = ${funcName}(${testCase.input})\nprint(result)`;
    case "javascript":
    case "typescript":
      return `${userCode}\n\n// Test runner\nconst result = ${funcName}(${testCase.input});\nconsole.log(result);`;
    case "java": {
      // Check if user code already has a Main class (to avoid duplicate)
      const hasMainClass = userCode.includes('public class Main') || userCode.includes('class Main');
      if (hasMainClass) {
        // Replace the main method body to invoke the test case
        const call = `${funcName}(${testCase.input})`;
        const modifiedCode = userCode.replace(
          /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{[^}]*\}/,
          `public static void main(String[] args) {\n        System.out.println(${call});\n    }`
        );
        // If the regex didn't match (e.g., multi-line body), just wrap differently
        if (modifiedCode === userCode) {
          return `import java.util.*;\n\n${userCode}\n\nclass TestCaseRunner {\n  public static void main(String[] args) {\n    System.out.println(${call});\n  }\n}`;
        }
        return modifiedCode;
      }
      const call = `${funcName}(${testCase.input})`;
      return `import java.util.*;\n\n${userCode}\n\nclass TestCaseRunner {\n  public static void main(String[] args) {\n    System.out.println(${call});\n  }\n}`;
    }
    case "cpp":
      return `${userCode}\n\n// Test runner\nint main() {\n  std::cout << ${funcName}(${testCase.input}) << std::endl;\n  return 0;\n}`;
    case "c":
      return `${userCode}\n\n// Test runner\nint main() {\n  printf("%d\\n", ${funcName}(${testCase.input}));\n  return 0;\n}`;
    case "go":
      return `${userCode}\n\n// Test runner\nfunc main() {\n  fmt.Println(${funcName}(${testCase.input}))\n}`;
    case "rust":
      return `${userCode}\n\n// Test runner\nfn main() {\n  println!("{}", ${funcName}(${testCase.input}));\n}`;
    case "kotlin":
      return `${userCode}\n\n// Test runner\nfun main() {\n  println(${funcName}(${testCase.input}))\n}`;
    case "swift":
      return `${userCode}\n\n// Test runner\nprint(${funcName}(${testCase.input}))`;
    case "php":
      return `${userCode}\n\n// Test runner\necho ${funcName}(${testCase.input}) . "\\n";`;
    case "csharp":
      return `${userCode}\n\n// Test runner\nclass Runner {\n  static void Main() {\n    Console.WriteLine(${funcName}(${testCase.input}));\n  }\n}`;
    case "ruby":
      return `${userCode}\n\n# Test runner\nresult = ${funcName}(${testCase.input})\nputs result`;
    default:
      return userCode;
  }
}
