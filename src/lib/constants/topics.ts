export interface TopicConfig {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  parentSlug?: string;
  order: number;
}

export const TOPICS: TopicConfig[] = [
  // ── Data Structures ──
  { name: "Arrays", slug: "arrays", description: "Array manipulation, traversal, and algorithms", icon: "📊", color: "#3B82F6", order: 1 },
  { name: "Strings", slug: "strings", description: "String manipulation, pattern matching, parsing", icon: "📝", color: "#8B5CF6", order: 2 },
  { name: "HashMap", slug: "hashmap", description: "Hash-based data structures and counting problems", icon: "🗺️", color: "#10B981", order: 3 },
  { name: "HashSet", slug: "hashset", description: "Set operations, duplicates, and membership testing", icon: "🎯", color: "#06B6D4", order: 4 },
  { name: "Queue", slug: "queue", description: "Queue operations, BFS, and scheduling", icon: "🚶", color: "#F59E0B", order: 5 },
  { name: "Stack", slug: "stack", description: "Stack operations, parsing, and DFS simulation", icon: "📚", color: "#F97316", order: 6 },
  { name: "Heap", slug: "heap", description: "Heap operations, priority scheduling", icon: "⛰️", color: "#14B8A6", order: 7 },
  { name: "Priority Queue", slug: "priority-queue", description: "Priority-based data extraction and management", icon: "⚡", color: "#EAB308", order: 8 },
  { name: "Linked List", slug: "linked-list", description: "Singly, doubly, and circular linked list problems", icon: "🔗", color: "#EC4899", order: 9 },
  { name: "Matrix", slug: "matrix", description: "2D array traversal, rotations, and path finding", icon: "🧮", color: "#6366F1", order: 10 },

  // ── Algorithms ──
  { name: "Binary Search", slug: "binary-search", description: "Binary search and its variants", icon: "🔍", color: "#3B82F6", order: 11 },
  { name: "Sorting", slug: "sorting", description: "Sorting algorithms and order-based problems", icon: "📋", color: "#22C55E", order: 12 },
  { name: "Searching", slug: "searching", description: "Linear search, BFS, DFS, and graph traversal", icon: "🔎", color: "#A855F7", order: 13 },
  { name: "Recursion", slug: "recursion", description: "Recursive problem solving and divide-and-conquer", icon: "🔄", color: "#EF4444", order: 14 },
  { name: "Backtracking", slug: "backtracking", description: "Constraint satisfaction, permutations, combinations", icon: "↩️", color: "#F43F5E", order: 15 },
  { name: "Greedy", slug: "greedy", description: "Greedy algorithms and optimization problems", icon: "💰", color: "#D97706", order: 16 },
  { name: "Sliding Window", slug: "sliding-window", description: "Window-based array/string traversal", icon: "🪟", color: "#0EA5E9", order: 17 },
  { name: "Two Pointer", slug: "two-pointer", description: "Two-pointer technique for sorted data", icon: "👆", color: "#8B5CF6", order: 18 },

  // ── Advanced Data Structures ──
  { name: "Tree", slug: "tree", description: "Binary trees, N-ary trees, traversal techniques", icon: "🌳", color: "#22C55E", order: 19 },
  { name: "BST", slug: "bst", description: "Binary search trees, operations, and validation", icon: "🌲", color: "#16A34A", order: 20 },
  { name: "Graph", slug: "graph", description: "Graph algorithms, shortest path, connectivity", icon: "🕸️", color: "#6366F1", order: 21 },
  { name: "Trie", slug: "trie", description: "Prefix trees, auto-complete, word search", icon: "🔤", color: "#7C3AED", order: 22 },
  { name: "Segment Tree", slug: "segment-tree", description: "Range queries and updates", icon: "📐", color: "#EC4899", order: 23 },
  { name: "Fenwick Tree", slug: "fenwick-tree", description: "Binary indexed trees for prefix sums", icon: "🌿", color: "#14B8A6", order: 24 },
  { name: "Union Find", slug: "union-find", description: "Disjoint set union, connectivity problems", icon: "🤝", color: "#F59E0B", order: 25 },

  // ── Core Topics ──
  { name: "Dynamic Programming", slug: "dynamic-programming", description: "DP, memoization, tabulation", icon: "🧩", color: "#EF4444", order: 26 },
  { name: "Bit Manipulation", slug: "bit-manipulation", description: "Bitwise operations and binary tricks", icon: "💡", color: "#06B6D4", order: 27 },
  { name: "Math", slug: "math", description: "Number theory, combinatorics, geometry basics", icon: "📐", color: "#F97316", order: 28 },
  { name: "Geometry", slug: "geometry", description: "Computational geometry, shapes, and spatial problems", icon: "⬡", color: "#D946EF", order: 29 },
  { name: "Prefix Sum", slug: "prefix-sum", description: "Prefix sums, difference arrays, range queries", icon: "➕", color: "#0891B2", order: 30 },

  // ── Language-Specific ──
  { name: "Java Collections", slug: "java-collections", description: "Collection framework, generics, and utilities", icon: "☕", color: "#ED8B00", order: 31 },
  { name: "Spring Boot", slug: "spring-boot", description: "Spring framework, REST APIs, dependency injection", icon: "🍃", color: "#6DB33F", order: 32 },
  { name: "Streams", slug: "streams", description: "Stream API, lambda expressions, functional programming", icon: "🌊", color: "#3B82F6", order: 33 },
  { name: "Lambda", slug: "lambda", description: "Lambda expressions, functional interfaces", icon: "λ", color: "#8B5CF6", order: 34 },
  { name: "REST APIs", slug: "rest-apis", description: "RESTful API design, HTTP methods, status codes", icon: "🌐", color: "#22C55E", order: 35 },

  // ── System Design ──
  { name: "System Design", slug: "system-design", description: "High-level system architecture and design", icon: "🏗️", color: "#F43F5E", order: 36 },
  { name: "Low Level Design", slug: "low-level-design", description: "Class design, patterns, and OOP principles", icon: "🔧", color: "#A855F7", order: 37 },
  { name: "High Level Design", slug: "high-level-design", description: "Distributed systems, scalability, microservices", icon: "🌍", color: "#6366F1", order: 38 },
  { name: "Design Patterns", slug: "design-patterns", description: "Creational, structural, and behavioral patterns", icon: "📐", color: "#EC4899", order: 39 },
  { name: "OOP", slug: "oop", description: "Object-oriented programming concepts and principles", icon: "🎯", color: "#F59E0B", order: 40 },

  // ── Concurrency ──
  { name: "Concurrency", slug: "concurrency", description: "Threading, synchronization, parallel processing", icon: "⚙️", color: "#EF4444", order: 41 },
  { name: "Multithreading", slug: "multithreading", description: "Thread management, race conditions, deadlocks", icon: "🧵", color: "#F97316", order: 42 },

  // ── Systems Knowledge ──
  { name: "Operating Systems", slug: "operating-systems", description: "Processes, memory, file systems, scheduling", icon: "💻", color: "#3B82F6", order: 43 },
  { name: "Networking", slug: "networking", description: "TCP/IP, HTTP, DNS, load balancing, CDN", icon: "🌐", color: "#06B6D4", order: 44 },
  { name: "Memory Management", slug: "memory-management", description: "Stack, heap, garbage collection, pointers", icon: "🗃️", color: "#14B8A6", order: 45 },
  { name: "Garbage Collection", slug: "garbage-collection", description: "GC algorithms, JVM GC tuning, reference types", icon: "♻️", color: "#22C55E", order: 46 },
  { name: "JVM", slug: "jvm", description: "JVM architecture, class loading, bytecode, JIT", icon: "⚖️", color: "#ED8B00", order: 47 },

  // ── SQL & Databases ──
  { name: "SQL", slug: "sql", description: "Queries, joins, aggregation, indexing, optimization", icon: "🗄️", color: "#00758F", order: 48 },
];

export const TOPIC_MAP = new Map(TOPICS.map((t) => [t.slug, t]));
