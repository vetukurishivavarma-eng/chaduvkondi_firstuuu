"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Users,
  BookOpen,
  HelpCircle,
  FileText,
  BarChart3,
  Shield,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

interface Track {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

interface SubDomain {
  id: string;
  name: string;
  description: string;
  order: number;
  trackId: string;
}

interface Concept {
  id: string;
  name: string;
  description: string;
  order: number;
  subDomainId: string;
  _count: { questions: number };
}

interface Question {
  id: string;
  text: string;
  difficultyWeight: number;
  explanation: string;
  isActive: boolean;
  conceptId: string;
  choices: Array<{ id: string; text: string; isCorrect: boolean }>;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  conceptId: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
          if (data.data.role !== "admin") {
            router.push("/dashboard");
          }
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-zinc-400">
          <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage tracks, concepts, questions, and resources
          </p>
        </div>
        <Badge variant="default" className="gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tracks" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Tracks & Concepts
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <FileText className="w-4 h-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>
        <TabsContent value="tracks">
          <AdminTracks />
        </TabsContent>
        <TabsContent value="questions">
          <AdminQuestions />
        </TabsContent>
        <TabsContent value="resources">
          <AdminResources />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      });
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "from-emerald-500 to-teal-600" },
    { label: "Total Tracks", value: stats.tracks, icon: BookOpen, color: "from-emerald-500 to-teal-600" },
    { label: "Total Concepts", value: stats.concepts, icon: BookOpen, color: "from-blue-500 to-cyan-600" },
    { label: "Total Questions", value: stats.questions, icon: HelpCircle, color: "from-amber-500 to-orange-600" },
    { label: "Total Resources", value: stats.resources, icon: FileText, color: "from-rose-500 to-pink-600" },
    { label: "Quiz Attempts", value: stats.quizAttempts, icon: BarChart3, color: "from-emerald-500 to-teal-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tracks")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setTracks(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-zinc-500">Loading tracks...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tracks & Sub-Domains</h3>
      </div>

      {tracks.map((track) => (
        <Card key={track.id} className="overflow-hidden">
          <CardHeader className="pb-3" style={{ borderLeft: `4px solid ${track.color}` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{track.icon}</span>
                <div>
                  <CardTitle className="text-lg">{track.name}</CardTitle>
                  <CardDescription>{track.description}</CardDescription>
                </div>
              </div>
              <Badge variant={track.isActive ? "success" : "secondary"}>
                {track.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/questions")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setQuestions(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-zinc-500">Loading questions...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
      </div>

      {questions.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">No questions yet. Add questions through seeding.</div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        Weight: {q.difficultyWeight}
                      </Badge>
                      <span className="text-[10px] text-zinc-500">
                        {q.choices.length} choices
                      </span>
                    </div>
                  </div>
                  <Badge variant={q.isActive ? "success" : "secondary"} className="shrink-0">
                    {q.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminResources() {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/resources")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setConcepts(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-zinc-500">Loading resources...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Resources by Concept</h3>

      {concepts.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">No resources found.</div>
      ) : (
        concepts.map((concept: any) => (
          <Card key={concept.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{concept.name}</CardTitle>
              <CardDescription>
                {concept.resources.length} resource{concept.resources.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            {concept.resources.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {concept.resources.map((r: Resource) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{r.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] ml-2">
                        {r.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setUsers(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-zinc-500">Loading users...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Users ({users.length})</h3>

      {users.length === 0 ? (
        <div className="py-8 text-center text-zinc-500">No users found.</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold w-9 h-9 flex items-center justify-center">
                      {u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-zinc-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                    {u.tier && (
                      <Badge variant="secondary" className="text-xs">
                        {u.tier.icon} {u.tier.name}
                      </Badge>
                    )}
                    <span className="text-sm font-semibold">{Math.round(u.overallScore)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
