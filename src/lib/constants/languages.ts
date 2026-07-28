export interface LanguageConfig {
  name: string;
  slug: string;
  extension: string;
  monacoId: string;
  pistonId: string;
  icon: string;
  color: string;
  order: number;
}

export const LANGUAGES: LanguageConfig[] = [
  {
    name: "Java",
    slug: "java",
    extension: ".java",
    monacoId: "java",
    pistonId: "java",
    icon: "☕",
    color: "#ED8B00",
    order: 1,
  },
  {
    name: "Python",
    slug: "python",
    extension: ".py",
    monacoId: "python",
    pistonId: "python",
    icon: "🐍",
    color: "#3776AB",
    order: 2,
  },
  {
    name: "C++",
    slug: "cpp",
    extension: ".cpp",
    monacoId: "cpp",
    pistonId: "cpp",
    icon: "⚡",
    color: "#00599C",
    order: 3,
  },
  {
    name: "C",
    slug: "c",
    extension: ".c",
    monacoId: "c",
    pistonId: "c",
    icon: "🔧",
    color: "#A8B9CC",
    order: 4,
  },
  {
    name: "JavaScript",
    slug: "javascript",
    extension: ".js",
    monacoId: "javascript",
    pistonId: "javascript",
    icon: "💛",
    color: "#F7DF1E",
    order: 5,
  },
  {
    name: "TypeScript",
    slug: "typescript",
    extension: ".ts",
    monacoId: "typescript",
    pistonId: "typescript",
    icon: "🔷",
    color: "#3178C6",
    order: 6,
  },
  {
    name: "Go",
    slug: "go",
    extension: ".go",
    monacoId: "go",
    pistonId: "go",
    icon: "🔵",
    color: "#00ADD8",
    order: 7,
  },
  {
    name: "Rust",
    slug: "rust",
    extension: ".rs",
    monacoId: "rust",
    pistonId: "rust",
    icon: "🦀",
    color: "#DEA584",
    order: 8,
  },
  {
    name: "Kotlin",
    slug: "kotlin",
    extension: ".kt",
    monacoId: "kotlin",
    pistonId: "kotlin",
    icon: "🅺",
    color: "#7F52FF",
    order: 9,
  },
  {
    name: "Swift",
    slug: "swift",
    extension: ".swift",
    monacoId: "swift",
    pistonId: "swift",
    icon: "🐦",
    color: "#F05138",
    order: 10,
  },
  {
    name: "PHP",
    slug: "php",
    extension: ".php",
    monacoId: "php",
    pistonId: "php",
    icon: "🐘",
    color: "#777BB4",
    order: 11,
  },
  {
    name: "C#",
    slug: "csharp",
    extension: ".cs",
    monacoId: "csharp",
    pistonId: "csharp",
    icon: "#️⃣",
    color: "#239120",
    order: 12,
  },
  {
    name: "Ruby",
    slug: "ruby",
    extension: ".rb",
    monacoId: "ruby",
    pistonId: "ruby",
    icon: "💎",
    color: "#CC342D",
    order: 13,
  },
];

export const LANGUAGE_MAP = new Map(LANGUAGES.map((l) => [l.slug, l]));
export const DEFAULT_LANGUAGE = "python";

export function getLanguage(slug: string): LanguageConfig {
  return LANGUAGE_MAP.get(slug) || LANGUAGE_MAP.get(DEFAULT_LANGUAGE)!;
}
