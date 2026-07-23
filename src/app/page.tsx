"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Target,
  Trophy,
  BarChart3,
  BookOpen,
  Zap,
  Shield,
  ArrowRight,
  Quote,
  ArrowUpRight,
  Code2,
  Sparkles,
  Globe,
  Layers,
  GraduationCap,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Diagnostic Assessment",
    description:
      "An adaptive quiz identifies exactly what you know and where the gaps are across every sub-domain.",
  },
  {
    number: "02",
    title: "Instant Remediation",
    description:
      "Miss a question? Curated resources appear immediately — no searching, no waiting.",
  },
  {
    number: "03",
    title: "Spaced Repetition",
    description:
      "Weak concepts resurface at increasing intervals until you demonstrate lasting mastery.",
  },
];

const features = [
  { icon: Brain, title: "Adaptive Engine", description: "Questions adjust to your skill level in real time across any language." },
  { icon: BarChart3, title: "Mastery Analytics", description: "Per-concept scores, sub-domain heatmaps, and multi-track tier progress." },
  { icon: Trophy, title: "Tier Progression", description: "Climb from Spark to Elite with weighted scoring in every track." },
  { icon: BookOpen, title: "Curated Resources", description: "Hand-picked articles, docs, and videos per concept across 6 languages." },
  { icon: Target, title: "Weak Spot Insight", description: "Know exactly which concepts hold you back in each language." },
  { icon: Shield, title: "Admin Controls", description: "Full CRUD for content — tracks, questions, resources, and challenges." },
];

const tracks = [
  { name: "Salesforce", icon: "☁️", color: "#00a1e0", description: "Apex, LWC, Flow, Security & Automation", difficulty: "Beginner", learners: "Most Popular" },
  { name: "Python", icon: "🐍", color: "#3776AB", description: "Data structures, OOP, Web, Data Science", difficulty: "Beginner", learners: "Trending" },
  { name: "JavaScript / TS", icon: "💛", color: "#F7DF1E", description: "React, Node.js, TypeScript, Async", difficulty: "Beginner", learners: "Top Rated" },
  { name: "Java", icon: "☕", color: "#ED8B00", description: "OOP, Collections, Spring Boot, Testing", difficulty: "Intermediate", learners: "Industry Standard" },
  { name: "Go", icon: "🔵", color: "#00ADD8", description: "Concurrency, HTTP Servers, APIs", difficulty: "Intermediate", learners: "Fast Growing" },
  { name: "Rust", icon: "🦀", color: "#DEA584", description: "Ownership, Traits, Async, Systems", difficulty: "Advanced", learners: "Most Loved" },
];

const tierLadder = [
  { name: "Spark", icon: "✦", color: "#9C9A94", description: "Getting started", score: "0+" },
  { name: "Apprentice", icon: "◆", color: "#3D5A45", description: "Building foundations", score: "20+" },
  { name: "Specialist", icon: "⬥", color: "#7691A8", description: "Deepening expertise", score: "40+" },
  { name: "Expert", icon: "★", color: "#C08A3E", description: "Consistent mastery", score: "60+" },
  { name: "Architect", icon: "✦", color: "#B5533C", description: "Comprehensive knowledge", score: "80+" },
  { name: "Elite", icon: "◆", color: "#2B2925", description: "Peak performance", score: "95+" },
];

export default function Home() {
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#2B2925]">
      {/* Navigation — restrained, no glass */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F1E8]/95 border-b border-[#E3DFD4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#3D5A45] flex items-center justify-center">
                <Code2 className="w-4 h-4 text-[#F5F1E8]" />
              </div>
              <span className="font-heading font-semibold text-lg tracking-tight">Chaduvkondi</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — editorial, asymmetric, multi-language */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 lg:pr-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase text-[#7691A8] border border-[#E3DFD4] rounded-sm">
                <Globe className="w-3.5 h-3.5" />
                {tracks.length} Programming Tracks
              </div>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight">
                Master any
                <br />
                <span className="text-[#3D5A45]">programming language.</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-[#9C9A94] leading-relaxed max-w-lg">
                The adaptive quiz platform that identifies your weaknesses across Python, JavaScript, Java, Go, Rust, Salesforce, and more.
                No courses. No lectures. Just mastery.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Start Your Journey
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Language chips */}
              <div className="mt-8 flex flex-wrap gap-2">
                {tracks.map((t) => (
                  <span
                    key={t.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200"
                    style={{
                      borderColor: `${t.color}40`,
                      backgroundColor: `${t.color}10`,
                      color: t.color,
                    }}
                  >
                    <span>{t.icon}</span>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-xl bg-[#EDE9DF] border border-[#E3DFD4] flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <Quote className="w-8 h-8 text-[#C08A3E] mx-auto mb-4 opacity-50" />
                  <p className="font-heading text-lg text-[#2B2925]/70 italic leading-relaxed">
                    &ldquo;The test reveals what you don&apos;t know. The platform makes sure you learn it.&rdquo;
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#9C9A94]">
                    <div className="w-8 h-8 rounded-full bg-[#3D5A45]/20 flex items-center justify-center text-xs font-medium text-[#3D5A45]">SK</div>
                    <span>Early adopter, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Track Selection — showcase */}
      <section className="py-24 md:py-32 border-t border-[#E3DFD4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              Choose Your Path
            </h2>
            <p className="mt-3 text-[#9C9A94]">
              Six programming language tracks designed for mastery-based learning. Start anywhere, master everywhere.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track, i) => (
              <div
                key={track.name}
                className="group relative p-6 rounded-lg border border-[#E3DFD4] bg-[#FAF8F4] card-lift animate-fade-in-up cursor-pointer transition-all duration-300"
                style={{ animationDelay: `${i * 0.08}s` }}
                onMouseEnter={() => setHoveredTrack(i)}
                onMouseLeave={() => setHoveredTrack(null)}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(600px circle at 50% 100%, ${track.color}08, transparent)`,
                  }}
                />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${track.color}15` }}
                  >
                    {track.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-1" style={{ color: track.color }}>
                    {track.name}
                  </h3>
                  <p className="text-sm text-[#9C9A94] mb-3">{track.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                      style={{ backgroundColor: `${track.color}15`, color: track.color }}>
                      {track.difficulty}
                    </span>
                    <span className="text-[10px] text-[#9C9A94]">{track.learners}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — asymmetric offset */}
      <section className="py-24 md:py-32 border-t border-[#E3DFD4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight sticky top-24">
                How It Works
              </h2>
              <p className="mt-4 text-sm text-[#9C9A94] leading-relaxed">
                The test is always the first step. Content only appears when you need it.
              </p>
            </div>
            <div className="lg:col-span-3 space-y-16">
              {steps.map((step, i) => (
                <div key={step.number} className="grid grid-cols-1 md:grid-cols-6 gap-6 animate-fade-in-up" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="md:col-span-1">
                    <span className="font-heading text-4xl text-[#E3DFD4] font-semibold">{step.number}</span>
                  </div>
                  <div className="md:col-span-5">
                    <h3 className="font-heading text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-[#9C9A94] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features — restrained grid */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              Everything You Need
            </h2>
            <p className="mt-3 text-[#9C9A94]">
              A complete multi-language learning ecosystem designed for mastery — nothing more, nothing less.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group p-5 rounded-lg border border-[#E3DFD4] bg-[#FAF8F4] card-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="w-9 h-9 rounded-md bg-[#3D5A45]/10 flex items-center justify-center mb-3 group-hover:bg-[#3D5A45]/20 transition-colors duration-200">
                  <feature.icon className="w-4.5 h-4.5 text-[#3D5A45]" />
                </div>
                <h3 className="font-heading text-base font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-[#9C9A94] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Ladder */}
      <section className="py-24 md:py-32 border-t border-[#E3DFD4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              The Mastery Ladder
            </h2>
            <p className="mt-3 text-[#9C9A94]">
              Six tiers, each richer and warmer than the last. Your progress is visible, earned, and always moving forward — across every language.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-2">
            {tierLadder.map((tier, i) => (
              <div
                key={tier.name}
                className="group flex items-center gap-4 p-4 rounded-lg border border-[#E3DFD4] bg-[#FAF8F4] card-lift animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center text-lg font-heading font-semibold"
                  style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
                >
                  {tier.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-sm" style={{ color: tier.color }}>
                      {tier.name}
                    </h3>
                    <span className="text-xs text-[#9C9A94]">Score {tier.score}</span>
                  </div>
                  <p className="text-xs text-[#9C9A94]">{tier.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="rounded-xl border border-[#3D5A45]/20 bg-[#3D5A45] p-12 md:p-20 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              {tracks.slice(0, 6).map((t) => (
                <span key={t.name} className="text-2xl">{t.icon}</span>
              ))}
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-[#F5F1E8] max-w-lg mx-auto leading-snug">
              Ready to Master Any Language?
            </h2>
            <p className="mt-4 text-[#EDE9DF]/70 max-w-md mx-auto">
              Join Chaduvkondi. Test first. Master forever.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button className="bg-[#F5F1E8] text-[#3D5A45] hover:bg-[#EDE9DF] border-0 shadow-md">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E3DFD4] py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-sm bg-[#3D5A45] flex items-center justify-center">
                <Code2 className="w-3.5 h-3.5 text-[#F5F1E8]" />
              </div>
              <span className="font-heading font-semibold">Chaduvkondi</span>
            </div>
            <p className="text-sm text-[#9C9A94]">
              Multi-Language Mastery Platform. Test first. Master forever.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
