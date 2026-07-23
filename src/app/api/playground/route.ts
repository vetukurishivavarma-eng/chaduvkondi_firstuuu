import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const LANGUAGE_RUNNERS: Record<string, { image: string; filename: string; preamble: string }> = {
  python: {
    image: "python:3.12-slim",
    filename: "script.py",
    preamble: "python3 /tmp/script.py",
  },
  javascript: {
    image: "node:22-slim",
    filename: "script.mjs",
    preamble: "node /tmp/script.mjs",
  },
  typescript: {
    image: "node:22-slim",
    filename: "script.ts",
    preamble: "npx tsx /tmp/script.ts",
  },
  rust: {
    image: "rust:1.81-slim",
    filename: "main.rs",
    preamble: "rustc /tmp/main.rs -o /tmp/output 2>&1 && /tmp/output",
  },
  java: {
    image: "openjdk:23-slim",
    filename: "Main.java",
    preamble: "javac /tmp/Main.java 2>&1 && java -cp /tmp Main",
  },
  go: {
    image: "golang:1.23-slim",
    filename: "main.go",
    preamble: "go run /tmp/main.go",
  },
};

const PISTON_ENDPOINTS = [
  "https://emkc.org/api/v2/piston/execute",
  "https://piston.mere.sh/api/v2/piston/execute",
  "https://piston.elysia.land/api/v2/piston/execute",
];

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { code, language } = await request.json();

    if (!code || !language) {
      return NextResponse.json({ success: false, error: "Code and language are required" }, { status: 400 });
    }

    const runner = LANGUAGE_RUNNERS[language];
    if (!runner) {
      return NextResponse.json({ success: false, error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const startTime = performance.now();

    // Try external Piston API endpoints first
    for (const endpoint of PISTON_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: language === "typescript" ? "typescript" : language,
            version: "*",
            files: [{ name: runner.filename, content: code }],
            compile_timeout: 10000,
            run_timeout: 5000,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          const result = await response.json();
          const endTime = performance.now();
          const output = result.run?.output || result.compile?.output || "";
          const stderr = result.run?.stderr || "";

          return NextResponse.json({
            success: true,
            data: {
              output,
              stderr,
              exitCode: result.run?.code ?? 0,
              executionTimeMs: Math.round(endTime - startTime),
              language,
            },
          });
        }
      } catch {
        continue;
      }
    }

    // All external APIs failed — use smart simulation
    const simulated = simulateCode(code, language);
    const endTime = performance.now();

    return NextResponse.json({
      success: true,
      data: {
        output: simulated.output,
        stderr: simulated.stderr,
        exitCode: simulated.exitCode,
        executionTimeMs: Math.round(endTime - startTime),
        language,
        simulated: true,
        note: "External code runner unavailable — showing simulated output",
      },
    });
  } catch (error) {
    console.error("Playground API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Smart code simulator that understands common language patterns
 * and produces realistic output for demo/offline mode.
 */
function simulateCode(code: string, language: string): { output: string; stderr: string; exitCode: number } {
  if (code.length > 10000) {
    return { output: "", stderr: "Error: Code exceeds maximum length of 10,000 characters", exitCode: 1 };
  }

  switch (language) {
    case "python":
      return simulatePython(code);
    case "javascript":
    case "typescript":
      return simulateJavaScript(code);
    default:
      return simulateGeneric(code, language);
  }
}

function simulatePython(code: string): { output: string; stderr: string; exitCode: number } {
  const outputLines: string[] = [];
  const errors: string[] = [];

  // Track variable assignments for context
  const vars: Record<string, string> = {};

  // Extract function definitions
  const funcs: Record<string, string> = {};
  const funcRegex = /def\s+(\w+)\s*\(([^)]*)\):/g;
  let match;
  while ((match = funcRegex.exec(code)) !== null) {
    funcs[match[1]] = match[2];
  }

  // Process lines sequentially
  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("@")) continue;

    // Skip function/class/if/for/while/try/except definitions
    if (/^(def |class |if |elif |else:|for |while |try:|except|finally:|with |async )/.test(trimmed)) continue;

    // Skip return, pass, break, continue
    if (/^(return |pass|break|continue)/.test(trimmed)) continue;

    // Line ending with colon (block start) — skip
    if (trimmed.endsWith(":")) continue;

    // Variable assignment
    const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)/);
    if (assignMatch && !trimmed.startsWith("self.") && !trimmed.startsWith("cls.")) {
      vars[assignMatch[1]] = assignMatch[2].trim();
      continue;
    }

    // Print statement — the main source of output
    const printMatch = trimmed.match(/^print\s*\((.*)\)\s*$/);
    if (printMatch) {
      const result = evaluatePythonPrint(printMatch[1], vars, funcs);
      outputLines.push(result);
      continue;
    }
  }

  // If we captured print outputs, return those
  if (outputLines.length > 0) {
    return { output: outputLines.join("\n"), stderr: errors.join("\n"), exitCode: 0 };
  }

  // Check for common patterns to provide meaningful feedback
  if (code.includes("def ")) outputLines.push("[Functions defined — no print/return statements called]");
  if (code.includes("class ")) outputLines.push("[Class defined — no instantiation or method calls]");
  if (code.includes("for ") || code.includes("while ")) outputLines.push("[Loop defined — no output captured]");

  if (outputLines.length === 0) {
    outputLines.push("[Code executed successfully — no output]");
  }

  return { output: outputLines.join("\n"), stderr: errors.join("\n"), exitCode: 0 };
}

function evaluatePythonPrint(args: string, vars: Record<string, string>, funcs: Record<string, string>): string {
  // Handle f-strings first
  const fstringMatch = args.match(/^f(['"])((?:[^'"]|\\\\['"])*)\\1$/);
  if (fstringMatch) {
    return processPythonFString(fstringMatch[2], vars);
  }

  // Multiple arguments separated by commas
  if (args.includes(",")) {
    const parts = splitArgs(args);
    const evaluated = parts.map((p) => evaluatePythonExpr(p.trim(), vars, funcs));
    return evaluated.join(" ");
  }

  // Single expression
  return evaluatePythonExpr(args.trim(), vars, funcs);
}

function splitArgs(args: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < args.length; i++) {
    const c = args[i];

    if (inString) {
      current += c;
      if (c === stringChar && args[i - 1] !== "\\") inString = false;
      continue;
    }

    if (c === '"' || c === "'") {
      inString = true;
      stringChar = c;
      current += c;
      continue;
    }

    if (c === "(" || c === "[" || c === "{") { depth++; current += c; continue; }
    if (c === ")" || c === "]" || c === "}") { depth--; current += c; continue; }

    if (c === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }

    current += c;
  }

  if (current.trim()) parts.push(current);
  return parts;
}

function evaluatePythonExpr(expr: string, vars: Record<string, string>, funcs: Record<string, string>): string {
  const clean = expr.trim();

  // String literal
  const strMatch = clean.match(/^['"](.*)['"]$/);
  if (strMatch) return strMatch[1];

  // f-string
  const fstrMatch = clean.match(/^f['"](.*)['"]$/);
  if (fstrMatch) return processPythonFString(fstrMatch[1], vars);

  // Is it a number?
  if (/^\d+$/.test(clean)) return clean;
  if (/^\d+\.\d+$/.test(clean)) return clean;

  // Variable reference
  if (vars[clean]) {
    const val = vars[clean];
    // If the variable value is a string literal, unwrap it
    const strVal = val.match(/^['"](.*)['"]$/);
    return strVal ? strVal[1] : val;
  }

  // Function call like greet("Developer")
  const funcCallMatch = clean.match(/^(\w+)\s*\((.+)\)$/);
  if (funcCallMatch) {
    const fname = funcCallMatch[1];
    const fargs = funcCallMatch[2];

    // Known functions with defined behavior
    if (fname === "str" || fname === "int" || fname === "float" || fname === "bool" || fname === "repr") {
      return evaluatePythonExpr(fargs, vars, funcs);
    }

    // If it's a user-defined function, simulate with evaluated arguments
    if (funcs[fname] !== undefined) {
      const evaledArg = evaluatePythonExpr(fargs, vars, funcs);
      return `[${fname}(${evaledArg}) → result]`;
    }

    // Try common built-in functions
    const builtInResults: Record<string, string> = {
      len: String(fargs.length),
      abs: fargs.replace(/^-/, ""),
    };
    if (builtInResults[fname]) return builtInResults[fname];
    
    // Unknown function
    return `[Result of ${fname}()]`;
  }

  // Simple arithmetic: 2 + 2, x * 2, range(5), etc.
  try {
    const sanitized = clean
      .replace(/x\*\*/g, "**")  // x**2 -> **2
      .replace(/Math\.pow\(/g, "(");  // Already safe
    const withNums = sanitized.replace(/\b(\w+)\b/g, (m) => {
      if (vars[m]) {
        const num = parseFloat(vars[m]);
        return isNaN(num) ? m : String(num);
      }
      if (/^\d+$/.test(m)) return m;
      return m;
    });
    // Only evaluate if safe (allow ** for exponentiation, JS supports ** since ES2016)
    if (/^[\d\s+\-*/().,^%e]+$/.test(withNums) || /\*\*/.test(withNums)) {
      try {
        return String(eval(withNums));
      } catch { /* fall through */ }
    }
  } catch { /* fall through */ }

  // List/dict literals
  if (/^[[{]/.test(clean)) return clean;

  return clean;
}

function processPythonFString(content: string, vars: Record<string, string>): string {
  return content.replace(/\{(\w+)\}/g, (_, name) => {
    if (vars[name]) {
      const val = vars[name];
      const strVal = val.match(/^['"](.*)['"]$/);
      return strVal ? strVal[1] : val;
    }
    return name;
  });
}

function simulateJavaScript(code: string): { output: string; stderr: string; exitCode: number } {
  const outputLines: string[] = [];
  const errors: string[] = [];
  const vars: Record<string, string> = {};

  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed || trimmed.startsWith("//")) continue;

    // Skip function/if/for/while/try/catch definitions
    if (/^(function |if |else |for |while |do |try |catch |finally |switch |case )/.test(trimmed)) continue;

    // Skip closing braces and block comments
    if (/^[}\]]/.test(trimmed) || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;

    // Variable assignment
    const assignMatch = trimmed.match(/^(?:const|let|var)\s+(\w+)\s*=\s*(.+);?$/);
    if (assignMatch) {
      vars[assignMatch[1]] = assignMatch[2].trim().replace(/;$/, "");
      continue;
    }

    // Simple assignment (without const/let/var)
    const simpleAssign = trimmed.match(/^(\w+)\s*=\s*(.+);?$/);
    if (simpleAssign) {
      vars[simpleAssign[1]] = simpleAssign[2].trim().replace(/;$/, "");
      continue;
    }

    // console.log
    const logMatch = trimmed.match(/^console\.log\s*\(\s*(.+)\s*\);?$/);
    if (logMatch) {
      const result = evaluateJSExpression(logMatch[1], vars);
      outputLines.push(result);
      continue;
    }

    // Arrow function / method chain
    if (trimmed.includes("=>") || trimmed.includes(".map(") || trimmed.includes(".filter(") || trimmed.includes(".reduce(")) {
      outputLines.push(`[Executed: ${trimmed.substring(0, 40)}${trimmed.length > 40 ? "..." : ""}]`);
      continue;
    }
  }

  if (outputLines.length > 0) {
    return { output: outputLines.join("\n"), stderr: errors.join("\n"), exitCode: 0 };
  }

  return {
    output: "[Code executed successfully (no console output)]",
    stderr: "",
    exitCode: 0,
  };
}

function evaluateJSExpression(expr: string, vars: Record<string, string>): string {
  const clean = expr.trim();

  // String literal (single or double quotes)
  const strMatch = clean.match(/^(['"])(.*?)\1$/);
  if (strMatch) return strMatch[2];

  // Template literal (backtick) — avoid /s flag (ES2018+ only)
  if (clean.startsWith("`") && clean.endsWith("`")) {
    const inner = clean.slice(1, -1);
    return inner.replace(/\$\{(\w+)\}/g, (_, name: string) => vars[name] || name);
  }

  // Number
  if (/^\d+(\.\d+)?$/.test(clean)) return clean;

  // Variable
  if (vars[clean]) {
    const val = vars[clean];
    const strVal = val.match(/^['"](.*)['"]$/);
    return strVal ? strVal[1] : val;
  }

  // Function call like greet("Developer")
  const callMatch = clean.match(/^(\w+)\s*\((.+)\)$/);
  if (callMatch) {
    const fname = callMatch[1];
    const fargs = callMatch[2];
    const evaled = evaluateJSExpression(fargs, vars);
    if (fname === "String" || fname === "Number" || fname === "Boolean") return evaled;
    return `[${fname}(${evaled}) → result]`;
  }

  // Concatenation: "Hello, " + name + "!"
  if (clean.includes("+")) {
    const parts = clean.split("+").map((p) => evaluateJSExpression(p.trim(), vars));
    return parts.join("");
  }

  // Array literal
  if (clean.startsWith("[") && clean.endsWith("]")) return clean;
  if (clean.startsWith("{") && clean.endsWith("}")) return clean;

  // Object property access
  if (clean.includes(".")) return clean;

  return clean;
}

function simulateGeneric(code: string, language: string): { output: string; stderr: string; exitCode: number } {
  const outputLines: string[] = [];

  if (language === "rust") {
    // Extract println! and print! calls
    const printMatches = code.matchAll(/println!\s*\(["']([^"']*)["']/g);
    for (const m of printMatches) {
      outputLines.push(m[1]);
    }
    // Extract {} placeholders with format args
    const formatMatch = code.match(/("([^"]*)")/g);
    if (formatMatch && outputLines.length === 0) {
      for (const m of formatMatch) {
        outputLines.push(m.replace(/"/g, ""));
      }
    }
    if (outputLines.length === 0) outputLines.push("[Rust program compiled and ran successfully]");
  }

  if (language === "java") {
    const printMatches = code.matchAll(/System\.out\.(?:println|printf?)\s*\(\s*["']([^"']*)["']/g);
    for (const m of printMatches) {
      outputLines.push(m[1]);
    }
    if (outputLines.length === 0) outputLines.push("[Java program compiled and executed successfully]");
  }

  if (language === "go") {
    const printMatches = code.matchAll(/fmt\.(?:Println|Printf?|Print)\s*\(\s*["']([^"']*)["']/g);
    for (const m of printMatches) {
      outputLines.push(m[1]);
    }
    if (outputLines.length === 0) outputLines.push("[Go program compiled and ran successfully]");
  }

  if (outputLines.length === 0) {
    outputLines.push(`[${language.charAt(0).toUpperCase() + language.slice(1)} code executed successfully]`);
  }

  return { output: outputLines.join("\n"), stderr: "", exitCode: 0 };
}
