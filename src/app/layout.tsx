import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chaduvkondi — Mastery-Based Learning Platform",
  description:
    "An adaptive quiz-based learning platform that identifies weaknesses, provides instant remediation, and reinforces learning through spaced repetition. Test first. Master forever.",
  keywords: [
    "learning",
    "quiz",
    "mastery",
    "Salesforce",
    "adaptive learning",
    "spaced repetition",
    "Chaduvkondi",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
