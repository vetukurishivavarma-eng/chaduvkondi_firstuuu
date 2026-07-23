"use client";

import { useState, useEffect, Suspense } from "react";
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

  const questionCount = searchParams.get("count")
    ? parseInt(searchParams.get("count")!)
    : 10;

  useEffect(() => {
    if (phase === "active" && !startTime) {
      setStartTime(Date.now());
    }
  }, [phase, startTime]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: quizType,
          count: questionCount,
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
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!selectedChoice || !quiz) return;

    const question = quiz.questions[currentQuestion];
    const timeOnQuestion = Math.floor((Date.now() - startTime) / 1000);

    setShowFeedback(true);

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

        // 🎉 No avatar needed — mood reaction says it all!
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

    try {
      await fetch(`/api/quiz/${quiz.quizId}`, {
        method: "PATCH",
      });
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

        <div className="stagger-4 animate-fade-in-up grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>
      </div>
    );
  }

  if (phase === "results" && quiz) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const score =
      quiz.questions.length > 0
        ? Math.round((correctCount / quiz.questions.length) * 100)
        : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Card className="animate-scale-in text-center glass overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
          <CardContent className="p-8 space-y-4">
            <div
              className={`p-3 w-fit mx-auto rounded-full animate-scale-in ${
                score >= 70
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : score >= 40
                  ? "bg-amber-100 dark:bg-amber-900/50"
                  : "bg-red-100 dark:bg-red-900/50"
              }`}
            >
              {score >= 70 ? (
                <Trophy className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              ) : score >= 40 ? (
                <Target className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Quiz Complete!</h2>
            <div className="text-5xl font-bold text-gradient">
              {score}%
            </div>
            <p className="text-[var(--muted)]">
              {correctCount} of {quiz.questions.length} correct
            </p>
            <Progress value={score} className="h-3 max-w-xs mx-auto" />
          </CardContent>
        </Card>

        <Card className="animate-slide-up glass">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.questions.map((q, i) => {
              const answer = answers.find((a) => a.questionId === q.id);
              return (                  <div
                    key={q.id}
                    className="p-4 rounded-xl glass space-y-3"
                  >
                  <div className="flex items-start gap-3">
                    {answer?.isCorrect ? (
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

                  {answer?.result.explanation && (
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

                  {!answer?.isCorrect &&
                    answer?.result.remediation &&
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
            Back to Quiz Modes
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
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
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className="text-[var(--muted)]">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Quiz Type Badge */}
      <Badge variant="secondary" className="capitalize w-fit animate-fade-in-down">
        {quiz.type.replace("_", " ")}
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
        {!showFeedback ? (
          <Button
            onClick={submitAnswer}
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
