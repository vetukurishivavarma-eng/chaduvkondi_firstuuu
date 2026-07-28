"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-[#1a1a2e] rounded-md">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading editor...</span>
        </div>
      </div>
    ),
  }
);

interface CodeEditorProps {
  language?: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  theme?: "vs-dark" | "light";
}

export default function CodeEditor({
  language = "python",
  value,
  onChange,
  readOnly = false,
  height = "450px",
  theme = "vs-dark",
}: CodeEditorProps) {
  return (
    <MonacoEditor
      language={language}
      value={value}
      onChange={(val) => onChange(val || "")}
      theme={theme}
      height={height}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        automaticLayout: true,
        tabSize: 4,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        padding: { top: 12 },
        readOnly,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        matchBrackets: "always",
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        formatOnPaste: true,
        renderWhitespace: "selection",
      }}
    />
  );
}
