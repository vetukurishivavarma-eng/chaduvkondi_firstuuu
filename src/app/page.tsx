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
  { icon: Brain, title: "Adaptive Engine", description: "Questions adjust to your skill level in real time." },
  { icon: BarChart3, title: "Mastery Analytics", description: "Per-concept scores, sub-domain heatmaps, tier progress." },
  { icon: Trophy, title: "Tier Progression", description: "Climb from Spark to Elite with weighted scoring." },
  { icon: BookOpen, title: "Curated Resources", description: "Hand-picked articles, docs, and videos per concept." },
  { icon: Target, title: "Weak Spot Insight", description: "Know exactly which concepts hold you back." },
  { icon: Shield, title: "Admin Controls", description: "Full CRUD for content — tracks, questions, resources." },
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
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#2B2925]">
      {/* Navigation — restrained, no glass */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F1E8]/95 border-b border-[#E3DFD4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#3D5A45]" />
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

      {/* Hero — editorial, asymmetric */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 lg:pr-12">
              <div className="inline-block px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase text-[#7691A8] border border-[#E3DFD4] rounded-sm">
                Mastery-Based Learning
              </div>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight">
                Test first.
                <br />
                <span className="text-[#3D5A45]">Master forever.</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-[#9C9A94] leading-relaxed max-w-lg">
                The adaptive quiz platform that identifies your weaknesses, provides instant remediation,
                and reinforces learning through spaced repetition. No courses. No lessons. Just mastery.
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
              A complete learning ecosystem designed for mastery — nothing more, nothing less.
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

      {/* Tier Ladder — the signature screen */}
      <section className="py-24 md:py-32 border-t border-[#E3DFD4]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              The Mastery Ladder
            </h2>
            <p className="mt-3 text-[#9C9A94]">
              Six tiers, each richer and warmer than the last. Your progress is visible, earned, and always moving forward.
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

      {/* CTA — warm but restrained */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="rounded-xl border border-[#3D5A45]/20 bg-[#3D5A45] p-12 md:p-20 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-[#F5F1E8] max-w-lg mx-auto leading-snug">
              Ready to Master Salesforce Development?
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
              <div className="w-6 h-6 rounded-sm bg-[#3D5A45]" />
              <span className="font-heading font-semibold">Chaduvkondi</span>
            </div>
            <p className="text-sm text-[#9C9A94]">
              Mastery Learning Platform. Test first. Master forever.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
