const fs = require("fs");
const path = require("path");

const projectRoot = "C:\\Users\\Shiva\\chaduvkondi";

// ============================================================
// 1. Fix remaining violet/indigo color references across files
// ============================================================
const colorFixes = [
  // Auth pages - fix violet backgrounds
  {
    file: "src/app/(auth)/login/page.tsx",
    replacements: [
      ["from-zinc-50 via-white to-violet-50", "from-zinc-50 via-white to-emerald-50"],
      ["dark:via-zinc-950 dark:to-violet-950/20", "dark:via-zinc-950 dark:to-emerald-950/20"],
      ["bg-indigo-200/30 dark:bg-indigo-800/10", "bg-teal-200/30 dark:bg-teal-800/10"],
    ],
  },
  {
    file: "src/app/(auth)/signup/page.tsx",
    replacements: [
      ["from-zinc-50 via-white to-violet-50", "from-zinc-50 via-white to-emerald-50"],
      ["dark:via-zinc-950 dark:to-violet-950/20", "dark:via-zinc-950 dark:to-emerald-950/20"],
      ["bg-indigo-200/30 dark:bg-indigo-800/10", "bg-teal-200/30 dark:bg-teal-800/10"],
    ],
  },
  {
    file: "src/app/(auth)/forgot-password/page.tsx",
    replacements: [
      ["from-zinc-50 via-white to-violet-50", "from-zinc-50 via-white to-emerald-50"],
      ["dark:via-zinc-950 dark:to-violet-950/20", "dark:via-zinc-950 dark:to-emerald-950/20"],
      ["bg-indigo-200/30 dark:bg-indigo-800/10", "bg-teal-200/30 dark:bg-teal-800/10"],
    ],
  },
  {
    file: "src/app/(auth)/reset-password/page.tsx",
    replacements: [
      ["from-zinc-50 via-white to-violet-50", "from-zinc-50 via-white to-emerald-50"],
      ["dark:via-zinc-950 dark:to-violet-950/20", "dark:via-zinc-950 dark:to-emerald-950/20"],
      ["bg-indigo-200/30 dark:bg-indigo-800/10", "bg-teal-200/30 dark:bg-teal-800/10"],
      ["text-violet-600", "text-emerald-600"],
    ],
  },
  // Dashboard layout - fix violet spinner
  {
    file: "src/app/dashboard/layout.tsx",
    replacements: [
      ["border-violet-600", "border-emerald-600"],
    ],
  },
  // Dashboard page - fix remaining violet refs
  {
    file: "src/app/dashboard/page.tsx",
    replacements: [
      ["border-violet-600", "border-emerald-600"],
      ["text-violet-600", "text-emerald-600"],
      ["text-violet-500", "text-emerald-500"],
    ],
  },
];

// ============================================================
// 2. Add floating background shapes to auth pages
// ============================================================
const authPages = [
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/signup/page.tsx",
  "src/app/(auth)/forgot-password/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
];

const floatingShapes = `      {/* Floating background shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-[40%] right-[30%] w-48 h-48 bg-amber-200/15 dark:bg-amber-800/10 rounded-full blur-3xl animate-drift" />
        <div className="absolute bottom-[40%] left-[5%] w-40 h-40 bg-emerald-200/15 dark:bg-emerald-800/10 rounded-full blur-3xl animate-spin-slow" />
      </div>

`;

// ============================================================
// 3. Add stagger animation classes to cards
// ============================================================
let totalChanges = 0;

// Apply color fixes first
for (const fix of colorFixes) {
  const fullPath = path.join(projectRoot, fix.file);
  try {
    if (!fs.existsSync(fullPath)) {
      console.log("SKIP (not found): " + fix.file);
      continue;
    }
    let content = fs.readFileSync(fullPath, "utf8");
    let changed = false;

    for (const [oldStr, newStr] of fix.replacements) {
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
      console.log("COLOR FIX: " + fix.file);
    }
  } catch (e) {
    console.log("ERROR: " + fix.file + " - " + e.message);
  }
}

// Add floating shapes to auth pages
for (const file of authPages) {
  const fullPath = path.join(projectRoot, file);
  try {
    let content = fs.readFileSync(fullPath, "utf8");

    // Find the <div className=\"absolute inset-0 overflow-hidden pointer-events-none\"> block and replace with floating shapes
    const oldBgBlock = `<div className="absolute inset-0 overflow-hidden pointer-events-none">`;
    if (content.includes(oldBgBlock)) {
      // Replace the entire blur background section with floating shapes
      const startIdx = content.indexOf(oldBgBlock);
      const endIdx = content.indexOf("</div>", startIdx);
      const nextEndIdx = content.indexOf("</div>", endIdx + 6);

      if (startIdx !== -1 && nextEndIdx !== -1) {
        const before = content.substring(0, startIdx);
        const after = content.substring(nextEndIdx + 6);
        content = before + floatingShapes + after;
        fs.writeFileSync(fullPath, content, "utf8");
        totalChanges += 1;
        console.log("SHAPES ADDED: " + file);
      }
    } else if (!content.includes("Floating background shapes")) {
      // Try finding min-h-screen parent div and add shapes after it
      const classMatch = content.match(/(<div className="min-h-screen[^>]*>)/);
      if (classMatch) {
        const divStart = classMatch.index + classMatch[0].length;
        const before = content.substring(0, divStart);
        const after = content.substring(divStart);
        content = before + "\n" + floatingShapes + after;
        fs.writeFileSync(fullPath, content, "utf8");
        totalChanges += 1;
        console.log("SHAPES ADDED (alt): " + file);
      }
    }
  } catch (e) {
    console.log("ERROR with shapes in " + file + ": " + e.message);
  }
}

// Add stagger animation to dashboard page cards
const dashFile = "src/app/dashboard/page.tsx";
const dashPath = path.join(projectRoot, dashFile);
try {
  let content = fs.readFileSync(dashPath, "utf8");

  // Add stagger classes to stat cards grid
  // Replace the stats grid className
  content = content.replace(
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">',
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">'
  );

  // Add stagger animation to sub-domain scores
  content = content.replace(
    '<Card className="lg:col-span-2">',
    '<Card className="lg:col-span-2 animate-fade-in-up stagger-3">'
  );

  // Add animation to weak concepts card
  content = content.replace(
    '          {/* Weak Concepts */}\n          <Card>',
    '          {/* Weak Concepts */}\n          <Card className="animate-fade-in-up stagger-4">'
  );

  // Add animation to recent activity card
  content = content.replace(
    '      {/* Recent Activity */}\n      <Card>',
    '      {/* Recent Activity */}\n      <Card className="animate-fade-in-up stagger-5">'
  );

  // Add animation to welcome header
  content = content.replace(
    '<h1 className="text-2xl md:text-3xl font-bold tracking-tight">',
    '<h1 className="text-2xl md:text-3xl font-bold tracking-tight animate-fade-in-up">'
  );

  // Add animation to space repetition card
  content = content.replace(
    '<Card className="cursor-pointer hover:shadow-md transition-all duration-200 bg-gradient-to-br',
    '<Card className="cursor-pointer card-lift bg-gradient-to-br'
  );

  fs.writeFileSync(dashPath, content, "utf8");
  totalChanges += 7;
  console.log("ANIMATIONS ADDED: " + dashFile);
} catch (e) {
  console.log("ERROR: " + dashFile + " - " + e.message);
}

// Update dashboard layout - add animations
const layoutFile = "src/app/dashboard/layout.tsx";
const layoutPath = path.join(projectRoot, layoutFile);
try {
  let content = fs.readFileSync(layoutPath, "utf8");

  // Add animation to sidebar items
  content = content.replace(
    '<nav className="flex-1 p-4 space-y-1">',
    '<nav className="flex-1 p-4 space-y-1 animate-fade-in">'
  );

  // Add card-lift to sidebar nav items (they already have transition classes)
  content = content.replace(
    'className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
    'className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]'
  );

  // Add scale animation to logo
  content = content.replace(
    '<Link href="/dashboard" className="flex items-center gap-2.5">',
    '<Link href="/dashboard" className="flex items-center gap-2.5 group">'
  );

  // Add hover rotate to logo icon
  content = content.replace(
    'from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">\n                <Sparkles className="w-5 h-5 text-white" />\n              </div>',
    'from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">\n                <Sparkles className="w-5 h-5 text-white" />\n              </div>'
  );

  // Add loading spinner animation replacement
  content = content.replace(
    'border-violet-600 border-t-transparent rounded-full animate-spin',
    'border-emerald-600 border-t-transparent rounded-full animate-spin'
  );

  // Make loading skeleton more animated
  content = content.replace(
    '<span>Loading...</span>',
    '<span className="animate-pulse">Loading...</span>'
  );

  fs.writeFileSync(layoutPath, content, "utf8");
  totalChanges += 6;
  console.log("ANIMATIONS ADDED: " + layoutFile);
} catch (e) {
  console.log("ERROR: " + layoutFile + " - " + e.message);
}

console.log("\nTotal changes: " + totalChanges);
