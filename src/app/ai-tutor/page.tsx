"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Wand2,
  Send,
  Loader2,
  Lightbulb,
  Sparkles,
  ArrowLeft,
  Home,
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
  relatedConcepts?: { name: string; track: string; trackIcon: string; questionCount: number }[];
}

const QUICK_PROMPTS = [
  { label: "Explain a concept", prompt: "Can you explain how recursion works with a simple example?" },
  { label: "Help me debug", prompt: "I'm getting a 'null pointer exception' in my code. What does this mean and how do I fix it?" },
  { label: "Practice question", prompt: "Give me a practice question about Python list comprehensions." },
  { label: "Study tips", prompt: "What's the best way to study databases and SQL?" },
  { label: "JavaScript closures", prompt: "Can you explain JavaScript closures with examples?" },
  { label: "React hooks", prompt: "How do useState and useEffect work in React?" },
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your AI tutor. I can help you with:\n\n• Explaining programming concepts (recursion, closures, async/await, etc.)\n• Debugging code issues and error messages\n• Studying SQL, databases, and query optimization\n• Learning Python, JavaScript, React, and more\n• Providing study tips and personalized learning strategies\n\n**What would you like to learn about?**",
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

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const userMessage: Message = {
      id,
      role: "user",
      content: content.trim(),
      type: "general",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content.trim(), mood }),
      });
      const result = await res.json();

      if (result.success) {
        const assistantMessage: Message = {
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: "assistant",
          content: result.data.content,
          type: result.data.type || "general",
          conceptName: result.data.conceptName,
          trackName: result.data.trackName,
          trackIcon: result.data.trackIcon,
          relatedConcepts: result.data.relatedConcepts,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || "Failed to get response");
      }
    } catch {
      // Fallback: use smart client-side response
      const fallback = generateFallbackResponse(content.trim(), mood);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: "assistant",
          ...fallback,
        },
      ]);
    }
    setLoading(false);
  }

  function generateFallbackResponse(query: string, currentMood: string): { content: string; type: Message["type"]; conceptName?: string } {
    const q = query.toLowerCase();

    if (q.includes("recursion")) {
      return {
        type: "explanation",
        conceptName: "Recursion",
        content: `## 🧠 Understanding Recursion\n\nRecursion is when a function calls itself to solve a smaller version of the same problem.\n\n### Two Essential Parts:\n1. **Base Case** — stops the recursion (prevents infinite loops)\n2. **Recursive Case** — function calling itself with simpler input\n\n### Python Example:\n\`\`\`python\ndef factorial(n):\n    if n <= 1:  # Base case\n        return 1\n    return n * factorial(n - 1)  # Recursive case\n\`\`\`\n\n### Visual: \`factorial(4) = 4 × 3 × 2 × 1 = 24\`\n\n> 💡 **Tip**: Always ensure your base case will be reached!`,
      };
    }

    if (q.includes("null") || q.includes("exception") || q.includes("debug") || q.includes("error")) {
      return {
        type: "hint",
        conceptName: "Debugging",
        content: `## 🔍 Debugging Guide\n\n**Step 1:** Read the error message carefully — it tells you exactly what and where.\n\n**Step 2:** Verify the variable/object exists before using it:\n\`\`\`python\nif user is not None:\n    print(user.name)\nelse:\n    print("User not found")\n\`\`\`\n\n**Step 3:** Use logging to trace execution flow.\n\n> 🎯 *${currentMood} mode*`,
      };
    }

    return {
      type: "general",
      content: `## 💡 Great Question!\n\nHere are some ways to learn this:\n\n### Quick Links:\n- 📝 [Take a Quiz](/quiz) — Test your knowledge\n- 🎮 [Code Playground](/playground) — Write code interactively\n- 🔄 [Spaced Repetition](/spaced-repetition) — Schedule reviews\n- 🗺️ [Learning Roadmaps](/roadmaps) — Track progress\n\n### 💪 Keep Learning!\nBreak the topic into smaller parts, practice daily, and use spaced repetition for long-term retention.\n\n> 🌟 *"The expert in anything was once a beginner."*`,
    };
  }

  function handleQuickPrompt(prompt: string) {
    sendMessage(prompt);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="flex items-center gap-2 stagger-1 animate-fade-in-up">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
      </div>

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
                    {msg.trackIcon && (
                      <Badge variant="outline" className="text-[10px]">
                        {msg.trackIcon} {msg.trackName}
                      </Badge>
                    )}
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
                      .replace(/^\d+\. \*\*(.+?)\*\*/gm, '<strong class="block mt-1">$1</strong>')
                      .replace(/^- (.+)$/gm, '• $1<br/>')
                      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-[var(--background)] p-3 rounded-lg text-xs my-2 overflow-x-auto font-mono">$2</pre>')
                      .replace(/`([^`]+)`/g, '<code class="bg-[var(--background)] px-1 rounded text-xs font-mono">$1</code>')
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[var(--primary)] underline hover:no-underline" target="_blank">$1</a>')
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />

                {/* Related concepts */}
                {msg.relatedConcepts && msg.relatedConcepts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]/50">
                    <p className="text-[10px] font-medium text-[var(--muted)] mb-1">Related concepts:</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.relatedConcepts.map((rc, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--soft)]">
                          {rc.trackIcon} {rc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--muted)]">Searching concepts and generating response...</span>
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
          💡 Try asking about: recursion, closures, async/await, SQL joins, debugging, React hooks, or study strategies!
        </p>
      </div>
    </div>
  );
}
