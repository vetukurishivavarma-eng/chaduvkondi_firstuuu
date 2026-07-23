import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TutorRequest {
  query: string;
  mood?: string;
  language?: string;
}

const MOOD_TONES: Record<string, string> = {
  focused: "Clear, direct, and structured explanations with precise technical details.",
  chill: "Friendly and relaxed with a casual tone, using everyday analogies.",
  hyped: "Enthusiastic and energetic with lots of encouragement and emojis!",
  confused: "Extra patient, breaking things down step by step with simple language and concrete examples.",
};

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { query, mood = "focused", language } = await request.json() as TutorRequest;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 });
    }

    const q = query.toLowerCase().trim();
    const tone = MOOD_TONES[mood] || MOOD_TONES.focused;

    // Search for relevant concepts in the database
    const relevantConcepts = await prisma.concept.findMany({
      where: {
        OR: [
          { name: { contains: q.toLowerCase() } },
          { description: { contains: q.toLowerCase() } },
        ],
      },
      include: {
        subDomain: {
          include: { track: true },
        },
        resources: { take: 3, select: { title: true, url: true, type: true } },
        _count: { select: { questions: true } },
      },
      take: 5,
    });

    // Build a response based on the query and relevant concepts
    const response = await generateResponse(q, tone, language, relevantConcepts);

    return NextResponse.json({
      success: true,
      data: {
        content: response.content,
        type: response.type,
        conceptName: response.conceptName,
        trackName: response.trackName,
        trackIcon: response.trackIcon,
        relatedConcepts: relevantConcepts.map((c) => ({
          name: c.name,
          track: c.subDomain.track.name,
          trackIcon: c.subDomain.track.icon,
          questionCount: c._count.questions,
        })),
      },
    });
  } catch (error) {
    console.error("AI Tutor API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function generateResponse(
  query: string,
  tone: string,
  _language?: string,
  relevantConcepts?: any[]
): Promise<{
  content: string;
  type: "explanation" | "hint" | "general";
  conceptName?: string;
  trackName?: string;
  trackIcon?: string;
}> {
  // If we found relevant concepts, build a contextual response
  if (relevantConcepts && relevantConcepts.length > 0) {
    const concept = relevantConcepts[0];
    const track = concept.subDomain.track;
    const resources = concept.resources;

    let content = `## 📖 About "${concept.name}"\n\n${concept.description}\n\n`;

    // Add track context
    content += `**Track:** ${track.icon} ${track.name}\n`;
    content += `**Sub-Domain:** ${concept.subDomain.name}\n`;
    content += `**Questions available:** ${concept._count.questions}\n\n`;

    // Add resources if available
    if (resources.length > 0) {
      content += "### 📚 Recommended Resources\n";
      for (const r of resources) {
        const typeIcon = r.type === "video" ? "🎬" : r.type === "article" ? "📝" : "📖";
        content += `- ${typeIcon} [${r.title}](${r.url})\n`;
      }
      content += "\n";
    }

    // Add learning tips based on the concept
    content += `### 💡 Tips for Mastering This Concept\n`;
    const tips = [
      `Start with the fundamentals — make sure you understand the core principles before moving to advanced topics.`,
      `Practice with the ${concept._count.questions} available questions in our quiz system to test your understanding.`,
      `Use spaced repetition to review this concept again in 1 day, 3 days, and 1 week for optimal retention.`,
      `Try explaining this concept to someone else — teaching is the best way to learn!`,
    ];
    for (const tip of tips) {
      content += `- ${tip}\n`;
    }

    content += `\n> 🎯 *${tone}*`;

    return {
      content,
      type: "explanation",
      conceptName: concept.name,
      trackName: track.name,
      trackIcon: track.icon,
    };
  }

  // No relevant concepts found — use intelligent fallback based on query type
  return generalFallbackResponse(query, tone);
}

function generalFallbackResponse(query: string, tone: string): {
  content: string;
  type: "explanation" | "hint" | "general";
  conceptName?: string;
  trackName?: string;
  trackIcon?: string;
} {
  // Categorize the query
  if (/recursion|recursive|stack overflow|call stack/i.test(query)) {
    return {
      type: "explanation",
      conceptName: "Recursion",
      content: `## 🧠 Understanding Recursion\n\nRecursion is when a function calls itself to solve a smaller version of the same problem.\n\n### The Two Essential Parts:\n1. **Base Case** — The condition that stops the recursion (prevents infinite loops)\n2. **Recursive Case** — The function calling itself with simpler input\n\n### Python Example:\n\`\`\`python\ndef factorial(n):\n    # Base case: n <= 1\n    if n <= 1:\n        return 1\n    # Recursive case\n    return n * factorial(n - 1)\n\`\`\`\n\n### Visual Walkthrough for \`factorial(4)\`:\n\`\`\`\nfactorial(4) = 4 * factorial(3)\n           = 4 * 3 * factorial(2)\n           = 4 * 3 * 2 * factorial(1)\n           = 4 * 3 * 2 * 1\n           = 24\n\`\`\`\n\n### 🎯 Key Insight\nThink of recursion like Russian dolls — each doll contains a smaller version of itself. You keep opening smaller dolls until you reach the smallest one (base case), then work your way back out!\n\n> ${tone}`,
    };
  }

  if (/null|exception|error|bug|debug|fix/i.test(query)) {
    return {
      type: "hint",
      conceptName: "Debugging",
      content: `## 🔍 Debugging Strategies\n\n### 1. Reproduce the Error\nAlways start by consistently reproducing the bug. Write down the exact steps.\n\n### 2. Read the Error Message\n\`\`\`\nError: Cannot read property 'x' of null\n      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\nThe error tells you EXACTLY what went wrong and where!\n\`\`\`\n\n### 3. Common Fixes Checklist\n- ✅ **Null checks**: \`if (variable !== null) { ... }\`\n- ✅ **Console logging**: Log values before the crash point\n- ✅ **Input validation**: Validate function parameters\n- ✅ **Error handling**: Wrap risky code in try-catch\n- ✅ **Type checking**: Verify types match expectations\n\n### 4. Rubber Duck Debugging 🦆\nExplain your code line-by-line to a rubber duck (or a colleague). Often you'll spot the bug yourself!\n\n> ${tone}`,
    };
  }

  if (/python|list comp|dictionary|lambda|decorator|generator|iterator/i.test(query)) {
    return {
      type: "explanation",
      conceptName: "Python",
      content: `## 🐍 Python Concepts\n\nLet me break this down with practical examples.\n\n### List Comprehensions\n\`\`\`python\n# Traditional vs Comprehension\nsquares = []\nfor x in range(10):\n    squares.append(x**2)\n\n# Same thing in one line ✨\nsquares = [x**2 for x in range(10)]\n\`\`\`\n\n### Lambda Functions\n\`\`\`python\n# Anonymous functions in one line\ndouble = lambda x: x * 2\nprint(double(5))  # 10\n\n# Great for sorting\nsorted(items, key=lambda x: x['name'])\n\`\`\`\n\n### Generators (Memory Efficient!)\n\`\`\`python\ndef count_up_to(n):\n    i = 0\n    while i < n:\n        yield i  # Yields one at a time\n        i += 1\n\`\`\`\n\n> 💡 **Pro Tip**: Use list comprehensions over map/filter for readability. Use generators for large datasets!\n\n> ${tone}`,
    };
  }

  if (/javascript|js|async|await|promise|callback|event loop|hoisting|closure/i.test(query)) {
    return {
      type: "explanation",
      conceptName: "JavaScript",
      content: `## 💛 JavaScript Concepts\n\n### Closures\nA closure is a function that remembers variables from its outer scope even after the outer function has returned.\n\n\`\`\`javascript\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\nconsole.log(counter()); // 3\n\`\`\`\n\n### Async/Await (Modern Async)\n\`\`\`javascript\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Failed:', error);\n  }\n}\n\`\`\`\n\n### Event Loop 🌀\nJavaScript is single-threaded but non-blocking:\n1. Call Stack runs synchronous code\n2. Web APIs handle async operations\n3. Callback Queue holds ready callbacks\n4. Event Loop checks if stack is empty, then pushes callbacks\n\n> ${tone}`,
    };
  }

  if (/sql|database|query|join|index|normalization|transaction/i.test(query)) {
    return {
      type: "explanation",
      conceptName: "SQL & Databases",
      content: `## 🗄️ SQL & Database Concepts\n\n### JOIN Types (Know These!)\n\`\`\`sql\n-- INNER JOIN: Only matching records\nSELECT * FROM users u\nINNER JOIN orders o ON u.id = o.user_id;\n\n-- LEFT JOIN: All users, even without orders\nSELECT * FROM users u\nLEFT JOIN orders o ON u.id = o.user_id;\n\`\`\`\n\n### Indexing for Performance\n\`\`\`sql\n-- Without index: Full table scan (slow!)\n-- With index: Direct lookup (fast!)\nCREATE INDEX idx_users_email ON users(email);\n\`\`\`\n\n### 🎯 Study Order\n1. SELECT, FROM, WHERE (basics)\n2. JOINs (INNER, LEFT, RIGHT, FULL)\n3. GROUP BY & HAVING (aggregation)\n4. Subqueries & CTEs (advanced)\n5. Indexes & performance\n\n> ${tone}`,
    };
  }

  if (/react|component|state|hook|usestate|useeffect|props|jsx/i.test(query)) {
    const code = [
      'function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  useEffect(() => {',
      '    document.title = `Count: ${count}`;',
      '  }, [count]);',
      '  return (',
      '    <div>',
      '      <p>Count: {count}</p>',
      '      <button onClick={() => setCount(c => c + 1)}>+</button>',
      '    </div>',
      '  );',
      '}',
    ].join("\n");
    return {
      type: "explanation",
      conceptName: "React",
      content: [
        "## ⚛️ React Fundamentals",
        "",
        "### Components",
        "The building blocks of any React app.",
        "",
        "### Hooks (React 16.8+)",
        "",
        "```jsx",
        code,
        "```",
        "",
        "### Key Concepts to Master:",
        "1. **State & Props** — Data flow (down via props, up via callbacks)",
        "2. **Effects** — Side effects (API calls, subscriptions, DOM manipulation)",
        "3. **Context** — Global state without prop drilling",
        "4. **Custom Hooks** — Reusable logic",
        "",
        "> ${tone}",
      ].join("\n"),
    };
  }

  if (/study|tips|how to|recommend|guide|start|beginner|roadmap|learn/i.test(query)) {
    return {
      type: "general",
      conceptName: "Study Strategies",
      content: `## 📚 Effective Learning Strategies\n\n### The 4-Step Mastery Framework\n\n**Step 1: Diagnose** 🩺\nTake a diagnostic quiz to identify what you know and what needs work.\n\n**Step 2: Learn** 📖\nFocus on one concept at a time. Use resources, documentation, and practice.\n\n**Step 3: Practice** ✏️\nTest yourself with quizzes. Spaced repetition reinforces learning.\n\n**Step 4: Apply** 🚀\nBuild projects, write code in the playground, challenge friends in battles.\n\n### 💡 Best Practices\n- **15 min daily** > 2 hours weekly (consistency matters!)\n- **Active recall** > Passive reading (quiz yourself, don't just review)\n- **Teach others** to cement your understanding\n- **Mix topics** to build connections between concepts\n\n> 🎯 *${tone}*`,
    };
  }

  // Default: General programming guidance
  return {
    type: "general",
    content: `## 💡 Great Question!\n\nHere's how to approach learning this topic:\n\n### 1. Break It Down\nSplit the topic into smaller pieces. What are the core concepts?\n\n### 2. Hands-On Practice\nUse the **Code Playground** → \`/playground\` to write and run code\nTake **Quizzes** → \`/quiz\` to test your knowledge\nReview with **Spaced Repetition** → \`/spaced-repetition\`\n\n### 3. Track Your Progress\n- **Roadmaps** → \`/roadmaps\` to see your learning path\n- **Battles** → \`/battles\` to challenge others\n- **Leaderboard** → \`/leaderboard\` to see where you rank\n\n### 4. Quick Reference\n- 📝 [Take a Quiz](/quiz)\n- 🎮 [Code Playground](/playground)\n- 🔄 [Spaced Repetition](/spaced-repetition)\n- 🗺️ [Learning Roadmaps](/roadmaps)\n\n> 🌟 *"The expert in anything was once a beginner." — ${tone}*`,
  };
}
