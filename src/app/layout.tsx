import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

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
  manifest: "/manifest.json",
  title: "Chaduvkondi — Multi-Language Mastery Platform",
  description:
    "Master Python, JavaScript, TypeScript, Java, Go, Rust, and Salesforce with adaptive quizzes. Instant remediation, spaced repetition, and mastery-based learning.",
  keywords: [
    "learning",
    "quiz",
    "mastery",
    "programming",
    "Salesforce",
    "Python",
    "JavaScript",
    "TypeScript",
    "Java",
    "Go",
    "Rust",
    "adaptive learning",
    "spaced repetition",
    "Chaduvkondi",
    "code challenges",
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
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
