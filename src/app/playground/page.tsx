"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Code2,
  Play,
  Loader2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Terminal,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ExecutionResult {
  output: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  simulated?: boolean;
}

function py(code: TemplateStringsArray, ...vals: any[]) {
  return String.raw({ raw: code }, ...vals);
}

const LANGUAGE_CONFIGS: Record<string, { label: string; icon: string; defaultCode: string }> = {
  python: {
    label: "Python",
    icon: "\ud83d\udc0d",
    defaultCode: py`# Python Playground
# Write your code below

def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))
print("2 + 2 =", 2 + 2)

# List comprehension
squares = [x**2 for x in range(5)]
print("Squares:", squares)`,
  },
  javascript: {
    label: "JavaScript",
    icon: "\ud83d\udc9b",
    defaultCode: py`// JavaScript Playground
// Write your code below

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));
console.log("2 + 2 =", 2 + 2);

// Array methods
const squares = [1,2,3,4,5].map(x => x ** 2);
console.log("Squares:", squares);`,
  },
  typescript: {
    label: "TypeScript",
    icon: "\ud83d\udd37",
    defaultCode: py`// TypeScript Playground
// Write your code below

function greet(name: string): string {
  return "Hello, " + name + "!";
}

console.log(greet("Developer"));

interface Square {
  value: number;
  squared: number;
}

const squares: Square[] = [1,2,3,4,5].map(x => ({
  value: x,
  squared: x ** 2
}));
console.log("Squares:", squares);`,
  },
  java: {
    label: "Java",
    icon: "\u2615",
    defaultCode: py`// Java Playground
// Write your code below

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Developer!");
        System.out.println("2 + 2 = " + (2 + 2));
    }
}`,
  },
  rust: {
    label: "Rust",
    icon: "\ud83e\udd80",
    defaultCode: py`// Rust Playground
// Write your code below

fn main() {
    println!("Hello, Developer!");
    println!("2 + 2 = {}", 2 + 2);

    let squares: Vec<i32> = (1..=5)
        .map(|x| x * x)
        .collect();
    println!("Squares: {:?}", squares);
}`,
  },
  go: {
    label: "Go",
    icon: "\ud83d\udd35",
    defaultCode: py`// Go Playground
// Write your code below

package main

import "fmt"

func main() {
    fmt.Println("Hello, Developer!")
    fmt.Println("2 + 2 =", 2 + 2)
}`,
  },
};

export default function PlaygroundPage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_CONFIGS.python.defaultCode);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const runCode = useCallback(async () => {
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setResult({ output: "", stderr: data.error || "Failed to execute", exitCode: 1, executionTimeMs: 0 });
      }
    } catch (err: any) {
      setResult({ output: "", stderr: err.message, exitCode: 1, executionTimeMs: 0 });
    }
    setRunning(false);
  }, [code, language]);

  function switchLanguage(lang: string) {
    setLanguage(lang);
    setCode(LANGUAGE_CONFIGS[lang].defaultCode);
    setResult(null);
    setLangOpen(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 stagger-1 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Code Playground</h1>
          <p className="text-[var(--muted)] mt-1">Write, run, and experiment with code in multiple languages</p>
        </div>
      </div>

      {/* Editor + Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-2 animate-fade-in-up">
        {/* Editor Panel */}
        <div className="space-y-3">
          {/* Language Selector */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--soft)] transition-colors text-sm font-medium"
              >
                <span>{LANGUAGE_CONFIGS[language].icon}</span>
                <span>{LANGUAGE_CONFIGS[language].label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg z-20 overflow-hidden animate-scale-in">
                    {Object.entries(LANGUAGE_CONFIGS).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => switchLanguage(key)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          language === key ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-[var(--foreground)] hover:bg-[var(--soft)]"
                        }`}
                      >
                        <span>{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCode(LANGUAGE_CONFIGS[language].defaultCode)}
                className="gap-1 text-xs"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            </div>
          </div>

          {/* Code Editor */}
          <Card className="overflow-hidden border-[var(--border)]">
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-[var(--muted)] ml-2">
                {LANGUAGE_CONFIGS[language].label}
              </span>
            </div>
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full min-h-[400px] p-4 font-mono text-sm leading-relaxed bg-[var(--background)] text-[var(--foreground)] resize-y focus:outline-none placeholder:text-[var(--muted)]/40"
                style={{ tabSize: 2 }}
                spellCheck={false}
                placeholder="Write your code here..."
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-[var(--muted)]">
                {code.split("\n").length} lines
              </div>
            </div>
          </Card>

          {/* Run Button */}
          <Button
            onClick={runCode}
            disabled={running}
            className="w-full gap-2"
            size="lg"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Code
              </>
            )}
          </Button>
        </div>

        {/* Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-medium text-[var(--foreground)]">Output</h3>
            {result && (
              <div className="flex items-center gap-2 ml-auto">
                {result.exitCode === 0 ? (
                  <Badge variant="success" className="text-[10px]">Success</Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">Error</Badge>
                )}
                <span className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                  <Clock className="w-3 h-3" />
                  {result.executionTimeMs}ms
                </span>
                {result.simulated && (
                  <Badge variant="secondary" className="text-[10px]">Demo Mode</Badge>
                )}
              </div>
            )}
          </div>

          <Card className="overflow-hidden border-[var(--border)] flex-1">
            <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)] flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-[var(--muted)] ml-2">Terminal</span>
            </div>
            <div className="min-h-[400px] max-h-[500px] p-4 font-mono text-sm bg-[#1a1a2e] text-[#e0e0e0] overflow-auto">
              {result ? (
                <div className="space-y-1">
                  {result.output && (
                    <pre className="whitespace-pre-wrap text-emerald-400">{result.output}</pre>
                  )}
                  {result.stderr && (
                    <pre className="whitespace-pre-wrap text-red-400">{result.stderr}</pre>
                  )}
                  {!result.output && !result.stderr && (
                    <span className="text-[var(--muted)]">[Empty output]</span>
                  )}
                  <div className="text-xs text-[var(--muted)] mt-3 pt-2 border-t border-white/10">
                    Process exited with code {result.exitCode} in {result.executionTimeMs}ms
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                  <Code2 className="w-8 h-8 text-[var(--muted)]/30" />
                  <p className="text-sm text-[var(--muted)]">
                    Write some code and click <span className="text-[var(--primary)] font-medium">Run</span> to see output
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Tips */}
      <Card className="glass stagger-3 animate-fade-in-up">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Supports: Python, JS, TS, Java, Rust, Go
            </span>
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> 5-second timeout for code execution
            </span>
            <span className="flex items-center gap-1.5">
              <Link href="/quiz" className="text-[var(--primary)] hover:underline">
                Test your skills in quizzes →
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
