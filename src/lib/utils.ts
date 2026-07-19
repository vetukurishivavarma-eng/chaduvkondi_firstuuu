import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateMasteryScore(
  correctCount: number,
  attempts: number,
  lastTestedAt: Date
): number {
  if (attempts === 0) return 0;

  const accuracy = correctCount / attempts;
  const now = new Date();
  const daysSinceLastTest = Math.floor(
    (now.getTime() - lastTestedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Recency decay: reduce score by 5% per day of inactivity, min 0
  const decayFactor = Math.max(0, 1 - daysSinceLastTest * 0.05);

  // Weight: more attempts = more reliable score
  const reliability = Math.min(1, attempts / 10);

  return Math.round(accuracy * decayFactor * reliability * 100);
}

export function calculateOverallMastery(masteryScores: { score: number }[]): number {
  if (masteryScores.length === 0) return 0;
  const total = masteryScores.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / masteryScores.length);
}

export function determineTier(overallScore: number): { name: string; minScore: number } {
  const tiers = [
    { name: "Spark", minScore: 0 },
    { name: "Apprentice", minScore: 20 },
    { name: "Specialist", minScore: 40 },
    { name: "Expert", minScore: 60 },
    { name: "Architect", minScore: 80 },
    { name: "Elite", minScore: 95 },
  ];

  let currentTier = tiers[0];
  for (const tier of tiers) {
    if (overallScore >= tier.minScore) {
      currentTier = tier;
    }
  }
  return currentTier;
}

export function getNextTier(overallScore: number): { name: string; minScore: number; progress: number } | null {
  const tiers = [
    { name: "Spark", minScore: 0 },
    { name: "Apprentice", minScore: 20 },
    { name: "Specialist", minScore: 40 },
    { name: "Expert", minScore: 60 },
    { name: "Architect", minScore: 80 },
    { name: "Elite", minScore: 95 },
  ];

  const currentTier = determineTier(overallScore);
  const currentIndex = tiers.findIndex(t => t.name === currentTier.name);
  
  if (currentIndex >= tiers.length - 1) return null;

  const nextTier = tiers[currentIndex + 1];
  const range = nextTier.minScore - currentTier.minScore;
  const progress = range > 0 ? ((overallScore - currentTier.minScore) / range) * 100 : 100;

  return { ...nextTier, progress: Math.min(100, Math.max(0, progress)) };
}

export function calculateSpacedRepetitionInterval(
  currentInterval: number,
  easeFactor: number,
  isCorrect: boolean
): { newInterval: number; newEaseFactor: number } {
  let newEaseFactor = easeFactor;

  if (isCorrect) {
    newEaseFactor = Math.max(1.3, easeFactor + 0.1);
  } else {
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
    return { newInterval: 1, newEaseFactor };
  }

  let newInterval: number;
  if (currentInterval === 0) {
    newInterval = 1;
  } else if (currentInterval === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(currentInterval * newEaseFactor);
  }

  return { newInterval, newEaseFactor };
}
