"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Sparkles, Trash2, ArrowLeft, User, Upload, Link as LinkIcon } from "lucide-react";
import { imageFileToBase64 } from "@/lib/image-to-base64";
import { fetchJson } from "@/lib/fetch-json";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [showUploader, setShowUploader] = useState(false);
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Resize & convert to base64 on the client side (no disk writes needed)
      const avatarDataUrl = await imageFileToBase64(file);

      const data = await fetchJson("/api/user/avatar/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarDataUrl }),
      });

      if (!data.success) {
        setError(data.error || "Failed to upload avatar");
        return;
      }

      setUser((prev) =>
        prev ? { ...prev, avatarUrl: data.data.avatarUrl, avatarCreatedAt: new Date().toISOString() } : prev
      );
      setShowUploader(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setSaving(false);
      // Reset file input so the same file can be re-selected
      e.target.value = "";
    }
  }

  async function handleUrlSave() {
    if (!customUrl.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: customUrl.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to save avatar");
        return;
      }

      setUser((prev) =>
        prev ? { ...prev, avatarUrl: customUrl.trim(), avatarCreatedAt: new Date().toISOString() } : prev
      );
      setShowUploader(false);
      setCustomUrl("");
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
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
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
            Avatar
          </CardTitle>
          <CardDescription>
            Your avatar appears on the dashboard and reacts to your activity — typing, browsing, or idle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-[var(--border)]">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="Avatar" />
              ) : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {user.avatarUrl ? (
                <>
                  <p className="text-sm font-medium text-[var(--foreground)]">Photo Set</p>
                  <p className="text-xs text-[var(--muted)]">
                    {user.avatarCreatedAt
                      ? `Uploaded ${new Date(user.avatarCreatedAt).toLocaleDateString()}`
                      : "Custom avatar"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--foreground)]">No Photo</p>
                  <p className="text-xs text-[var(--muted)]">Upload a photo to personalize your dashboard</p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={user.avatarUrl ? "outline" : "default"}
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
              className="gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {user.avatarUrl ? "Change Photo" : "Upload Photo"}
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

          {/* Upload / URL section */}
          {showUploader && (
            <div className="space-y-4 pt-2 p-4 bg-[var(--soft)]/30 rounded-lg border border-[var(--border)]">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload a photo</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 cursor-pointer transition-all duration-200"
                >
                  <Upload className="w-5 h-5 text-[var(--muted)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Click to select a file</p>
                    <p className="text-xs text-[var(--muted)]">JPEG, PNG, WebP, GIF • Max 5MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--soft)]/30 px-2 text-[var(--muted)]">Or use a URL</span>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="avatar-url">Image URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                    <Input
                      id="avatar-url"
                      placeholder="https://example.com/photo.jpg"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUrlSave}
                    disabled={!customUrl.trim() || saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
