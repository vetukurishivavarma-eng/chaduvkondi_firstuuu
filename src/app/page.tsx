import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Target,
  Trophy,
  Sparkles,
  BarChart3,
  BookOpen,
  Zap,
  Shield,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Chaduvkondi</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-1">
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-40 w-96 h-96 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-violet-100/20 to-indigo-100/20 dark:from-violet-900/5 dark:to-indigo-900/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Mastery-Based Learning Platform
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Test First.
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Master Forever.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              The adaptive quiz platform that identifies your weaknesses, provides instant remediation,
              and reinforces learning through spaced repetition. No lessons. Just mastery.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="xl" className="gap-2 text-base w-full sm:w-auto">
                  Start Your Journey
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="outline" className="text-base w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              The test is always the first step. Content only appears when you need it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Diagnostic Assessment",
                description: "Take an adaptive quiz that identifies exactly what you know and what you don't across all sub-domains.",
                color: "from-amber-500 to-orange-600",
                step: "01",
              },
              {
                icon: Target,
                title: "Instant Remediation",
                description: "Get curated resources — articles, videos, docs — immediately after every wrong answer. No searching, no waiting.",
                color: "from-violet-500 to-indigo-600",
                step: "02",
              },
              {
                icon: Brain,
                title: "Spaced Repetition",
                description: "Weak concepts resurface at increasing intervals until you demonstrate mastery. Knowledge sticks.",
                color: "from-emerald-500 to-teal-600",
                step: "03",
              },
            ].map((feature) => (
              <div key={feature.title} className="relative group">
                <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-zinc-200 dark:text-zinc-800">{feature.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              A complete learning ecosystem designed for mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "Adaptive Quiz Engine",
                description: "Questions dynamically adjust to your skill level. Harder after correct, easier after wrong.",
              },
              {
                icon: BarChart3,
                title: "Mastery Dashboard",
                description: "Track per-concept mastery, sub-domain heatmaps, and overall progress at a glance.",
              },
              {
                icon: Trophy,
                title: "Tier Progression",
                description: "Climb from Spark to Elite with weighted scoring that rewards consistency and breadth.",
              },
              {
                icon: BookOpen,
                title: "Curated Resources",
                description: "Every wrong answer triggers immediate remediation with hand-picked learning materials.",
              },
              {
                icon: Target,
                title: "Weak Spot Analysis",
                description: "Know exactly which concepts are holding you back from the next tier.",
              },
              {
                icon: Shield,
                title: "Admin Content Management",
                description: "Full CRUD for tracks, concepts, questions, and resources. You control the content.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-lg transition-all duration-300"
              >
                <div className="p-2.5 w-fit rounded-lg bg-violet-100 dark:bg-violet-900/30 mb-4">
                  <feature.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section className="py-20 md:py-28 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">The Mastery Ladder</h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Progress through six tiers as you demonstrate true understanding across concepts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Spark", icon: "✨", color: "#94a3b8", description: "Getting started", score: "0+" },
              { name: "Apprentice", icon: "🔥", color: "#22c55e", description: "Building foundations", score: "20+" },
              { name: "Specialist", icon: "💎", color: "#3b82f6", description: "Deepening expertise", score: "40+" },
              { name: "Expert", icon: "🏆", color: "#8b5cf6", description: "Consistent mastery", score: "60+" },
              { name: "Architect", icon: "👑", color: "#f59e0b", description: "Comprehensive knowledge", score: "80+" },
              { name: "Elite", icon: "🌟", color: "#ef4444", description: "Peak performance", score: "95+" },
            ].map((tier) => (
              <div
                key={tier.name}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-300 text-center"
              >
                <div className="text-4xl mb-3">{tier.icon}</div>
                <h3 className="font-bold text-lg" style={{ color: tier.color }}>{tier.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{tier.description}</p>
                <p className="text-xs text-zinc-400 mt-2">Score: {tier.score}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 px-8 py-16 md:px-16 md:py-20 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Master Salesforce Development?
              </h2>
              <p className="text-lg text-violet-200 max-w-2xl mx-auto mb-8">
                Join Chaduvkondi and transform how you learn. Test first. Master forever.
              </p>
              <Link href="/signup">
                <Button
                  size="xl"
                  variant="secondary"
                  className="bg-white text-violet-700 hover:bg-violet-50 shadow-xl gap-2 text-base"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Chaduvkondi</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Mastery Learning Platform. Test first. Master forever.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
