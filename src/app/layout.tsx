import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
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
      suppressHydrationWarning
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
