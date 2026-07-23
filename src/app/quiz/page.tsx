"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import {
  Brain,
  Zap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  Trophy,
  Target,
  ExternalLink,
  Timer,
  TimerReset,
  Gauge,
  Flame,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  difficultyWeight: number;
  explanation: string;
  concept: {
    id: string;
    name: string;
    subDomain: string;
  };
  choices: Array<{
    id: string;
    text: string;
  }>;
}

interface QuizData {
  quizId: string;
  type: string;
  questions: Question[];
  totalQuestions: number;
}

interface AnswerResult {
  isCorrect: boolean;
  explanation: string;
  correctChoice: string;
  conceptName: string;
  subDomain: string;
  currentMastery: number;
  remediation: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    type: string;
  }> | null;
  moodReaction?: {
    message: string;
    emoji: string;
  };
}

type QuizPhase = "select" | "active" | "results";

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "practice";

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("select");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<Array<{ questionId: string; isCorrect: boolean; result: AnswerResult }>>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; icon: string; color: string; score: number }>>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState<number>(0);
  const [newPersonalBest, setNewPersonalBest] = useState<{
    qpm: number;
    previousBest: number;
    improvementPercent: number;
  } | null>(null);

  const SPEED_TEST_DURATION = 30;
  const [timeLeft, setTimeLeft] = useState(SPEED_TEST_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleTimeUpRef = useRef<() => Promise<void>>(async () => {});

  const questionCount = searchParams.get("count")
    ? parseInt(searchParams.get("count")!)
    : 10;

  useEffect(() => {
    if (phase === "active" && !startTime) {
      setStartTime(Date.now());
    }
  }, [phase, startTime]);

  // Speed test countdown timer: pure decrement, no side effects in updater
  useEffect(() => {
    if (phase === "active" && quiz?.type === "speed_test") {
      setTimeLeft(SPEED_TEST_DURATION);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, quiz?.type]);

  // Watch for timer expiry: separates side effects from state updater, avoids stale closures
  useEffect(() => {
    if (timeLeft === 0 && phase === "active" && quiz?.type === "speed_test") {
      handleTimeUpRef.current();
    }
  }, [timeLeft]);

  // Keep the ref updated with latest selectedChoice/quiz
  async function handleSpeedTestTimeUp() {
    // Submit current answer without auto-advancing, then complete
    if (selectedChoice && quiz) {
      await submitAnswer(true);
    }
    await completeQuiz();
  }

  handleTimeUpRef.current = handleSpeedTestTimeUp;

  // Fetch available tracks
  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.allTracks) {
          setTracks(res.data.allTracks.map((t: any) => ({ ...t, score: 0 })));
          if (res.data.tracks) {
            setTracks(res.data.tracks);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Auto-start based on URL mode
  useEffect(() => {
    if (mode && ["diagnostic", "spaced_repetition"].includes(mode)) {
      startQuiz(mode);
    }
  }, []);

  async function startQuiz(quizType: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },          body: JSON.stringify({
          type: quizType,
          count: quizType === "speed_test" ? 20 : questionCount,
          trackId: selectedTrackId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to start quiz");
        return;
      }

      setQuiz(data.data);
      setPhase("active");
      setCurrentQuestion(0);
      setAnswers([]);
      setSelectedChoice(null);
      setShowFeedback(false);
      setStartTime(Date.now());
      if (quizType === "speed_test") {
        setTimeLeft(SPEED_TEST_DURATION);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(skipAdvance = false) {
    if (!selectedChoice || !quiz) return;

    const question = quiz.questions[currentQuestion];
    const timeOnQuestion = Math.floor((Date.now() - startTime) / 1000);
    const isSpeedTest = quiz.type === "speed_test";

    if (!isSpeedTest) setShowFeedback(true);

    try {
      const res = await fetch(`/api/quiz/${quiz.quizId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          choiceId: selectedChoice,
          timeSpent: timeOnQuestion,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAnswers((prev) => [
          ...prev,
          {
            questionId: question.id,
            isCorrect: data.data.isCorrect,
            result: data.data,
          },
        ]);

        // Speed test: auto-advance to next question immediately (unless skipAdvance)
        if (isSpeedTest && !skipAdvance) {
          if (currentQuestion < quiz.questions.length - 1) {
            setTimeout(() => {
              setCurrentQuestion((prev) => prev + 1);
              setSelectedChoice(null);
              setShowFeedback(false);
              setStartTime(Date.now());
            }, 150);
          } else {
            setTimeout(() => completeQuiz(), 300);
          }
        }
      }
    } catch {
      setAnswers((prev) => [
        ...prev,
        {
          questionId: question.id,
          isCorrect: false,
          result: {
            isCorrect: false,
            explanation: "",
            correctChoice: "",
            conceptName: "",
            subDomain: "",
            currentMastery: 0,
            remediation: null,
          },
        },
      ]);
      // Even on error, advance for speed test (unless skipAdvance)
      if (isSpeedTest && !skipAdvance && currentQuestion < quiz.questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestion((prev) => prev + 1);
          setSelectedChoice(null);
          setStartTime(Date.now());
        }, 150);
      }
    }
  }

  function nextQuestion() {
    if (!quiz) return;

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedChoice(null);
      setShowFeedback(false);
      setStartTime(Date.now());
    } else {
      completeQuiz();
    }
  }

  async function completeQuiz() {
    if (!quiz) return;
    setCompleting(true);

    // For speed tests, fetch previous best BEFORE completing (before the DB is updated)
    const isSpeedTest = quiz.type === "speed_test";
    let previousBestQpm: number | null = null;
    if (isSpeedTest) {
      try {
        const pbRes = await fetch("/api/leaderboard/speed-test");
        const pbData = await pbRes.json();
        if (pbData.success) {
          const myEntry = pbData.data.leaderboard.find(
            (e: any) => e.isCurrentUser
          );
          if (myEntry) {
            previousBestQpm = myEntry.bestQpm;
          }
        }
      } catch {
        // Silently fail — personal best is not critical
      }
    }

    try {
      await fetch(`/api/quiz/${quiz.quizId}`, {
        method: "PATCH",
      });

      // Check if we set a new personal best
      if (isSpeedTest) {
        const totalAnswered = answers.length;
        if (totalAnswered > 0) {
          const currentQpm = totalAnswered * 2;
          // It's a new personal best: first ever, or current > previous best
          if (previousBestQpm === null || currentQpm > previousBestQpm) {
            const improvementPercent =
              previousBestQpm && previousBestQpm > 0
                ? Math.round(
                    ((currentQpm - previousBestQpm) / previousBestQpm) * 100
                  )
                : 100;
            setNewPersonalBest({
              qpm: currentQpm,
              previousBest: previousBestQpm ?? 0,
              improvementPercent,
            });
          }
        }
      }

      setPhase("results");
    } catch {
      setPhase("results");
    } finally {
      setCompleting(false);
    }
  }

  if (phase === "select") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="stagger-1 animate-fade-in-up">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Quiz</h1>
          <p className="text-[var(--muted)] mt-1">
            Choose your track and quiz mode to get started
          </p>
        </div>

        {error && (
          <div className="stagger-2 animate-fade-in-up p-3 text-sm bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-xl">
            {error}
          </div>
        )}

        {/* Track selector */}
        {tracks.length > 0 && (
          <div className="stagger-3 animate-fade-in-up space-y-2">
            <p className="text-sm font-medium text-[var(--muted)]">Select Track</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {tracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id === selectedTrackId ? null : track.id)}
                  className={`card-bounce flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                    track.id === selectedTrackId
                      ? "glass border-[var(--primary)] shadow-md"
                      : "glass border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  <span className="text-2xl">{track.icon || "📚"}</span>
                  <span className="text-xs font-medium text-center leading-tight text-[var(--foreground)]">{track.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{track.score || 0}%</span>
                </button>
              ))}
            </div>
            {selectedTrackId && (
              <p className="text-xs text-[var(--primary)]">
                Questions will focus on the selected track
              </p>
            )}
          </div>
        )}

        <div className="stagger-4 animate-fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="card-bounce glass cursor-pointer"
            onClick={() => !loading && startQuiz("practice")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="p-2.5 w-fit rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[var(--foreground)]">Practice Quiz</h3>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Adaptive questions targeting your weakest concepts
                </p>
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Practice"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="card-bounce glass cursor-pointer"
            onClick={() => !loading && startQuiz("diagnostic")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="p-2.5 w-fit rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[var(--foreground)]">Diagnostic</h3>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Full assessment across all concepts to gauge your level
                </p>
              </div>
              <Button className="w-full" variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Diagnostic"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="card-bounce glass cursor-pointer"
            onClick={() => !loading && startQuiz("spaced_repetition")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="p-2.5 w-fit rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[var(--foreground)]">Spaced Review</h3>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Review concepts due for spaced repetition reinforcement
                </p>
              </div>
              <Button className="w-full" variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Review"}
              </Button>
            </CardContent>
          </Card>

          {/* Speed Test Card */}
          <Card
            className="card-bounce glass cursor-pointer group"
            onClick={() => !loading && startQuiz("speed_test")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="p-2.5 w-fit rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg group-hover:shadow-red-500/25 transition-shadow">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[var(--foreground)]">Speed Test ⚡</h3>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Answer as many questions as you can in 30 seconds! Rapid-fire challenge.
                </p>
              </div>
              <Button className="w-full" variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go Fast!"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === "results" && quiz) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalAnswered = answers.length;
    const score =
      totalAnswered > 0
        ? Math.round((correctCount / totalAnswered) * 100)
        : 0;
    const isSpeedTest = quiz.type === "speed_test";
    const questionsPerMin = isSpeedTest && totalAnswered > 0
      ? ((totalAnswered / SPEED_TEST_DURATION) * 60).toFixed(1)
      : null;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Card className={`animate-scale-in text-center glass overflow-hidden ${isSpeedTest ? "border-red-500/20" : ""}`}>
          <div className={`h-1.5 ${
            isSpeedTest
              ? "bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"
              : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
          }`} />
          <CardContent className="p-8 space-y-4">
            <div
              className={`p-3 w-fit mx-auto rounded-full animate-scale-in ${
                isSpeedTest
                  ? "bg-red-100 dark:bg-red-900/50"
                  : score >= 70
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : score >= 40
                  ? "bg-amber-100 dark:bg-amber-900/50"
                  : "bg-red-100 dark:bg-red-900/50"
              }`}
            >
              {isSpeedTest ? (
                <Gauge className="w-8 h-8 text-red-600 dark:text-red-400" />
              ) : score >= 70 ? (
                <Trophy className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              ) : score >= 40 ? (
                <Target className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {isSpeedTest ? "Speed Test Complete! ⚡" : "Quiz Complete!"}
            </h2>

            {/* Speed Test Metrics */}
            {isSpeedTest ? (
              <>
                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
                    <p className="text-2xl font-bold text-gradient">{totalAnswered}</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Answered</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <p className="text-2xl font-bold text-emerald-500">{correctCount}</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Correct</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <p className="text-2xl font-bold text-amber-500">{questionsPerMin}</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Q/min</p>
                  </div>
                </div>

                {/* Personal Best Celebration */}
                {newPersonalBest && (
                  <div className="animate-scale-in p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-400/40 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg text-[var(--foreground)]">
                          🎉 New Personal Best!
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {newPersonalBest.qpm} Q/min — that's your fastest speed test ever!
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 justify-center">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-[var(--muted)]">Previous:</span>
                        <span className="font-semibold text-[var(--foreground)]">{newPersonalBest.previousBest} Q/min</span>
                      </div>
                      <span className="text-[var(--muted)]">→</span>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-[var(--muted)]">Now:</span>
                        <span className="font-semibold text-amber-500">{newPersonalBest.qpm} Q/min</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] ml-2 bg-amber-500/20 text-amber-600 border-amber-400/40">
                        +{newPersonalBest.improvementPercent}%
                      </Badge>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl font-bold text-gradient">{score}%</div>
                <p className="text-[var(--muted)]">{correctCount} of {totalAnswered} correct</p>
              </>
            )}
            <Progress value={score} className="h-3 max-w-xs mx-auto" />
          </CardContent>
        </Card>

        <Card className="animate-slide-up glass">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">
              {isSpeedTest ? "Answer Summary" : "Question Review"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.questions.slice(0, Math.max(totalAnswered, 1)).map((q, i) => {
              const answer = answers.find((a) => a.questionId === q.id);
              if (!answer) {
                return (
                  <div key={q.id} className="p-4 rounded-xl glass space-y-3 opacity-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[var(--muted)] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{q.text}</p>
                        <p className="text-xs text-[var(--muted)] mt-1">Not answered</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={q.id} className="p-4 rounded-xl glass space-y-3">
                  <div className="flex items-start gap-3">
                    {answer.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{q.text}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {q.concept.name} • {q.concept.subDomain}
                      </p>
                    </div>
                  </div>

                  {answer.result.explanation && (
                    <div className="ml-8 p-3 glass rounded-lg text-sm">
                      <p className="font-medium text-xs uppercase tracking-wider text-[var(--muted)] mb-1">
                        Explanation
                      </p>
                      <p className="text-[var(--foreground)]">{answer.result.explanation}</p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Correct answer:{" "}
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {answer.result.correctChoice}
                        </span>
                      </p>
                    </div>
                  )}

                  {!answer.isCorrect &&
                    answer.result.remediation &&
                    answer.result.remediation.length > 0 && (
                      <div className="ml-8 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Remediation Resources
                        </p>
                        {answer.result.remediation.map((r) => (
                        <a
                          key={r.id}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card-lift flex items-center gap-2 p-2 glass rounded-lg text-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="flex-1 text-[var(--foreground)]">{r.title}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {r.type}
                          </Badge>
                        </a>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => setPhase("select")}
            variant="outline"
            className="flex-1"
          >
            {isSpeedTest ? "🔄 Try Again" : "Back to Quiz Modes"}
          </Button>
          <Button onClick={() => router.push("/dashboard")} className="flex-1">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const answer = answers.find((a) => a.questionId === question.id);
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const isSpeedTest = quiz.type === "speed_test";
  const timerPercent = (timeLeft / SPEED_TEST_DURATION) * 100;
  const timerUrgent = timeLeft <= 10;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Speed Test Timer */}
      {isSpeedTest && (
        <div className="stagger-1 animate-fade-in-down">
          <div className={`flex items-center justify-between mb-1.5 ${
            timerUrgent ? "animate-pulse" : ""
          }`}>
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${timerUrgent ? "text-red-500" : "text-orange-500"}`} />
              <span className={`text-sm font-bold ${
                timerUrgent ? "text-red-500" : "text-orange-500"
              }`}>
                Speed Test
              </span>
            </div>
            <div className={`flex items-center gap-1.5 text-lg font-mono font-bold ${
              timerUrgent
                ? "text-red-500 animate-pulse"
                : "text-[var(--foreground)]"
            }`}>
              <Timer className={`w-4 h-4 ${timerUrgent ? "" : "text-orange-500"}`} />
              <span>{timeLeft}s</span>
            </div>
          </div>
          <div className="relative h-3 rounded-full bg-[var(--soft)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                timerUrgent
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-orange-400"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPhase("select")}
          className="p-2 rounded-lg hover:bg-[var(--soft)] transition-colors text-[var(--foreground)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-[var(--foreground)]">
              {isSpeedTest
                ? `Q${currentQuestion + 1}`
                : `Question ${currentQuestion + 1} of ${quiz.questions.length}`
              }
            </span>
            {!isSpeedTest && <span className="text-[var(--muted)]">{Math.round(progress)}%</span>}
            {isSpeedTest && (
              <span className="text-xs text-[var(--muted)]">
                {answers.length} answered • {answers.filter((a) => a.isCorrect).length} correct
              </span>
            )}
          </div>
          {!isSpeedTest && <Progress value={progress} className="h-2" />}
        </div>
      </div>

      {/* Quiz Type Badge */}
      <Badge variant={isSpeedTest ? "destructive" : "secondary"} className="capitalize w-fit animate-fade-in-down">
        {isSpeedTest ? "⚡ Speed Test" : quiz.type.replace("_", " ")}
      </Badge>

      {/* Question Card */}
      <Card className="glass animate-scale-in">
        <CardContent className="p-6 space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs bg-[var(--primary)]">
                {question.concept.name}
              </Badge>
              <span className="text-xs text-[var(--muted)]">
                {question.concept.subDomain}
              </span>
            </div>
            <p className="text-lg font-medium leading-relaxed text-[var(--foreground)]">{question.text}</p>
          </div>

          {/* Answer Choices */}
          <RadioGroup
            value={selectedChoice || ""}
            onValueChange={(value) => !showFeedback && setSelectedChoice(value)}
            className="space-y-3"
          >
            {question.choices.map((choice) => {
              const isSelected = selectedChoice === choice.id;
              const showCorrect =
                showFeedback &&
                answer?.result.correctChoice === choice.text;
              const showWrong = showFeedback && isSelected && !answer?.isCorrect;

              return (
                <div
                  key={choice.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    showCorrect
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : showWrong
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                      : isSelected
                      ? "glass border-[var(--primary)]"
                      : "glass border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]"
                  }`}
                  onClick={() => !showFeedback && setSelectedChoice(choice.id)}
                >
                  <RadioGroupItem
                    value={choice.id}
                    id={choice.id}
                    disabled={showFeedback}
                  />
                  <label
                    htmlFor={choice.id}
                    className="flex-1 cursor-pointer text-sm font-medium text-[var(--foreground)]"
                  >
                    {choice.text}
                  </label>
                  {showCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-scale-in" />
                  )}
                  {showWrong && <XCircle className="w-5 h-5 text-red-500 animate-scale-in" />}
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Feedback & Explanation */}
      {showFeedback && answer && (
        <Card
          className={`glass animate-slide-up`}
        >
          <div className={`h-1 ${
            answer.isCorrect
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
              : "bg-gradient-to-r from-amber-400 to-amber-600"
          }`} />
          <CardContent className="p-5 space-y-4">
              {/* Mood-based meme reaction */}
              {answer.result.moodReaction && (
                <div className={`animate-scale-in p-3 rounded-lg border-2 ${
                  answer.isCorrect
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg animate-wiggle">{answer.result.moodReaction.emoji}</span>
                    <p className="text-sm font-medium text-[var(--foreground)]">{answer.result.moodReaction.message}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
              {answer.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Correct!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    Incorrect
                  </span>
                </>
              )}
            </div>

            <div className="p-3 glass rounded-lg">
              <p className="text-sm font-medium mb-1 text-[var(--foreground)]">Explanation:</p>
              <p className="text-sm text-[var(--muted)]">
                {answer.result.explanation}
              </p>
            </div>

            {/* Mastery Update */}
            <div className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>Concept mastery: </span>
              <span className="font-semibold">
                {Math.round(answer.result.currentMastery)}%
              </span>
            </div>

            {/* Remediation Resources for Wrong Answers */}
            {!answer.isCorrect &&
              answer.result.remediation &&
              answer.result.remediation.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    Recommended Resources
                  </p>
                  {answer.result.remediation.map((r) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-lift flex items-center gap-2 p-3 glass rounded-lg text-sm"
                    >
                      <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-[var(--foreground)]">{r.title}</p>
                        <p className="text-xs text-[var(--muted)] truncate">
                          {r.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {r.type}
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 animate-fade-in-up">
        {isSpeedTest ? (
          <>
            <Button
              onClick={() => submitAnswer()}
              disabled={!selectedChoice || completing}
              className="flex-1 h-12 text-base gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {selectedChoice ? "Go! →" : "Select an answer..."}
                </>
              )}
            </Button>
            <span className="text-[10px] text-[var(--muted)] self-center">
              Auto-advances after answer
            </span>
          </>
        ) : !showFeedback ? (
          <Button
            onClick={() => submitAnswer()}
            disabled={!selectedChoice}
            className="flex-1 h-12 text-base gap-2"
          >
            {completing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit Answer"
            )}
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            disabled={completing}
            className="flex-1 h-12 text-base gap-2"
          >
            {isLastQuestion ? (
              completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "View Results"
              )
            ) : (
              <>
                Next Question
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading quiz...</span>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
