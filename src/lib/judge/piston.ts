/**
 * Piston API integration for code execution.
 * Piston is a free, public sandboxed code execution API.
 * Documentation: https://github.com/engineer-man/piston
 */

interface PistonExecuteResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

const PISTON_API_URL =
  process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";

export async function executeCode(
  language: string,
  code: string,
  stdin: string = "",
  timeLimit: number = 5000
): Promise<{
  output: string;
  error: string | null;
  exitCode: number;
  executionTimeMs: number;
}> {
  const startTime = performance.now();

  try {
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: "*", // Use latest version
        files: [
          {
            name: getFileName(language),
            content: code,
          },
        ],
        stdin,
        args: [],
        compile_timeout: 10000,
        run_timeout: timeLimit,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        output: "",
        error: `Piston API error (${response.status}): ${errorText}`,
        exitCode: response.status,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    const result: PistonExecuteResult = await response.json();
    const executionTimeMs = Math.round(performance.now() - startTime);

    // Check for compilation errors
    if (result.compile && result.compile.code !== 0) {
      return {
        output: result.compile.output || "",
        error: result.compile.stderr || "Compilation error",
        exitCode: result.compile.code,
        executionTimeMs,
      };
    }

    // Check runtime errors
    if (result.run.code !== 0) {
      return {
        output: result.run.output || result.run.stdout || "",
        error: result.run.stderr || `Exit code: ${result.run.code}`,
        exitCode: result.run.code,
        executionTimeMs,
      };
    }

    return {
      output: result.run.output || result.run.stdout || "",
      error: result.run.stderr || null,
      exitCode: result.run.code,
      executionTimeMs,
    };
  } catch (err: any) {
    return {
      output: "",
      error: err.message || "Failed to execute code",
      exitCode: 1,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

function getFileName(language: string): string {
  const extensions: Record<string, string> = {
    java: "Main.java",
    python: "main.py",
    cpp: "main.cpp",
    c: "main.c",
    javascript: "main.js",
    typescript: "main.ts",
    go: "main.go",
    rust: "main.rs",
    kotlin: "main.kt",
    swift: "main.swift",
    php: "main.php",
    csharp: "main.cs",
    ruby: "main.rb",
  };
  return extensions[language] || "main.txt";
}
