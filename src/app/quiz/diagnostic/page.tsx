"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiagnosticQuizPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/quiz?mode=diagnostic");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2 text-zinc-400">
        <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <span>Starting diagnostic quiz...</span>
      </div>
    </div>
  );
}
