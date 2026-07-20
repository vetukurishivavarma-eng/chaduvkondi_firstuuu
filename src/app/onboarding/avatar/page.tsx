"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, SkipForward } from "lucide-react";

/**
 * Ready Player Me avatar creator iframe URL.
 * Replace SUBDOMAIN with your RPM partner subdomain.
 * RPM was sunset Jan 2026 – you can use any GLB avatar service
 * that emits { url } via postMessage on the "v1.avatar.exported" channel.
 */
const RPM_IFRAME_URL =
  process.env.NEXT_PUBLIC_RPM_IFRAME_URL ||
  "https://demo.readyplayer.me/avatar?frameApi&clearCache=true";

export default function OnboardingAvatarPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showIframe, setShowIframe] = useState(true);

  // Listen for RPM postMessage
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate origin if needed: event.origin === "https://subdomain.readyplayer.me"
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data?.source !== "readyplayerme") return;

        if (data.eventName === "v1.avatar.exported" && data.data?.url) {
          const url = data.data.url;
          setAvatarUrl(url);
          setShowIframe(false);
          setError("");
        }

        if (data.eventName === "v1.error") {
          setError(
            data.data?.message || "Avatar creation encountered an issue. Please try again."
          );
        }
      } catch {
        // Not a JSON message from RPM – ignore
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Save avatar to backend
  async function handleSave() {
    if (!avatarUrl) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to save avatar");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Skip for now
  function handleSkip() {
    router.push("/dashboard");
    router.refresh();
  }

  // Retry iframe
  function handleRetry() {
    setError("");
    setShowIframe(true);
    setAvatarUrl(null);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-md bg-[var(--primary)]" />
          <span className="font-heading font-semibold text-lg tracking-tight text-[var(--foreground)]">
            Chaduvkondi
          </span>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
            <CardTitle className="text-xl">Create Your Avatar</CardTitle>
            <CardDescription>
              Personalize your learning companion. A 3D avatar that reacts to your activity on the platform.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-2.5 text-sm bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-md">
                {error}
              </div>
            )}

            {/* Avatar Creator Iframe */}
            {showIframe && !avatarUrl && (
              <div className="relative aspect-[3/4] w-full rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--soft)]">
                <iframe
                  ref={iframeRef}
                  src={RPM_IFRAME_URL}
                  title="Avatar Creator"
                  className="w-full h-full border-0"
                  allow="camera *; microphone *"
                  allowFullScreen
                />
              </div>
            )}

            {/* Avatar Preview */}
            {avatarUrl && (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Avatar created successfully! You can always change it later from your profile.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            {!avatarUrl ? (
              <>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSkip}
                >
                  <SkipForward className="w-4 h-4" />
                  Skip for now
                </Button>
                {error && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={handleRetry}
                  >
                    Try Again
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  "Use This Avatar"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-[var(--muted)] mt-4">
          Powered by Ready Player Me (sunset Jan 2026). Replace with any GLB avatar provider.
        </p>
      </div>
    </div>
  );
}
