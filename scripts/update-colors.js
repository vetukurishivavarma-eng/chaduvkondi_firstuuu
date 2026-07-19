const fs = require("fs");
const path = require("path");

const replacements = [
  // Main brand gradient
  ["from-violet-600 to-indigo-600", "from-emerald-500 to-teal-600"],
  ["from-violet-500 to-indigo-600", "from-emerald-500 to-teal-600"],
  ["from-purple-500 to-violet-600", "from-emerald-500 to-teal-600"],
  // Light gradients
  ["from-violet-50 to-indigo-50", "from-emerald-50 to-teal-50"],
  ["from-violet-100/20 to-indigo-100/20", "from-emerald-100/20 to-teal-100/20"],
  // Dark gradients
  ["dark:from-violet-950/50 dark:to-indigo-950/50", "dark:from-emerald-950/50 dark:to-teal-950/50"],
  ["dark:from-violet-950/30 dark:to-indigo-950/30", "dark:from-emerald-950/30 dark:to-teal-950/30"],
  ["dark:from-violet-900/5 dark:to-indigo-900/5", "dark:from-emerald-900/5 dark:to-teal-900/5"],
  // Text colors
  ["text-violet-600 dark:text-violet-400", "text-emerald-600 dark:text-emerald-400"],
  ["text-violet-700 dark:text-violet-300", "text-emerald-700 dark:text-emerald-300"],
  ["text-violet-500", "text-emerald-500"],
  // Background colors
  ["bg-violet-100 dark:bg-violet-900/30", "bg-emerald-100 dark:bg-emerald-900/30"],
  ["bg-violet-200/30 dark:bg-violet-800/10", "bg-emerald-200/30 dark:bg-emerald-800/10"],
  ["bg-violet-500/5", "bg-emerald-500/5"],
  ["bg-violet-50 dark:bg-violet-950/20", "bg-emerald-50 dark:bg-emerald-950/20"],
  ["dark:bg-violet-950/30", "dark:bg-emerald-950/30"],
  ["bg-violet-50 dark:bg-violet-900/20", "bg-emerald-50 dark:bg-emerald-900/20"],
  // Border colors
  ["border-violet-200 dark:border-violet-800", "border-emerald-200 dark:border-emerald-800"],
  ["hover:border-violet-200 dark:hover:border-violet-800", "hover:border-emerald-200 dark:hover:border-emerald-800"],
  ["hover:border-violet-300 dark:hover:border-violet-700", "hover:border-emerald-300 dark:hover:border-emerald-700"],
  ["border-violet-500 bg-violet-50 dark:bg-violet-950/20", "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"],
  // Shadow
  ["shadow-violet-500/25", "shadow-emerald-500/25"],
  ["shadow-violet-500/40", "shadow-emerald-500/40"],
  // Focus states
  ["focus:bg-violet-50 dark:focus:bg-violet-900/20 focus:text-violet-700 dark:focus:text-violet-300", "focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:text-emerald-700 dark:focus:text-emerald-300"],
  ["focus-visible:ring-violet-500 focus-visible:border-violet-500", "focus-visible:ring-emerald-500 focus-visible:border-emerald-500"],
  ["focus:ring-violet-500 focus:border-violet-500", "focus:ring-emerald-500 focus:border-emerald-500"],
  ["focus-visible:ring-violet-500", "focus-visible:ring-emerald-500"],
  // Ring
  ["ring-violet-200 dark:ring-violet-800", "ring-emerald-200 dark:ring-emerald-800"],
  ["ring-2 ring-violet-400", "ring-2 ring-emerald-400"],
  ["ring-violet-500", "ring-emerald-500"],
  // Hover backgrounds
  ["hover:bg-violet-50 dark:hover:bg-violet-950/20", "hover:bg-emerald-50 dark:hover:bg-emerald-950/20"],
  // Badge default
  ["bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300", "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"],
  // Button hover
  ["hover:from-violet-500 hover:to-indigo-500", "hover:from-emerald-400 hover:to-teal-400"],
  // Progress bar
  ["from-violet-500 to-indigo-500", "from-emerald-500 to-teal-500"],
  // Avatar
  ["from-violet-500 to-indigo-600", "from-emerald-500 to-teal-600"],
];

const files = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/dashboard/layout.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/quiz/page.tsx",
  "src/app/quiz/diagnostic/page.tsx",
  "src/app/leaderboard/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/signup/page.tsx",
  "src/app/(auth)/forgot-password/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/badge.tsx",
  "src/components/ui/progress.tsx",
  "src/components/ui/avatar.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/radio.tsx",
];

const projectRoot = "C:\\Users\\Shiva\\chaduvkondi";
let totalChanges = 0;

for (const file of files) {
  const fullPath = path.join(projectRoot, file);
  try {
    if (!fs.existsSync(fullPath)) {
      console.log("SKIP (not found): " + file);
      continue;
    }
    let content = fs.readFileSync(fullPath, "utf8");
    let changed = false;

    for (const [oldStr, newStr] of replacements) {
      const escaped = oldStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "g");
      const matchCount = (content.match(regex) || []).length;
      if (matchCount > 0) {
        content = content.split(oldStr).join(newStr);
        totalChanges += matchCount;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, "utf8");
      console.log("UPDATED: " + file);
    } else {
      console.log("NO CHANGE: " + file);
    }
  } catch (e) {
    console.log("ERROR: " + file + " - " + e.message);
  }
}

console.log("\nTotal replacements across all files: " + totalChanges);
