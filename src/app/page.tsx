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
  ArrowRight,
  Circle,
  Hexagon,
  Star,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black noise">
      {/* Floating Background Shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-[15%] left-[15%] w-80 h-80 bg-amber-200/15 dark:bg-amber-800/10 rounded-full blur-3xl animate-drift" />
        <div className="absolute bottom-[25%] right-[5%] w-64 h-64 bg-emerald-200/15 dark:bg-emerald-800/10 rounded-full blur-3xl animate-drift-reverse" />
        <div className="absolute top-[40%] left-[40%] w-48 h-48 bg-teal-200/10 dark:bg-teal-800/5 rounded-full blur-3xl animate-spin-slow" />
        
        {/* Floating decorative shapes */}
        <div className="absolute top-[15%] left-[20%] animate-float-slow">
          <Circle className="w-8 h-8 text-emerald-300/20 dark:text-emerald-500/10" />
        </div>
        <div className="absolute top-[30%] right-[25%] animate-float-delayed">
          <Hexagon className="w-12 h-12 text-teal-300/20 dark:text-teal-500/10" />
        </div>
        <div className="absolute bottom-[20%] right-[30%] animate-float">
          <Star className="w-6 h-6 text-amber-300/20 dark:text-amber-500/10" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">Chaduvkondi</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-1 animate-pulse-glow">
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-28 md:pt-44 md:pb-36 overflow-hidden">
        <div className="noise" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-8 animate-fade-in-down">
              <Sparkles className="w-4 h-4" />
              Mastery-Based Learning Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] animate-fade-in-up">
              Test First.
              <br />
              <span className="gradient-text text-6xl md:text-8xl lg:text-9xl">
                Master Forever.
              </span>
            </h1>
            
            <p className="mt-8 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2">
              The adaptive quiz platform that identifies your weaknesses, provides instant remediation,
              and reinforces learning through spaced repetition. <span className="text-emerald-600 dark:text-emerald-400 font-semibold">No lessons. Just mastery.</span>
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
              <Link href="/signup">
                <Button size="xl" className="gap-2 text-base w-full sm:w-auto group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Journey
                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="outline" className="text-base w-full sm:w-auto group">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/30 dark:to-black pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
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
                color: "from-emerald-500 to-teal-600",
                step: "02",
              },
              {
                icon: Brain,
                title: "Spaced Repetition",
                description: "Weak concepts resurface at increasing intervals until you demonstrate mastery. Knowledge sticks.",
                color: "from-emerald-500 to-teal-600",
                step: "03",
              },
            ].map((feature, i) => (
              <div key={feature.title} className="group animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="p-8 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 card-lift hover:border-emerald-200 dark:hover:border-emerald-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex items-center gap-4 mb-6 relative">
                    <div className={`p-3.5 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-5xl font-bold text-zinc-100 dark:text-zinc-800/50 transition-colors duration-300 group-hover:text-emerald-100 dark:group-hover:text-emerald-900/50">{feature.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 relative">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed relative">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent dark:from-emerald-900/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">Everything You Need</h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              A complete learning ecosystem designed for mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Adaptive Quiz Engine", description: "Questions dynamically adjust to your skill level. Harder after correct, easier after wrong." },
              { icon: BarChart3, title: "Mastery Dashboard", description: "Track per-concept mastery, sub-domain heatmaps, and overall progress at a glance." },
              { icon: Trophy, title: "Tier Progression", description: "Climb from Spark to Elite with weighted scoring that rewards consistency and breadth." },
              { icon: BookOpen, title: "Curated Resources", description: "Every wrong answer triggers immediate remediation with hand-picked learning materials." },
              { icon: Target, title: "Weak Spot Analysis", description: "Know exactly which concepts are holding you back from the next tier." },
              { icon: Shield, title: "Admin Content Management", description: "Full CRUD for tracks, concepts, questions, and resources. You control the content." },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 card-lift hover:border-emerald-200 dark:hover:border-emerald-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="p-3 w-fit rounded-xl bg-emerald-100/80 dark:bg-emerald-900/30 mb-4 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/20 group-hover:scale-110">
                  <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:rotate-3" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900/30 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent dark:from-emerald-900/10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">The Mastery Ladder</h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Progress through six tiers as you demonstrate true understanding across concepts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { name: "Spark", icon: "✨", color: "#94a3b8", description: "Getting started", score: "0+" },
              { name: "Apprentice", icon: "🔥", color: "#22c55e", description: "Building foundations", score: "20+" },
              { name: "Specialist", icon: "💎", color: "#3b82f6", description: "Deepening expertise", score: "40+" },
              { name: "Expert", icon: "🏆", color: "#8b5cf6", description: "Consistent mastery", score: "60+" },
              { name: "Architect", icon: "👑", color: "#f59e0b", description: "Comprehensive knowledge", score: "80+" },
              { name: "Elite", icon: "🌟", color: "#ef4444", description: "Peak performance", score: "95+" },
            ].map((tier, i) => (
              <div
                key={tier.name}
                className="group p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 card-lift text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
                  {tier.icon}
                </div>
                <h3 className="font-bold text-lg transition-all duration-300" style={{ color: tier.color }}>
                  {tier.name}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">{tier.description}</p>
                <p className="text-xs text-zinc-400 mt-2">Score: {tier.score}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 py-16 md:px-16 md:py-24 text-center card-lift">
            {/* Animated background shapes */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full animate-float-slow" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full animate-float-delayed" />
            <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-white/5 rounded-full animate-spin-slow" />
            
            {/* Gradient overlay animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 animate-gradient opacity-50" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
                Ready to Master<br />
                <span className="text-emerald-200">Salesforce Development?</span>
              </h2>
              <p className="text-lg md:text-xl text-emerald-100/80 max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2">
                Join Chaduvkondi and transform how you learn. Test first. Master forever.
              </p>
              <Link href="/signup" className="animate-fade-in-up stagger-3 inline-block">
                <Button
                  size="xl"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-2xl gap-2 text-base group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Chaduvkondi</span>
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
