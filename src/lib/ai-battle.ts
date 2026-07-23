/**
 * AI Battle System — simulates CEO opponents with personality-based behavior.
 * "Use basic LLMs behind them" — implemented as smart probabilistic simulation.
 */

export interface CeoPersona {
  name: string;
  title: string;
  emoji: string;
  color: string;
  catchphrase: string;
  /** Accuracy per difficulty level (0-1) */
  difficulty: Record<string, { accuracy: number; minDelay: number; maxDelay: number }>;
}

export const CEO_PERSONAS: CeoPersona[] = [
  {
    name: "Elon Musk",
    title: "CEO of Tesla & SpaceX",
    emoji: "🚀",
    color: "#6366f1",
    catchphrase: "First principles thinking!",
    difficulty: {
      easy: { accuracy: 0.30, minDelay: 5000, maxDelay: 9000 },
      medium: { accuracy: 0.55, minDelay: 3000, maxDelay: 6000 },
      hard: { accuracy: 0.80, minDelay: 800, maxDelay: 2500 },
    },
  },
  {
    name: "Satya Nadella",
    title: "CEO of Microsoft",
    emoji: "💻",
    color: "#00A4EF",
    catchphrase: "Empower every person on the planet.",
    difficulty: {
      easy: { accuracy: 0.35, minDelay: 4500, maxDelay: 8000 },
      medium: { accuracy: 0.60, minDelay: 2500, maxDelay: 5000 },
      hard: { accuracy: 0.85, minDelay: 1000, maxDelay: 3000 },
    },
  },
  {
    name: "Tim Cook",
    title: "CEO of Apple",
    emoji: "🍎",
    color: "#555555",
    catchphrase: "Think different. Think precise.",
    difficulty: {
      easy: { accuracy: 0.40, minDelay: 4000, maxDelay: 7500 },
      medium: { accuracy: 0.65, minDelay: 2000, maxDelay: 4500 },
      hard: { accuracy: 0.85, minDelay: 1200, maxDelay: 2800 },
    },
  },
  {
    name: "Sundar Pichai",
    title: "CEO of Google & Alphabet",
    emoji: "🔍",
    color: "#34A853",
    catchphrase: "Focus on the user and all else follows.",
    difficulty: {
      easy: { accuracy: 0.35, minDelay: 4800, maxDelay: 8500 },
      medium: { accuracy: 0.60, minDelay: 2800, maxDelay: 5500 },
      hard: { accuracy: 0.80, minDelay: 900, maxDelay: 3000 },
    },
  },
  {
    name: "Mark Zuckerberg",
    title: "CEO of Meta",
    emoji: "🌐",
    color: "#1877F2",
    catchphrase: "The metaverse is the next frontier.",
    difficulty: {
      easy: { accuracy: 0.30, minDelay: 5500, maxDelay: 10000 },
      medium: { accuracy: 0.55, minDelay: 3000, maxDelay: 6000 },
      hard: { accuracy: 0.75, minDelay: 1500, maxDelay: 3500 },
    },
  },
  {
    name: "Jensen Huang",
    title: "CEO of NVIDIA",
    emoji: "🖥️",
    color: "#76B900",
    catchphrase: "AI is the new industrial revolution.",
    difficulty: {
      easy: { accuracy: 0.40, minDelay: 3500, maxDelay: 7000 },
      medium: { accuracy: 0.70, minDelay: 2000, maxDelay: 4000 },
      hard: { accuracy: 0.90, minDelay: 700, maxDelay: 2000 },
    },
  },
  {
    name: "Sam Altman",
    title: "CEO of OpenAI",
    emoji: "🤖",
    color: "#10A37F",
    catchphrase: "AI will amplify human ingenuity.",
    difficulty: {
      easy: { accuracy: 0.35, minDelay: 4000, maxDelay: 7500 },
      medium: { accuracy: 0.65, minDelay: 2500, maxDelay: 5000 },
      hard: { accuracy: 0.88, minDelay: 600, maxDelay: 2000 },
    },
  },
  {
    name: "Jeff Bezos",
    title: "Founder of Amazon",
    emoji: "📦",
    color: "#FF9900",
    catchphrase: "It's always Day 1.",
    difficulty: {
      easy: { accuracy: 0.30, minDelay: 5000, maxDelay: 9000 },
      medium: { accuracy: 0.55, minDelay: 3000, maxDelay: 5500 },
      hard: { accuracy: 0.78, minDelay: 1500, maxDelay: 3000 },
    },
  },
  {
    name: "Brian Chesky",
    title: "CEO of Airbnb",
    emoji: "🏠",
    color: "#FF5A5F",
    catchphrase: "Design the experience, not just the product.",
    difficulty: {
      easy: { accuracy: 0.30, minDelay: 4500, maxDelay: 8000 },
      medium: { accuracy: 0.55, minDelay: 3000, maxDelay: 5500 },
      hard: { accuracy: 0.75, minDelay: 1500, maxDelay: 3000 },
    },
  },
  {
    name: "Reed Hastings",
    title: "Co-Founder of Netflix",
    emoji: "🎬",
    color: "#E50914",
    catchphrase: "The best stories come from taking risks.",
    difficulty: {
      easy: { accuracy: 0.35, minDelay: 4000, maxDelay: 7500 },
      medium: { accuracy: 0.60, minDelay: 2500, maxDelay: 5000 },
      hard: { accuracy: 0.80, minDelay: 1000, maxDelay: 2500 },
    },
  },
];

/** Get a random CEO persona */
export function getRandomCeo(): CeoPersona {
  return CEO_PERSONAS[Math.floor(Math.random() * CEO_PERSONAS.length)];
}

/** Get CEO by name */
export function getCeoByName(name: string): CeoPersona | undefined {
  return CEO_PERSONAS.find((c) => c.name === name);
}

/**
 * Generate an AI answer for a battle question.
 * Returns: { choiceId, isCorrect, delayMs }
 */
export function generateAiAnswer(
  ceoName: string,
  difficulty: string,
  choices: { id: string; isCorrect: boolean }[]
): { choiceId: string; isCorrect: boolean; delayMs: number } {
  const ceo = getCeoByName(ceoName) || CEO_PERSONAS[0];
  const config = ceo.difficulty[difficulty] || ceo.difficulty.medium;

  // Random delay within the config range
  const delayMs = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;

  // Determine if AI answers correctly based on accuracy
  const isCorrect = Math.random() < config.accuracy;
  const correctChoice = choices.find((c) => c.isCorrect);
  const wrongChoices = choices.filter((c) => !c.isCorrect);

  let choiceId: string;
  if (isCorrect && correctChoice) {
    choiceId = correctChoice.id;
  } else if (wrongChoices.length > 0) {
    // Pick a random wrong answer
    choiceId = wrongChoices[Math.floor(Math.random() * wrongChoices.length)].id;
  } else {
    choiceId = choices[0]?.id || "";
  }

  return { choiceId, isCorrect, delayMs };
}
