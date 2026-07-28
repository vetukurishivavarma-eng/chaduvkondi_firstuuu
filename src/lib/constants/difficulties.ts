export interface DifficultyConfig {
  label: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
}

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: { label: "Easy", slug: "easy", icon: "🌱", color: "#22C55E", order: 1 },
  medium: { label: "Medium", slug: "medium", icon: "⚡", color: "#F59E0B", order: 2 },
  hard: { label: "Hard", slug: "hard", icon: "🔥", color: "#EF4444", order: 3 },
  expert: { label: "Expert", slug: "expert", icon: "💎", color: "#A855F7", order: 4 },
};

export const DIFFICULTY_ORDER = ["easy", "medium", "hard", "expert"];

export function getDifficulty(slug: string): DifficultyConfig {
  return DIFFICULTIES[slug] || DIFFICULTIES.easy;
}
