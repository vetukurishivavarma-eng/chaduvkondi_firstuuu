"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Sparkles, Trash2, ArrowLeft, User, X } from "lucide-react";

const RPM_IFRAME_URL =
  process.env.NEXT_PUBLIC_RPM_IFRAME_URL ||
  "https://demo.readyplayer.me/avatar?frameApi&clearCache=true";

export default function ProfilePage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    avatarCreatedAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");

  // Fetch user data
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.data);
        else router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  // RPM postMessage listener
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (data?.source !== "readyplayerme") return;
      if (data.eventName === "v1.avatar.exported" && data.data?.url) {
        setNewAvatarUrl(data.data.url);
      }
      if (data.eventName === "v1.error") {
        setError(data.data?.message || "Avatar editor error");
      }
    } catch {}
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  async function saveAvatar(url: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to save avatar");
        return;
      }
      setUser((prev) => prev ? { ...prev, avatarUrl: url, avatarCreatedAt: new Date().toISOString() } : prev);
      setShowEditor(false);
      setNewAvatarUrl(null);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function removeAvatar() {
    setSaving(true);
    try {
      await fetch("/api/user/avatar", { method: "DELETE" });
      setUser((prev) => prev ? { ...prev, avatarUrl: null, avatarCreatedAt: null } : prev);
    } catch {
      setError("Failed to remove avatar");
    } finally {
      setSaving(false);
    }
  }

  async function handleCustomUrl() {
    if (!customUrl.trim()) return;
    await saveAvatar(customUrl.trim());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">Profile</h1>
          <p className="text-[var(--muted)] mt-1">Manage your account and avatar</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 text-sm bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-md">
          {error}
        </div>
      )}

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
            <User className="w-4 h-4 text-[var(--primary)]" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-heading font-semibold text-lg text-[var(--foreground)]">{user.name}</p>
              <p className="text-sm text-[var(--muted)]">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            Avatar Companion
          </CardTitle>
          <CardDescription>
            Your 3D avatar appears as a companion on the dashboard. It reacts to your activity — typing, browsing, or idle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.avatarUrl ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-[var(--soft)] flex items-center justify-center overflow-hidden border border-[var(--border)]">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={user.avatarUrl} alt="Avatar" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">Avatar Active</p>
                <p className="text-xs text-[var(--muted)]">
                  {user.avatarCreatedAt
                    ? `Created ${new Date(user.avatarCreatedAt).toLocaleDateString()}`
                    : "Custom avatar"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-[var(--soft)] border border-dashed border-[var(--border)] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[var(--muted)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">No Avatar</p>
                <p className="text-xs text-[var(--muted)]">Create a personalized avatar to appear on your dashboard</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant={user.avatarUrl ? "outline" : "default"}
              size="sm"
              onClick={() => setShowEditor(!showEditor)}
              className="gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {user.avatarUrl ? "Edit Avatar" : "Create Avatar"}
            </Button>

            {user.avatarUrl && (
              <Button
                variant="destructive"
                size="sm"
                onClick={removeAvatar}
                disabled={saving}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </Button>
            )}
          </div>

          {/* Avatar Creator Iframe */}
          {showEditor && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--foreground)]">Avatar Editor</p>
                <button
                  onClick={() => { setShowEditor(false); setNewAvatarUrl(null); }}
                  className="p-1 rounded-md hover:bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Close editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* RPM-style iframe editor */}
              <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--soft)]">
                <iframe
                  ref={iframeRef}
                  src={
                    user.avatarUrl
                      ? `${RPM_IFRAME_URL}&avatar=${encodeURIComponent(user.avatarUrl)}`
                      : RPM_IFRAME_URL
                  }
                  title="Avatar Editor"
                  className="w-full h-full border-0"
                  allow="camera *; microphone *"
                  allowFullScreen
                />
              </div>

              {/* Or paste a custom GLB URL */}
              <div className="space-y-2">
                <Label htmlFor="custom-avatar-url">Or use a custom GLB avatar URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-avatar-url"
                    placeholder="https://example.com/avatar.glb"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCustomUrl}
                    disabled={!customUrl.trim() || saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              </div>

              {/* Save from RPM iframe */}
              {newAvatarUrl && (
                <Button
                  className="w-full gap-2"
                  onClick={() => saveAvatar(newAvatarUrl!)}
                  disabled={saving}
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    "Save Edited Avatar"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
