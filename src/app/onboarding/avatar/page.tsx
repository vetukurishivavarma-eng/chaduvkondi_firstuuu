"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Sparkles, SkipForward, Upload } from "lucide-react";
import { imageFileToBase64 } from "@/lib/image-to-base64";
import { fetchJson } from "@/lib/fetch-json";

export default function OnboardingAvatarPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError("");
    setSelectedFile(file);
    // Revoke previous preview URL if exists
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset input value so the same file can be re-selected
    e.target.value = "";
  }

  // Revoke blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleUpload() {
    if (!selectedFile) return;

    setLoading(true);
    setError("");

    try {
      // Resize & convert to base64 on the client side (no disk writes needed)
      const avatarDataUrl = await imageFileToBase64(selectedFile);

      const data = await fetchJson("/api/user/avatar/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarDataUrl }),
      });

      if (!data.success) {
        setError(data.error || "Failed to upload avatar");
        return;
      }

      // Revoke preview before navigating
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    // Remember skip for this session so we don't redirect again
    sessionStorage.setItem("avatarSkipped", "true");
    router.push("/dashboard");
    router.refresh();
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
            <CardTitle className="text-xl">Set Your Profile Picture</CardTitle>
            <CardDescription>
              Upload a photo to personalize your experience. Your avatar will appear on the dashboard and react to your activity.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-2.5 text-sm bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] rounded-md">
                {error}
              </div>
            )}

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 cursor-pointer transition-all duration-200"
            >
              {previewUrl ? (
                <Avatar className="w-28 h-28 ring-4 ring-[var(--primary)]/20">
                  <AvatarImage src={previewUrl} alt="Preview" />
                  <AvatarFallback className="text-2xl">
                    <Upload className="w-8 h-8 text-[var(--muted)]" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-28 h-28 rounded-full bg-[var(--soft)] border-2 border-dashed border-[var(--border)] flex items-center justify-center">
                  <Upload className="w-10 h-10 text-[var(--muted)]" />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {previewUrl ? "Click to change photo" : "Click to upload a photo"}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  JPEG, PNG, WebP, or GIF • Max 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <p className="text-sm text-center text-[var(--muted)]">
                Selected: {selectedFile.name}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            {selectedFile ? (
              <Button
                className="w-full gap-2"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  "Use This Photo"
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleSkip}
              >
                <SkipForward className="w-4 h-4" />
                Skip for now
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
