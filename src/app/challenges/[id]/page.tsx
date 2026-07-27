"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Code2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Play,
  RotateCcw,
  Trophy,
  Clock,
  Terminal,
  Sparkles,
  ChevronDown,
  AlertCircle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  templateCode: string;
  testCases: Array<{ input: string; expected: string; description?: string }>;
  conceptName: string;
  trackName: string;
  trackIcon: string;
  trackColor: string;
  totalSubmissions: number;
  uniqueSolvers: number;
  userSubmissions: Array<{ id: string; passed: boolean; score: number; executionTimeMs: number | null; createdAt: string }>;
  bestSubmission: { passed: boolean; score: number; executionTimeMs: number | null; createdAt: string } | null;
}

interface TestResult {
  name: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

const DIFFICULTY_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  easy: { color: "emerald", icon: "🌱", label: "Easy" },
  medium: { color: "amber", icon: "⚡", label: "Medium" },
  hard: { color: "red", icon: "🔥", label: "Hard" },
};

export default function ChallengeSolvePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState<string>("");
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    params.then((p) => setChallengeId(p.id));
  }, [params]);

  useEffect(() => {
    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  async function fetchChallenge() {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`);
      const data = await res.json();
      if (data.success) {
        setChallenge(data.data);
        setCode(data.data.templateCode);
      } else {
        setError(data.error || "Failed to load challenge");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!challenge || submitting) return;
    setSubmitting(true);
    setResults(null);
    setPassed(null);
    setScore(null);
    setError("");

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, code }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.data.results);
        setPassed(data.data.passed);
        setScore(data.data.score);
        setExecutionTime(data.data.executionTimeMs);
      } else {
        setError(data.error || "Submission failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function resetCode() {
    if (challenge) {
      setCode(challenge.templateCode);
      setResults(null);
      setPassed(null);
      setScore(null);
      setError("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading challenge...</span>
        </div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)]">{error}</p>
        <Button onClick={() => router.push("/challenges")} variant="outline">
          Back to Challenges
        </Button>
      </div>
    );
  }

  if (!challenge) return null;

  const diff = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.easy;
  const testsPassed = results?.filter((r) => r.passed).length || 0;
  const totalTests = results?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center gap-2 stagger-1 animate-fade-in-up">
        <Link
          href="/challenges"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Challenges
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 stagger-1 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{challenge.trackIcon}</span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gradient">{challenge.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[var(--muted)]">{challenge.trackName}</span>
                <span className="text-[10px] text-[var(--muted)]">•</span>
                <span className="text-xs text-[var(--muted)]">{challenge.conceptName}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-[10px] ${
              challenge.difficulty === "easy"
                ? "bg-emerald-500/10 text-emerald-600"
                : challenge.difficulty === "medium"
                ? "bg-amber-500/10 text-amber-600"
                : "bg-red-500/10 text-red-600"
            }`}
          >
            {diff.icon} {diff.label}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {challenge.language}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {challenge.uniqueSolvers} solved
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-2 animate-fade-in-up">
        {/* Left Panel: Description */}
        <div className="space-y-4">
          {/* Problem Description */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                Problem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
            </CardContent>
          </Card>

          {/* Test Cases */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <Terminal className="w-4 h-4 text-[var(--primary)]" />
                Test Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {challenge.testCases.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No test cases — code will be run for syntax check.</p>
                ) : (
                  challenge.testCases.map((tc, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-[var(--soft)]/50 border border-[var(--border)]"
                    >
                      <p className="text-xs font-medium text-[var(--foreground)] mb-1">
                        {tc.description || `Test Case ${i + 1}`}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-[var(--muted)]">Input: </span>
                          <code className="font-mono text-[var(--foreground)]">{tc.input}</code>
                        </div>
                        <div>
                          <span className="text-[var(--muted)]">Expected: </span>
                          <code className="font-mono text-emerald-600 dark:text-emerald-400">{tc.expected}</code>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">{challenge.totalSubmissions}</p>
                  <p className="text-[10px] text-[var(--muted)]">Total Submissions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-500">{challenge.uniqueSolvers}</p>
                  <p className="text-[10px] text-[var(--muted)]">Unique Solvers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-500">{challenge.bestSubmission?.score || 0}%</p>
                  <p className="text-[10px] text-[var(--muted)]">Best Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previous submissions */}
          {challenge.userSubmissions.length > 0 && (
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Your Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {challenge.userSubmissions.slice(0, 3).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--soft)]/50">
                      <div className="flex items-center gap-2">
                        {sub.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-xs text-[var(--foreground)]">
                          {sub.passed ? "Passed" : "Failed"} — {sub.score}%
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)]">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hints */}
          {showHints && challenge.testCases.length > 0 && (
            <Card className="glass border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">💡 Hints</p>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Make sure your function is named exactly as shown in the template. 
                      Test your code with the sample inputs to verify your output matches the expected values.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Code Editor */}
        <div className="space-y-4">
          {/* Code Editor */}
          <Card className="overflow-hidden border-[var(--border)]">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-[var(--muted)] ml-2">
                  {challenge.language}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetCode}
                  className="p-1.5 rounded-md hover:bg-[var(--soft)] transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
                  title="Reset to template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="p-1.5 rounded-md hover:bg-[var(--soft)] transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
                  title={showSolution ? "Hide solution" : "Show solution"}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="p-1.5 rounded-md hover:bg-[var(--soft)] transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
                  title="Toggle hints"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full min-h-[350px] p-4 font-mono text-sm leading-relaxed bg-[#1a1a2e] text-[#e0e0e0] resize-y focus:outline-none"
              style={{ tabSize: 2 }}
              spellCheck={false}
              placeholder="Write your solution here..."
            />
          </Card>

          {/* Solution code (hidden by default) */}
          {showSolution && challenge.bestSubmission && (
            <div className="animate-fade-in-down">
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Reference Solution ({challenge.bestSubmission.score}%)
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-[var(--muted)] whitespace-pre-wrap">
                    {challenge.testCases.length > 0 ? "// Solution available after solving!" : "// No test cases — any valid code works."}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="w-full gap-2 h-11"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Submit Solution
              </>
            )}
          </Button>

          {/* Results */}
          {(results || error) && (
            <div className="animate-scale-in space-y-3">
              {/* Overall result */}
              {passed !== null && (
                <Card className={`overflow-hidden ${
                  passed
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {passed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className={`text-sm font-semibold ${
                            passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {passed ? "All Tests Passed! 🎉" : "Some Tests Failed"}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            Score: {score}% • {testsPassed}/{totalTests} tests passed
                            {executionTime ? ` • ${executionTime}ms` : ""}
                          </p>
                        </div>
                      </div>
                      {passed && (
                        <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
                      )}
                    </div>
                    <Progress
                      value={score || 0}
                      className={`h-1.5 mt-3 ${
                        passed ? "bg-emerald-500/20" : "bg-red-500/20"
                      }`}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Individual test results */}
              {results && results.length > 0 && (
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                      <Terminal className="w-4 h-4 text-[var(--primary)]" />
                      Test Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {results.map((r, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          r.passed
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : "border-red-500/20 bg-red-500/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {r.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <span className={`text-xs font-medium ${
                              r.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            }`}>
                              {r.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono space-y-0.5">
                          <div><span className="text-[var(--muted)]">Input:</span> {r.input}</div>
                          <div><span className="text-[var(--muted)]">Expected:</span> {r.expected}</div>
                          <div><span className="text-[var(--muted)]">Actual:</span> {r.actual}</div>
                          {r.error && (
                            <div className="text-red-500">Error: {r.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Error message */}
              {error && (
                <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
