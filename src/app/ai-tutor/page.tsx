"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Wand2,
  Brain,
  Send,
  Loader2,
  Lightbulb,
  MessageSquare,
  Sparkles,
  BookOpen,
  GraduationCap,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "question" | "hint" | "explanation" | "general";
  conceptName?: string;
  trackName?: string;
  trackIcon?: string;
}

const QUICK_PROMPTS = [
  { label: "Explain a concept", prompt: "Can you explain how recursion works with a simple example?" },
  { label: "Help me debug", prompt: "I'm getting a 'null pointer exception' in my code. What does this mean and how do I fix it?" },
  { label: "Practice question", prompt: "Give me a practice question about Python list comprehensions." },
  { label: "Study tips", prompt: "What's the best way to study databases and SQL?" },
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your AI tutor. I can help you with:\n\n• Explaining programming concepts\n• Debugging code issues\n• Generating practice questions\n• Providing study tips and resources\n\nWhat would you like to learn about?",
      type: "general",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<string>("focused");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const MOODS = [
    { id: "focused", icon: "🎯", label: "Focused" },
    { id: "chill", icon: "😎", label: "Chill" },
    { id: "hyped", icon: "🔥", label: "Hyped" },
    { id: "confused", icon: "🤔", label: "Confused" },
  ];

  const MOOD_TONES: Record<string, string> = {
    focused: "Clear, direct, and structured explanations.",
    chill: "Friendly and relaxed with a casual tone.",
    hyped: "Enthusiastic and energetic with lots of encouragement!",
    confused: "Extra patient, breaking things down step by step with simple language.",
  };

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      role: "user",
      content: content.trim(),
      type: "general",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate AI tutor response with contextual hints
    setTimeout(() => {
      const response = generateTutorResponse(content.trim(), mood);
      const assistantMessage: Message = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        role: "assistant",
        ...response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000 + Math.random() * 1500);
  }

  function generateTutorResponse(query: string, currentMood: string): { content: string; type: Message["type"]; conceptName?: string } {
    const q = query.toLowerCase();

    // Detect concept-related questions
    if (q.includes("recursion") || q.includes("recursive")) {
      return {
        type: "explanation",
        conceptName: "Recursion",
        content: `## 🧠 Understanding Recursion

Recursion is when a function calls itself to solve a smaller version of the same problem.

### The Key Components:
1. **Base Case** — The stopping condition that prevents infinite recursion
2. **Recursive Case** — The function calling itself with a smaller input

### Simple Example (Python):
\`\`\`python
def factorial(n):
    # Base case
    if n <= 1:
        return 1
    # Recursive case
    return n * factorial(n - 1)

print(factorial(5))  # Output: 120
\`\`\`

### Visual Breakdown:
\`factorial(5) = 5 * factorial(4)\`
\`           = 5 * 4 * factorial(3)\`
\`           = 5 * 4 * 3 * factorial(2)\`
\`           = 5 * 4 * 3 * 2 * factorial(1)\`
\`           = 5 * 4 * 3 * 2 * 1 = 120\`

### 💡 Pro Tip:
Think of recursion like Russian nesting dolls — each doll contains a smaller version of itself. To get to the center, you keep opening smaller dolls until you reach the smallest one (the base case), then work your way back out!`,
      };
    }

    if (q.includes("null pointer") || q.includes("exception") || q.includes("error") || q.includes("debug")) {
      return {
        type: "hint",
        conceptName: "Error Handling",
        content: `## 🔍 Debugging Null Pointer Exceptions

A **NullPointerException** (or similar null reference error) happens when your code tries to use something that doesn't exist yet.

### Common Causes:
1. **Forgot to initialize** a variable before using it
2. **Function returned null** when you expected an object
3. **Array/List index is out of bounds**
4. **Object wasn't found** in a database or collection

### How to Fix:

\`\`\`python
# ❌ Problem
user = get_user_by_id(42)
print(user.name)  # Error if user is None!

# ✅ Solution: Check first!
user = get_user_by_id(42)
if user is not None:
    print(user.name)
else:
    print("User not found")
\`\`\`

### 🎯 Quick Tips:
- Use **Optional/Maybe types** where available
- Always validate function return values
- Add **defensive checks** before accessing properties
- Use your language's **null-safe operators** (\`?.\`, \`??\`)

> "${MOOD_TONES[currentMood]}"`,
      };
    }

    if (q.includes("python") && (q.includes("list comp") || q.includes("comprehension"))) {
      return {
        type: "explanation",
        conceptName: "List Comprehensions",
        content: `## 🐍 Python List Comprehensions

List comprehensions are a concise way to create lists using a single line of code.

### Basic Syntax:
\`\`\`python
[expression for item in iterable if condition]
\`\`\`

### Examples:

\`\`\`python
# Traditional way
squares = []
for x in range(10):
    squares.append(x ** 2)

# Using list comprehension ✨
squares = [x ** 2 for x in range(10)]

# With condition (even numbers only)
even_squares = [x ** 2 for x in range(10) if x % 2 == 0]

# Nested loops
pairs = [(x, y) for x in [1,2,3] for y in [4,5,6]]
\`\`\`

### 🎯 Practice:
Try writing a comprehension that:
- Creates a list of uppercase strings
- Filters out None values from a list
- Creates a dictionary from two lists

> "${MOOD_TONES[currentMood]}"`,
      };
    }

    if (q.includes("sql") || q.includes("database") || q.includes("study") || q.includes("tips")) {
      return {
        type: "general",
        conceptName: "Study Strategies",
        content: `## 📚 Study Tips for Databases & SQL

### 1. Master the Fundamentals
- **SELECT, FROM, WHERE** — The bread and butter
- **JOINs** — INNER, LEFT, RIGHT, FULL — know the differences!
- **GROUP BY & HAVING** — Aggregation is key
- **Subqueries & CTEs** — Write cleaner queries

### 2. Practice Order
\`\`\`sql
-- Start simple, then add complexity
SELECT * FROM users;                           -- Step 1
SELECT name, email FROM users;                 -- Step 2
SELECT * FROM users WHERE created_at > ...;    -- Step 3
SELECT u.*, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id;            -- Step 4
\`\`\`

### 3. Resources
- 🔗 [SQL Tutorial on W3Schools](https://www.w3schools.com/sql/)
- 🔗 [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- 🔗 [SQLZoo — Interactive Tutorials](https://sqlzoo.net/)

### 4. Recommended Approach
1. ⚡ Take a **diagnostic quiz** to find weak areas
2. 📖 Review concepts with **spaced repetition**
3. ✏️ **Practice daily** — even 15 minutes helps
4. 🎯 Focus on one topic at a time

> "${MOOD_TONES[currentMood]}"`,
      };
    }

    // Default response
    return {
      type: "general",
      content: `## 💡 Great Question!

Here's what I'd suggest to help you learn this topic:

### 1. Start with the Basics
Break down the concept into smaller parts and understand each one individually.

### 2. Practice Hands-On
Head over to the **Code Playground** to write and test code in real-time!

### 3. Test Your Knowledge
Take a **quiz** on this topic to identify what you know and what needs more work.

### 4. Use Spaced Repetition
Review the concept again tomorrow, then in 3 days, then in a week. This helps move it from short-term to long-term memory!

### Quick Links:
- 🎮 [Code Playground](/playground) — Write code interactively
- 📝 [Take a Quiz](/quiz) — Test your knowledge
- 🔄 [Spaced Repetition](/spaced-repetition) — Schedule reviews

> *"The expert in anything was once a beginner." — Keep going! 💪*`,
    };
  }

  function handleQuickPrompt(prompt: string) {
    sendMessage(prompt);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="stagger-1 animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-[var(--primary)]" />
          AI Tutor
        </h1>
        <p className="text-[var(--muted)] mt-1">Your personal learning assistant — ask anything about coding!</p>
      </div>

      {/* Mood Selector */}
      <div className="flex items-center gap-2 stagger-1 animate-fade-in-up">
        <span className="text-xs font-medium text-[var(--muted)]">Tone:</span>
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mood === m.id
                ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--muted)]/30"
            }`}
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card className="glass stagger-2 animate-fade-in-up min-h-[500px] flex flex-col">
        <div className="flex-1 p-4 space-y-4 overflow-auto max-h-[500px]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-[var(--background)]"
                    : "bg-[var(--surface)] border border-[var(--border)]"
                }`}
              >
                {/* Concept badge */}
                {msg.conceptName && msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="secondary" className="text-[10px]">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      {msg.type === "explanation" ? "Explanation" : msg.type === "hint" ? "Hint" : "Guide"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {msg.conceptName}
                    </Badge>
                  </div>
                )}

                <div
                  className="text-sm leading-relaxed prose prose-sm max-w-none"
                  style={{
                    color: msg.role === "user" ? "inherit" : "var(--foreground)",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/^## (.+)$/gm, '<strong class="text-base block mt-2 mb-1">$1</strong>')
                      .replace(/^### (.+)$/gm, '<strong class="text-sm block mt-1.5 mb-0.5">$1</strong>')
                      .replace(/^(\d+\. \*\*.+?\*\*)/gm, '<strong class="block mt-1">$1</strong>')
                      .replace(/^- (.+)$/gm, '• $1<br/>')
                      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-[var(--background)] p-3 rounded-lg text-xs my-2 overflow-x-auto font-mono">$2</pre>')
                      .replace(/`([^`]+)`/g, '<code class="bg-[var(--background)] px-1 rounded text-xs font-mono">$1</code>')
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--muted)]">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => handleQuickPrompt(qp.prompt)}
                disabled={loading}
                className="px-2.5 py-1 text-[10px] font-medium rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5 transition-all disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask me anything about programming..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              size="icon"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <div className="text-center text-xs text-[var(--muted)] stagger-3 animate-fade-in-up">
        <p>
          💡 Try asking about: recursion, list comprehensions, debugging SQL queries, or study tips!
        </p>
      </div>
    </div>
  );
}
