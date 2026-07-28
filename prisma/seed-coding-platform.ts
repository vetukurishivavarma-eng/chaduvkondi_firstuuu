import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Coding Interview Platform data...");

  // ── Seed Programming Languages ──
  const languages = [
    { name: "Java", slug: "java", extension: ".java", monacoId: "java", pistonId: "java", icon: "☕", color: "#ED8B00", order: 1 },
    { name: "Python", slug: "python", extension: ".py", monacoId: "python", pistonId: "python", icon: "🐍", color: "#3776AB", order: 2 },
    { name: "C++", slug: "cpp", extension: ".cpp", monacoId: "cpp", pistonId: "cpp", icon: "⚡", color: "#00599C", order: 3 },
    { name: "C", slug: "c", extension: ".c", monacoId: "c", pistonId: "c", icon: "🔧", color: "#A8B9CC", order: 4 },
    { name: "JavaScript", slug: "javascript", extension: ".js", monacoId: "javascript", pistonId: "javascript", icon: "💛", color: "#F7DF1E", order: 5 },
    { name: "TypeScript", slug: "typescript", extension: ".ts", monacoId: "typescript", pistonId: "typescript", icon: "🔷", color: "#3178C6", order: 6 },
    { name: "Go", slug: "go", extension: ".go", monacoId: "go", pistonId: "go", icon: "🔵", color: "#00ADD8", order: 7 },
    { name: "Rust", slug: "rust", extension: ".rs", monacoId: "rust", pistonId: "rust", icon: "🦀", color: "#DEA584", order: 8 },
    { name: "Kotlin", slug: "kotlin", extension: ".kt", monacoId: "kotlin", pistonId: "kotlin", icon: "🅺", color: "#7F52FF", order: 9 },
    { name: "Swift", slug: "swift", extension: ".swift", monacoId: "swift", pistonId: "swift", icon: "🐦", color: "#F05138", order: 10 },
    { name: "PHP", slug: "php", extension: ".php", monacoId: "php", pistonId: "php", icon: "🐘", color: "#777BB4", order: 11 },
    { name: "C#", slug: "csharp", extension: ".cs", monacoId: "csharp", pistonId: "csharp", icon: "#️⃣", color: "#239120", order: 12 },
    { name: "Ruby", slug: "ruby", extension: ".rb", monacoId: "ruby", pistonId: "ruby", icon: "💎", color: "#CC342D", order: 13 },
  ];

  for (const lang of languages) {
    if (!(await prisma.programmingLanguage.findUnique({ where: { slug: lang.slug } }))) {
      await prisma.programmingLanguage.create({ data: lang });
      console.log(`  ✅ Language: ${lang.name}`);
    }
  }

  // ── Seed Companies ──
  const companies = [
    { name: "Amazon", slug: "amazon", description: "E-commerce, cloud computing, and AI.", website: "https://amazon.com" },
    { name: "Google", slug: "google", description: "Search, advertising, cloud, and AI.", website: "https://google.com" },
    { name: "Microsoft", slug: "microsoft", description: "Operating systems, cloud, productivity.", website: "https://microsoft.com" },
    { name: "Meta", slug: "meta", description: "Social media, AR/VR, AI.", website: "https://meta.com" },
    { name: "Netflix", slug: "netflix", description: "Streaming, content delivery.", website: "https://netflix.com" },
    { name: "Apple", slug: "apple", description: "Consumer electronics, software, services.", website: "https://apple.com" },
    { name: "Oracle", slug: "oracle", description: "Database, cloud infrastructure.", website: "https://oracle.com" },
    { name: "Adobe", slug: "adobe", description: "Creative software, document cloud.", website: "https://adobe.com" },
    { name: "Salesforce", slug: "salesforce", description: "CRM, cloud enterprise applications.", website: "https://salesforce.com" },
    { name: "Uber", slug: "uber", description: "Ride-sharing, food delivery, logistics.", website: "https://uber.com" },
    { name: "LinkedIn", slug: "linkedin", description: "Professional networking.", website: "https://linkedin.com" },
    { name: "Atlassian", slug: "atlassian", description: "Developer tools, project management.", website: "https://atlassian.com" },
    { name: "VMware", slug: "vmware", description: "Virtualization, cloud infrastructure.", website: "https://vmware.com" },
    { name: "Cisco", slug: "cisco", description: "Networking, security.", website: "https://cisco.com" },
    { name: "ServiceNow", slug: "servicenow", description: "IT service management, AIOps.", website: "https://servicenow.com" },
    { name: "Intel", slug: "intel", description: "Semiconductors, processors.", website: "https://intel.com" },
    { name: "NVIDIA", slug: "nvidia", description: "GPUs, AI computing.", website: "https://nvidia.com" },
    { name: "OpenAI", slug: "openai", description: "AI research, language models.", website: "https://openai.com" },
    { name: "Others", slug: "others", description: "General coding problems.", website: "" },
  ];

  for (const company of companies) {
    if (!(await prisma.company.findUnique({ where: { slug: company.slug } }))) {
      await prisma.company.create({ data: company });
      console.log(`  ✅ Company: ${company.name}`);
    }
  }

  // ── Seed Topics ──
  const topics = [
    { name: "Arrays", slug: "arrays", description: "Array manipulation and algorithms", icon: "📊", color: "#3B82F6", order: 1 },
    { name: "Strings", slug: "strings", description: "String manipulation and pattern matching", icon: "📝", color: "#8B5CF6", order: 2 },
    { name: "HashMap", slug: "hashmap", description: "Hash-based data structures", icon: "🗺️", color: "#10B981", order: 3 },
    { name: "HashSet", slug: "hashset", description: "Set operations and membership testing", icon: "🎯", color: "#06B6D4", order: 4 },
    { name: "Queue", slug: "queue", description: "Queue operations and BFS", icon: "🚶", color: "#F59E0B", order: 5 },
    { name: "Stack", slug: "stack", description: "Stack operations and DFS simulation", icon: "📚", color: "#F97316", order: 6 },
    { name: "Heap", slug: "heap", description: "Heap operations and priority scheduling", icon: "⛰️", color: "#14B8A6", order: 7 },
    { name: "Priority Queue", slug: "priority-queue", description: "Priority-based data extraction", icon: "⚡", color: "#EAB308", order: 8 },
    { name: "Linked List", slug: "linked-list", description: "Singly, doubly, circular linked lists", icon: "🔗", color: "#EC4899", order: 9 },
    { name: "Binary Search", slug: "binary-search", description: "Binary search and its variants", icon: "🔍", color: "#3B82F6", order: 10 },
    { name: "Sorting", slug: "sorting", description: "Sorting algorithms", icon: "📋", color: "#22C55E", order: 11 },
    { name: "Recursion", slug: "recursion", description: "Recursive problem solving", icon: "🔄", color: "#EF4444", order: 12 },
    { name: "Backtracking", slug: "backtracking", description: "Constraint satisfaction", icon: "↩️", color: "#F43F5E", order: 13 },
    { name: "Greedy", slug: "greedy", description: "Greedy algorithms", icon: "💰", color: "#D97706", order: 14 },
    { name: "Sliding Window", slug: "sliding-window", description: "Window-based traversal", icon: "🪟", color: "#0EA5E9", order: 15 },
    { name: "Two Pointer", slug: "two-pointer", description: "Two-pointer technique", icon: "👆", color: "#8B5CF6", order: 16 },
    { name: "Tree", slug: "tree", description: "Binary and N-ary trees", icon: "🌳", color: "#22C55E", order: 17 },
    { name: "BST", slug: "bst", description: "Binary search trees", icon: "🌲", color: "#16A34A", order: 18 },
    { name: "Graph", slug: "graph", description: "Graph algorithms and shortest path", icon: "🕸️", color: "#6366F1", order: 19 },
    { name: "Trie", slug: "trie", description: "Prefix trees and word search", icon: "🔤", color: "#7C3AED", order: 20 },
    { name: "Segment Tree", slug: "segment-tree", description: "Range queries", icon: "📐", color: "#EC4899", order: 21 },
    { name: "Union Find", slug: "union-find", description: "Disjoint set union", icon: "🤝", color: "#F59E0B", order: 22 },
    { name: "Dynamic Programming", slug: "dynamic-programming", description: "DP, memoization, tabulation", icon: "🧩", color: "#EF4444", order: 23 },
    { name: "Bit Manipulation", slug: "bit-manipulation", description: "Bitwise operations", icon: "💡", color: "#06B6D4", order: 24 },
    { name: "Math", slug: "math", description: "Number theory and combinatorics", icon: "📐", color: "#F97316", order: 25 },
    { name: "Matrix", slug: "matrix", description: "2D array traversal", icon: "🧮", color: "#6366F1", order: 26 },
    { name: "Prefix Sum", slug: "prefix-sum", description: "Prefix sums and range queries", icon: "➕", color: "#0891B2", order: 27 },
    { name: "System Design", slug: "system-design", description: "High-level system architecture", icon: "🏗️", color: "#F43F5E", order: 28 },
    { name: "Low Level Design", slug: "low-level-design", description: "Class design and OOP", icon: "🔧", color: "#A855F7", order: 29 },
    { name: "SQL", slug: "sql", description: "Queries, joins, optimization", icon: "🗄️", color: "#00758F", order: 30 },
    { name: "Concurrency", slug: "concurrency", description: "Threading and synchronization", icon: "⚙️", color: "#EF4444", order: 31 },
    { name: "Networking", slug: "networking", description: "TCP/IP, HTTP, DNS", icon: "🌐", color: "#06B6D4", order: 32 },
    { name: "OOP", slug: "oop", description: "Object-oriented programming", icon: "🎯", color: "#F59E0B", order: 33 },
    { name: "Design Patterns", slug: "design-patterns", description: "Creational, structural, behavioral", icon: "📐", color: "#EC4899", order: 34 },
  ];

  for (const topic of topics) {
    if (!(await prisma.topic.findUnique({ where: { slug: topic.slug } }))) {
      await prisma.topic.create({ data: topic });
    }
  }
  console.log(`  ✅ Topics: ${topics.length} seeded`);

  // ── Helper to get language ID ──
  const getLangId = async (slug: string) => {
    const lang = await prisma.programmingLanguage.findUnique({ where: { slug } });
    if (!lang) throw new Error(`Language not found: ${slug}`);
    return lang.id;
  };

  const defaultLangId = await getLangId("python");

  // ── Problem Seed Interface ──
  interface ProblemSeed {
    title: string;
    slug: string;
    difficulty: string;
    story: string;
    problemStatement: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    examples: string;
    edgeCases: string;
    hints: string;
    tags: string;
    companySlug?: string;
    topicSlug?: string;
    languageSlug: string;
    bruteForceSolution: string;
    optimalSolution: string;
    complexityAnalysis: string;
    dryRun: string;
    pseudoCode: string;
    solutionJava: string;
    solutionPython: string;
    solutionCpp: string;
    solutionJavaScript: string;
    solutionGo: string;
    solutionKotlin: string;
    testCases: string;
    hiddenTestCases: string;
    interviewTips: string;
    commonMistakes: string;
  }

  const problems: ProblemSeed[] = [
    // ═══════════════════════════════════════════════════
    //  1. TWO SUM PAIR
    // ═══════════════════════════════════════════════════
    {
      title: "Two Sum Pair",
      slug: "two-sum-pair",
      difficulty: "easy",
      story: "You're building a payment reconciliation system that needs to find pairs of transactions summing to a target amount.",
      problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
      inputFormat: "First line: integer n (size of array).\nSecond line: n space-separated integers.\nThird line: integer target.",
      outputFormat: "Two space-separated integers representing the indices of the two numbers.",
      constraints: "2 ≤ n ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\n-10^9 ≤ target ≤ 10^9",
      examples: JSON.stringify([
        { input: "4\n2 7 11 15\n9", output: "0 1", explanation: "nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1]." },
        { input: "3\n3 2 4\n6", output: "1 2", explanation: "nums[1] + nums[2] = 2 + 4 = 6." },
      ]),
      edgeCases: JSON.stringify([
        "Array with negative numbers: nums = [-1, -2, -3], target = -3 → indices [0, 1]",
        "Smallest array (n=2): always the answer since exactly one solution exists",
        "Large numbers: values at the constraint limits, ensure no overflow",
        "Duplicate values: nums = [3, 3], target = 6 → indices [0, 1] (different elements)",
      ]),
      hints: JSON.stringify([
        "Think about using a hash map to store values you've seen and their indices.",
        "The complement of the current number is target - nums[i].",
        "If the complement exists in the hash map, you've found your pair.",
        "You only need to iterate through the array once.",
      ]),
      tags: JSON.stringify(["array", "hashmap"]),
      companySlug: "amazon",
      topicSlug: "hashmap",
      languageSlug: "python",

      bruteForceSolution: `Approach: Nested Loops (O(n²))
For each element at index i, check every other element at index j (j > i) to see if nums[i] + nums[j] == target.
This checks all possible pairs but is inefficient for large arrays.

Algorithm:
1. Loop i from 0 to n-1
2. Loop j from i+1 to n-1
3. If nums[i] + nums[j] == target, return [i, j]
4. If no pair found, return [-1, -1]`,

      optimalSolution: `Approach: One-pass Hash Map (O(n))
Use a hash map to store each number's index as we iterate. For each number, compute its complement (target - num).
If the complement exists in the map, we've found the pair. This trades O(n) space for O(n) time.

Algorithm:
1. Initialize an empty hash map
2. For each index i and value num in nums:
   a. Compute complement = target - num
   b. If complement exists in map, return [map[complement], i]
   c. Store num -> i in the map
3. Return [-1, -1] (should not reach here given the problem guarantees)`,

      complexityAnalysis: `Brute Force Approach:
• Time Complexity: O(n²) — two nested loops over n elements
• Space Complexity: O(1) — no extra space used

Optimal Approach (Hash Map):
• Time Complexity: O(n) — single pass through the array
• Space Complexity: O(n) — hash map stores up to n key-value pairs`,

      dryRun: `Example: nums = [2, 7, 11, 15], target = 9

Step 1: i=0, num=2, complement=9-2=7
  Map is empty. Store 2→0 in map.
  Map = {2: 0}

Step 2: i=1, num=7, complement=9-7=2
  complement=2 exists in map at index 0!
  Return [0, 1] ✓`,

      pseudoCode: `function twoSum(nums, target):
    seen = empty hash map
    for i in range(len(nums)):
        complement = target - nums[i]
        if complement in seen:
            return [seen[complement], i]
        seen[nums[i]] = i
    return [-1, -1]`,

      solutionJava: `import java.util.*;
public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{-1, -1};
    }
}`,
      solutionPython: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return [-1, -1]`,
      solutionCpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {-1, -1};
    }
};`,
      solutionJavaScript: `function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [-1, -1];
}`,
      solutionGo: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return []int{-1, -1}
}`,
      solutionKotlin: `class Solution {
    fun twoSum(nums: IntArray, target: Int): IntArray {
        val map = mutableMapOf<Int, Int>()
        for (i in nums.indices) {
            val complement = target - nums[i]
            if (map.containsKey(complement)) {
                return intArrayOf(map[complement]!!, i)
            }
            map[nums[i]] = i
        }
        return intArrayOf(-1, -1)
    }
}`,
      testCases: JSON.stringify([
        { input: "4\n2 7 11 15\n9", expected: "0 1" },
        { input: "3\n3 2 4\n6", expected: "1 2" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "2\n3 3\n6", expected: "0 1" },
        { input: "4\n-1 -2 -3 -4\n-3", expected: "0 1" },
      ]),
      interviewTips: "This is the most common interview starter problem. Interviewers watch for: (1) Can you start with brute force and optimize? (2) Do you handle the 'one element per use' constraint? (3) Can you explain why the hash map approach works? Amazon often follows up with three-sum or four-sum problems.",
      commonMistakes: "Using the same element twice (e.g., returning [1, 1] when nums[1] * 2 == target). Forgetting to check map.containsKey before storing the current element (would fail for target=6 when nums=[3,3]). Using two-pointer without sorting first (need to return indices of original array).",
    },

    // ═══════════════════════════════════════════════════
    //  2. LONGEST SUBSTRING WITHOUT REPEATING CHARACTERS
    // ═══════════════════════════════════════════════════
    {
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-without-repeats",
      difficulty: "medium",
      story: "You're developing a data deduplication system that needs to find the longest sequence of unique characters in a data stream.",
      problemStatement: "Given a string s, find the length of the longest substring without repeating characters.",
      inputFormat: "A single line containing the string s.",
      outputFormat: "A single integer representing the length of the longest substring.",
      constraints: "0 ≤ s.length ≤ 5 × 10^4\ns consists of English letters, digits, symbols, and spaces.",
      examples: JSON.stringify([
        { input: "abcabcbb", output: "3", explanation: "The answer is 'abc', with length 3." },
        { input: "bbbbb", output: "1", explanation: "The answer is 'b', with length 1." },
        { input: "pwwkew", output: "3", explanation: "The answer is 'wke', with length 3. Notice 'pwke' is a subsequence, not a substring." },
      ]),
      edgeCases: JSON.stringify([
        "Empty string: s = \"\" → answer 0",
        "Single character: s = \"a\" → answer 1",
        "All unique characters: s = \"abcdef\" → answer 6",
        "All same characters: s = \"aaaa\" → answer 1",
        "String with spaces: s = \"a b c\" → answer 5 (spaces count as characters)",
        "Maximum length at the end: s = \"abcdeaf\" → answer 5 ('bcdeaf')",
      ]),
      hints: JSON.stringify([
        "Use the sliding window technique with two pointers (left and right).",
        "Maintain a hash map of the most recent position of each character.",
        "When you see a repeat, move the left pointer to after the previous occurrence.",
        "The window size (right - left + 1) gives the current unique substring length.",
      ]),
      tags: JSON.stringify(["string", "sliding-window"]),
      companySlug: "google",
      topicSlug: "sliding-window",
      languageSlug: "python",

      bruteForceSolution: `Approach: Generate All Substrings (O(n³))
Generate all possible substrings and check each one for duplicate characters.
This is extremely inefficient and won't pass large inputs.

Algorithm:
1. Initialize max_len = 0
2. For each starting index i from 0 to n-1:
   a. For each ending index j from i to n-1:
      i. Extract substring s[i:j+1]
      ii. If all characters in substring are unique:
          Update max_len
3. Return max_len`,

      optimalSolution: `Approach: Sliding Window with Hash Map (O(n))
Use two pointers to maintain a window of unique characters. Expand the right pointer and use a hash map to track the last seen index of each character. When a duplicate is found, move the left pointer to after the previous occurrence.

Algorithm:
1. Initialize left = 0, max_len = 0, char_map = {}
2. For each index right, character c in s:
   a. If c exists in char_map and char_map[c] >= left:
      Move left to char_map[c] + 1
   b. Update char_map[c] = right
   c. max_len = max(max_len, right - left + 1)
3. Return max_len`,

      complexityAnalysis: `Brute Force Approach:
• Time Complexity: O(n³) — O(n²) substrings × O(n) to check uniqueness
• Space Complexity: O(min(n, m)) — set to track unique characters, where m is charset size

Optimal Approach (Sliding Window):
• Time Complexity: O(n) — each character is visited at most twice (by right and left pointers)
• Space Complexity: O(min(n, m)) — hash map storing at most the character set size`,

      dryRun: `Example: s = "abcabcbb"

Step 1: left=0, right=0, c='a'
  'a' not in map. Store a→0. max_len = max(0, 0-0+1) = 1
Step 2: left=0, right=1, c='b'
  'b' not in map. Store b→1. max_len = max(1, 1-0+1) = 2
Step 3: left=0, right=2, c='c'
  'c' not in map. Store c→2. max_len = max(2, 2-0+1) = 3
Step 4: left=0, right=3, c='a'
  'a' in map at 0, which is >= left(0). Move left to 0+1=1.
  Update a→3. max_len = max(3, 3-1+1) = 3
...continues... Final: max_len = 3`,

      pseudoCode: `function lengthOfLongestSubstring(s):
    charMap = empty hash map
    left = 0
    maxLen = 0
    for right in range(len(s)):
        char = s[right]
        if char exists in charMap and charMap[char] >= left:
            left = charMap[char] + 1
        charMap[char] = right
        maxLen = max(maxLen, right - left + 1)
    return maxLen`,

      solutionJava: `import java.util.*;
public class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c) && map.get(c) >= left) {
                left = map.get(c) + 1;
            }
            map.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      solutionPython: `def length_of_longest_substring(s):
    char_map = {}
    left = max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
      solutionCpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> map;
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            if (map.count(s[right]) && map[s[right]] >= left) {
                left = map[s[right]] + 1;
            }
            map[s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      solutionJavaScript: `function lengthOfLongestSubstring(s) {
    const charMap = new Map();
    let left = 0, maxLen = 0;
    for (let right = 0; right < s.length; right++) {
        const char = s[right];
        if (charMap.has(char) && charMap.get(char) >= left) {
            left = charMap.get(char) + 1;
        }
        charMap.set(char, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
      solutionGo: `func lengthOfLongestSubstring(s string) int {
    charMap := make(map[byte]int)
    left := 0
    maxLen := 0
    for right := 0; right < len(s); right++ {
        c := s[right]
        if idx, ok := charMap[c]; ok && idx >= left {
            left = idx + 1
        }
        charMap[c] = right
        if right-left+1 > maxLen {
            maxLen = right - left + 1
        }
    }
    return maxLen
}`,
      solutionKotlin: `class Solution {
    fun lengthOfLongestSubstring(s: String): Int {
        val charMap = mutableMapOf<Char, Int>()
        var left = 0
        var maxLen = 0
        for (right in s.indices) {
            val c = s[right]
            if (charMap.containsKey(c) && charMap[c]!! >= left) {
                left = charMap[c]!! + 1
            }
            charMap[c] = right
            maxLen = maxOf(maxLen, right - left + 1)
        }
        return maxLen
    }
}`,
      testCases: JSON.stringify([
        { input: "abcabcbb", expected: "3" },
        { input: "bbbbb", expected: "1" },
        { input: "pwwkew", expected: "3" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "", expected: "0" },
        { input: " ", expected: "1" },
        { input: "abcdefghijklmnopqrstuvwxyz", expected: "26" },
        { input: "aab", expected: "2" },
      ]),
      interviewTips: "Google frequently asks this problem to evaluate sliding window understanding. Important follow-up discussion: (1) What if the character set is only lowercase letters? (We can use an integer array of size 26.) (2) Optimize for ASCII (size 128 array). Be ready to discuss time/space tradeoffs between hash map and array approaches.",
      commonMistakes: "Not handling the case when the repeated character is before the current left pointer (the condition char_map[char] >= left). Confusing substring with subsequence. Using set of characters and clearing on duplicates instead of sliding window (leads to O(n²)). Off-by-one errors in window size calculation.",
    },

    // ═══════════════════════════════════════════════════
    //  3. VALID PARENTHESES
    // ═══════════════════════════════════════════════════
    {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      difficulty: "easy",
      story: "You're building a code formatter that needs to verify that all brackets in source code are properly matched and nested.",
      problemStatement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nA string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
      inputFormat: "A single line containing the string s.",
      outputFormat: "true if the string is valid, false otherwise.",
      constraints: "1 ≤ s.length ≤ 10^4\ns consists of parentheses only '()[]{}'.",
      examples: JSON.stringify([
        { input: "()", output: "true", explanation: "Simple valid pair." },
        { input: "()[]{}", output: "true", explanation: "Multiple bracket types in order." },
        { input: "(]", output: "false", explanation: "Mismatched brackets." },
        { input: "([)]", output: "false", explanation: "Incorrect nesting order." },
      ]),
      edgeCases: JSON.stringify([
        "Single open bracket: s = \"(\" → false",
        "Single close bracket: s = \")\" → false",
        "Nested deeply: s = \"({[({[]})]})\" → true",
        "Wrong closing type: s = \"(}\" → false",
        "Empty-ish: s = \"\" → true (valid by definition in some interpretations, but constraints say ≥1)",
      ]),
      hints: JSON.stringify([
        "Use a stack data structure to track opening brackets.",
        "When you see an opening bracket, push the expected closing bracket onto the stack.",
        "When you see a closing bracket, check if it matches the top of the stack.",
        "At the end, the stack must be empty for the string to be valid.",
      ]),
      tags: JSON.stringify(["string", "stack"]),
      companySlug: "microsoft",
      topicSlug: "stack",
      languageSlug: "python",

      bruteForceSolution: `Approach: Repeated Replacement (O(n²))
Repeatedly replace all valid pairs "()", "[]", "{}" with empty string until no more replacements are possible. If the final string is empty, it's valid.

Algorithm:
1. While s contains "()" or "[]" or "{}":
   a. Replace all occurrences of "()", "[]", "{}" with ""
2. Return s == ""`,

      optimalSolution: `Approach: Stack (O(n))
Use a stack to match brackets. For each character:
- If it's an opening bracket, push its corresponding closing bracket onto the stack
- If it's a closing bracket, check if the stack is non-empty and the top matches; if so, pop; otherwise return false
- After processing all characters, the stack must be empty

Algorithm:
1. Initialize empty stack
2. For each char c in s:
   a. If c == '(': push ')'
   b. Else if c == '{': push '}'
   c. Else if c == '[': push ']'
   d. Else (it's a closing bracket):
      i. If stack is empty OR stack.pop() != c: return false
3. Return stack.isEmpty()`,

      complexityAnalysis: `Brute Force Approach:
• Time Complexity: O(n²) — each replacement scans the string O(n), up to O(n) replacement rounds
• Space Complexity: O(n) — string copying during replacement

Optimal Approach (Stack):
• Time Complexity: O(n) — single pass through the string
• Space Complexity: O(n) — stack can hold up to n opening brackets`,

      dryRun: `Example: s = "([{}])"

Step 1: c='(' → push ')'. Stack = [')']
Step 2: c='[' → push ']'. Stack = [')', ']']
Step 3: c='{' → push '}'. Stack = [')', ']', '}']
Step 4: c='}' → pop(), top='}' matches. Stack = [')', ']']
Step 5: c=']' → pop(), top=']' matches. Stack = [')']
Step 6: c=')' → pop(), top=')' matches. Stack = []
Stack empty → return true ✓`,

      pseudoCode: `function isValid(s):
    stack = empty Stack
    for each char c in s:
        if c == '(': stack.push(')')
        elif c == '{': stack.push('}')
        elif c == '[': stack.push(']')
        elif stack.isEmpty() OR stack.pop() != c:
            return false
    return stack.isEmpty()`,

      solutionJava: `import java.util.*;
public class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
      solutionPython: `def is_valid(s):
    stack = []
    pairs = {'(': ')', '{': '}', '[': ']'}
    for c in s:
        if c in pairs:
            stack.append(pairs[c])
        elif not stack or stack.pop() != c:
            return False
    return len(stack) == 0`,
      solutionCpp: `#include <stack>
#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else if (st.empty() || st.top() != c) return false;
            else st.pop();
        }
        return st.empty();
    }
};`,
      solutionJavaScript: `function isValid(s) {
    const stack = [];
    const pairs = { '(': ')', '{': '}', '[': ']' };
    for (const c of s) {
        if (c in pairs) {
            stack.push(pairs[c]);
        } else if (stack.length === 0 || stack.pop() !== c) {
            return false;
        }
    }
    return stack.length === 0;
}`,
      solutionGo: `func isValid(s string) bool {
    stack := make([]rune, 0)
    pairs := map[rune]rune{'(': ')', '{': '}', '[': ']'}
    for _, c := range s {
        if _, ok := pairs[c]; ok {
            stack = append(stack, pairs[c])
        } else if len(stack) == 0 || stack[len(stack)-1] != c {
            return false
        } else {
            stack = stack[:len(stack)-1]
        }
    }
    return len(stack) == 0
}`,
      solutionKotlin: `class Solution {
    fun isValid(s: String): Boolean {
        val stack = mutableListOf<Char>()
        for (c in s) {
            when (c) {
                '(' -> stack.add(')')
                '{' -> stack.add('}')
                '[' -> stack.add(']')
                else -> {
                    if (stack.isEmpty() || stack.removeAt(stack.size - 1) != c) {
                        return false
                    }
                }
            }
        }
        return stack.isEmpty()
    }
}`,
      testCases: JSON.stringify([
        { input: "()", expected: "true" },
        { input: "()[]{}", expected: "true" },
        { input: "(]", expected: "false" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "([{}])", expected: "true" },
        { input: "((()))", expected: "true" },
        { input: "((())", expected: "false" },
        { input: "({[)]}", expected: "false" },
      ]),
      interviewTips: "Microsoft often asks this as a warm-up and follows up with more complex parsing problems. Key discussion points: (1) What if we add more bracket types? (2) What if we need to return the position of the first invalid bracket? (3) How would you use this to validate actual code? The 'push the expected closing bracket' trick is elegant — demonstrate it.",
      commonMistakes: "Forgetting to check if the stack is empty before popping (causes NullPointerException). Checking length parity is not sufficient (e.g., '([)]' has even length but is invalid). Using a counter instead of stack (doesn't handle nested ordering). Returning true when stack is not empty at the end.",
    },

    // ═══════════════════════════════════════════════════
    //  4. REVERSE LINKED LIST
    // ═══════════════════════════════════════════════════
    {
      title: "Reverse Linked List",
      slug: "reverse-linked-list",
      difficulty: "easy",
      story: "Building a playlist system that needs to play songs in reverse order without recreating the entire list.",
      problemStatement: "Given the head of a singly linked list, reverse the list and return the new head.",
      inputFormat: "First line: integer n (number of nodes).\nSecond line: n space-separated integers representing node values.",
      outputFormat: "n space-separated integers representing the reversed linked list values.",
      constraints: "0 ≤ n ≤ 5000\n-5000 ≤ Node.val ≤ 5000",
      examples: JSON.stringify([
        { input: "5\n1 2 3 4 5", output: "5 4 3 2 1", explanation: "The list 1→2→3→4→5 becomes 5→4→3→2→1." },
        { input: "1\n42", output: "42", explanation: "Single node list stays the same." },
      ]),
      edgeCases: JSON.stringify([
        "Empty list (n=0): return null",
        "Single node: return the same node",
        "Two nodes: simple swap, 1→2 becomes 2→1",
        "Large list (5000 nodes): ensure iterative solution to avoid stack overflow",
      ]),
      hints: JSON.stringify([
        "Use three pointers: prev (null initially), curr (head), and next (temporary).",
        "In each iteration, save the next node, reverse the current pointer, and advance.",
        "For the recursive approach, the base case is head == null or head.next == null.",
      ]),
      tags: JSON.stringify(["linked-list"]),
      companySlug: "meta",
      topicSlug: "linked-list",
      languageSlug: "python",

      bruteForceSolution: `Approach: Array-Based Reversal (O(n) time, O(n) space)
Traverse the linked list and store values in an array. Then create a new linked list from the array in reverse order.
This uses extra O(n) space which is not optimal.

Algorithm:
1. Initialize empty array values
2. While head != null: append head.val to values; head = head.next
3. Create dummy node for result
4. For each val in values (reverse order): append new node with val
5. Return dummy.next`,

      optimalSolution: `Approach: Iterative Three-Pointer (O(n) time, O(1) space)
Reverse pointers in-place using three pointers. No extra space needed.

Algorithm:
1. Initialize prev = null, curr = head
2. While curr != null:
   a. Save next = curr.next (temporary hold)
   b. Point curr.next = prev (reverse the link)
   c. Move prev = curr (advance prev)
   d. Move curr = next (advance curr)
3. Return prev (new head)

Recursive Approach:
1. Base case: if head == null or head.next == null, return head
2. newHead = reverseList(head.next)
3. head.next.next = head (reverse the link)
4. head.next = null
5. Return newHead`,

      complexityAnalysis: `Array-Based Approach:
• Time Complexity: O(n) — two passes (one to collect, one to rebuild)
• Space Complexity: O(n) — array to store all node values

Optimal Approach (Iterative):
• Time Complexity: O(n) — single pass, process each node once
• Space Complexity: O(1) — only three pointers regardless of input size

Optimal Approach (Recursive):
• Time Complexity: O(n) — processes each node once
• Space Complexity: O(n) — recursion stack uses O(n) space`,

      dryRun: `Example: List = 1 → 2 → 3 → null

Step 1: prev=null, curr=1
  next = 2, curr.next = null, prev = 1, curr = 2
  Result: null ← 1    2 → 3 → null

Step 2: prev=1, curr=2
  next = 3, curr.next = 1, prev = 2, curr = 3
  Result: null ← 1 ← 2    3 → null

Step 3: prev=2, curr=3
  next = null, curr.next = 2, prev = 3, curr = null
  Result: null ← 1 ← 2 ← 3

Step 4: curr=null → exit loop
  Return prev = 3 (new head) ✓`,

      pseudoCode: `function reverseList(head):
    prev = null
    curr = head
    while curr != null:
        nextTemp = curr.next
        curr.next = prev
        prev = curr
        curr = nextTemp
    return prev`,

      solutionJava: `public class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
}`,
      solutionPython: `def reverse_list(head):
    prev, curr = None, head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev`,
      solutionCpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* nextTemp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
};`,
      solutionJavaScript: `function reverseList(head) {
    let prev = null;
    let curr = head;
    while (curr !== null) {
        const nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`,
      solutionGo: `func reverseList(head *ListNode) *ListNode {
    var prev *ListNode
    curr := head
    for curr != nil {
        nextTemp := curr.Next
        curr.Next = prev
        prev = curr
        curr = nextTemp
    }
    return prev
}`,
      solutionKotlin: `class Solution {
    fun reverseList(head: ListNode?): ListNode? {
        var prev: ListNode? = null
        var curr = head
        while (curr != null) {
            val nextTemp = curr.next
            curr.next = prev
            prev = curr
            curr = nextTemp
        }
        return prev
    }
}`,
      testCases: JSON.stringify([
        { input: "5\n1 2 3 4 5", expected: "5 4 3 2 1" },
        { input: "2\n1 2", expected: "2 1" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "1\n42", expected: "42" },
        { input: "0\n", expected: "" },
        { input: "3\n-1 0 1", expected: "1 0 -1" },
      ]),
      interviewTips: "Meta/Facebook loves recursive solutions. Always start with the iterative approach, then mention you can also solve it recursively. The recursive solution is particularly elegant (newHead = reverseList(head.next); head.next.next = head; head.next = null). Be ready to discuss the space trade-offs between iterative O(1) and recursive O(n) stack space.",
      commonMistakes: "Losing reference to the next node (must save curr.next before overwriting). Creating a cycle by forgetting to set head.next = null in the recursive approach. Returning the old head instead of prev (which becomes the new head). Off-by-one in the iteration — should continue until curr == null, not curr.next == null.",
    },

    // ═══════════════════════════════════════════════════
    //  5. MAXIMUM SUBARRAY SUM (KADANE'S ALGORITHM)
    // ═══════════════════════════════════════════════════
    {
      title: "Maximum Subarray Sum",
      slug: "maximum-subarray-sum",
      difficulty: "medium",
      story: "You're analyzing stock price data to find the most profitable consecutive trading period for maximum returns.",
      problemStatement: "Given an integer array nums, find the subarray with the largest sum and return its sum.",
      inputFormat: "First line: integer n (size of array).\nSecond line: n space-separated integers.",
      outputFormat: "A single integer representing the maximum subarray sum.",
      constraints: "1 ≤ n ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4",
      examples: JSON.stringify([
        { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6", explanation: "The subarray [4, -1, 2, 1] has the largest sum = 6." },
        { input: "1\n1", output: "1", explanation: "Single element is the max subarray." },
        { input: "5\n-1 -2 -3 -4 -5", output: "-1", explanation: "The least negative single element is the max subarray." },
      ]),
      edgeCases: JSON.stringify([
        "All negative numbers: answer is the least negative (max single element)",
        "All positive numbers: sum of entire array",
        "Single element: n = 1, answer is that element",
        "Mixed with zeros at boundaries: [0, 5, 0] → answer is 5",
        "Maximum at the end: [-2, -1, -3, 10] → answer is 10",
        "Large numbers at constraint limits: avoid overflow",
      ]),
      hints: JSON.stringify([
        "This is Kadane's Algorithm — a classic dynamic programming problem.",
        "At each position, decide: start fresh from this element or extend the existing subarray?",
        "Track two values: max_ending_here (best subarray ending at current position) and max_so_far (global maximum).",
        "max_ending_here = max(nums[i], max_ending_here + nums[i])",
      ]),
      tags: JSON.stringify(["array", "dynamic-programming"]),
      companySlug: "amazon",
      topicSlug: "dynamic-programming",
      languageSlug: "python",

      bruteForceSolution: `Approach: Triple Nested Loops (O(n³))
Generate all possible subarrays and compute their sums.

Algorithm:
1. Initialize max_sum = -INFINITY
2. For each start index i from 0 to n-1:
   a. For each end index j from i to n-1:
      i. sum = 0
      ii. For k from i to j: sum += nums[k]
      iii. max_sum = max(max_sum, sum)
3. Return max_sum

This can be optimized to O(n²) by computing incremental sums instead of recalculating.`,

      optimalSolution: `Approach: Kadane's Algorithm (O(n))
At each position, decide: start a new subarray from current element, or extend the existing subarray.
This works because a negative prefix sum will only reduce any future sum, so we reset.

Algorithm:
1. Initialize max_so_far = nums[0], max_ending_here = nums[0]
2. For each num in nums[1:]:
   a. max_ending_here = max(num, max_ending_here + num)
   b. max_so_far = max(max_so_far, max_ending_here)
3. Return max_so_far`,

      complexityAnalysis: `Brute Force Approach:
• Time Complexity: O(n³) — triple nested loops (or O(n²) with optimized inner loop)
• Space Complexity: O(1) — no extra space

Optimal Approach (Kadane's Algorithm):
• Time Complexity: O(n) — single pass through the array
• Space Complexity: O(1) — only two variables regardless of input size

Divide & Conquer Approach:
• Time Complexity: O(n log n) — recursively split array
• Space Complexity: O(log n) — recursion stack`,

      dryRun: `Example: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]

Start: max_so_far = -2, max_ending_here = -2

i=1: num=1
  max_ending_here = max(1, -2+1) = max(1, -1) = 1
  max_so_far = max(-2, 1) = 1

i=2: num=-3
  max_ending_here = max(-3, 1+(-3)) = max(-3, -2) = -2
  max_so_far = max(1, -2) = 1

i=3: num=4
  max_ending_here = max(4, -2+4) = max(4, 2) = 4
  max_so_far = max(1, 4) = 4

i=4: num=-1
  max_ending_here = max(-1, 4+(-1)) = max(-1, 3) = 3
  max_so_far = max(4, 3) = 4

i=5: num=2
  max_ending_here = max(2, 3+2) = max(2, 5) = 5
  max_so_far = max(4, 5) = 5

i=6: num=1
  max_ending_here = max(1, 5+1) = max(1, 6) = 6
  max_so_far = max(5, 6) = 6

...Final: max_so_far = 6 ✓`,

      pseudoCode: `function maxSubArray(nums):
    maxSoFar = nums[0]
    maxEndingHere = nums[0]
    for i = 1 to len(nums)-1:
        maxEndingHere = max(nums[i], maxEndingHere + nums[i])
        maxSoFar = max(maxSoFar, maxEndingHere)
    return maxSoFar`,

      solutionJava: `public class Solution {
    public int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int maxEndingHere = nums[0];
        for (int i = 1; i < nums.length; i++) {
            maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
            maxSoFar = Math.max(maxSoFar, maxEndingHere);
        }
        return maxSoFar;
    }
}`,
      solutionPython: `def max_sub_array(nums):
    max_so_far = max_ending_here = nums[0]
    for num in nums[1:]:
        max_ending_here = max(num, max_ending_here + num)
        max_so_far = max(max_so_far, max_ending_here)
    return max_so_far`,
      solutionCpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSoFar = nums[0];
        int maxEndingHere = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            maxEndingHere = max(nums[i], maxEndingHere + nums[i]);
            maxSoFar = max(maxSoFar, maxEndingHere);
        }
        return maxSoFar;
    }
};`,
      solutionJavaScript: `function maxSubArray(nums) {
    let maxSoFar = nums[0];
    let maxEndingHere = nums[0];
    for (let i = 1; i < nums.length; i++) {
        maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }
    return maxSoFar;
}`,
      solutionGo: `func maxSubArray(nums []int) int {
    maxSoFar := nums[0]
    maxEndingHere := nums[0]
    for i := 1; i < len(nums); i++ {
        maxEndingHere = max(nums[i], maxEndingHere+nums[i])
        maxSoFar = max(maxSoFar, maxEndingHere)
    }
    return maxSoFar
}

func max(a, b int) int {
    if a > b { return a }
    return b
}`,
      solutionKotlin: `class Solution {
    fun maxSubArray(nums: IntArray): Int {
        var maxSoFar = nums[0]
        var maxEndingHere = nums[0]
        for (i in 1 until nums.size) {
            maxEndingHere = maxOf(nums[i], maxEndingHere + nums[i])
            maxSoFar = maxOf(maxSoFar, maxEndingHere)
        }
        return maxSoFar
    }
}`,
      testCases: JSON.stringify([
        { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expected: "6" },
        { input: "1\n1", expected: "1" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "5\n-1 -2 -3 -4 -5", expected: "-1" },
        { input: "5\n5 4 -1 7 8", expected: "23" },
        { input: "2\n-2 1", expected: "1" },
      ]),
      interviewTips: "Amazon loves this problem. Key follow-up discussions: (1) Can you return the actual subarray indices? (track start and end when max_ending_here resets) (2) Can you solve it with divide and conquer? (3) What if the array is circular? (LeetCode 918). Understanding the DP intuition (optimal substructure: optimal solution ending at i depends only on position i-1) is crucial.",
      commonMistakes: "Initializing max_so_far to 0 instead of nums[0] (fails for all-negative arrays). Using DP array O(n) space instead of O(1) variables. Not understanding the 'reset' condition — it's not about the sum being negative, but about whether starting fresh is better than extending. Forgetting to handle the all-negative edge case.",
    },

    // ═══════════════════════════════════════════════════
    //  6. MERGE TWO SORTED LISTS
    // ═══════════════════════════════════════════════════
    {
      title: "Merge Two Sorted Lists",
      slug: "merge-two-sorted-lists",
      difficulty: "easy",
      story: "You're building a data pipeline that merges two sorted log files into a single sorted output file for analysis.",
      problemStatement: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
      inputFormat: "First line: integer n m (sizes of list1 and list2).\nSecond line: n space-separated sorted integers.\nThird line: m space-separated sorted integers.",
      outputFormat: "n+m space-separated sorted integers representing the merged list.",
      constraints: "0 ≤ n, m ≤ 50\n-100 ≤ Node.val ≤ 100\nBoth lists are sorted in non-decreasing order.",
      examples: JSON.stringify([
        { input: "3 3\n1 2 4\n1 3 4", output: "1 1 2 3 4 4", explanation: "Both lists are merged into one sorted list." },
        { input: "1 1\n5\n5", output: "5 5", explanation: "Duplicate values are preserved." },
      ]),
      edgeCases: JSON.stringify([
        "Both empty: n=0, m=0 → return null",
        "One empty: n=0, m=3 → return list2 unchanged",
        "All values equal: [1, 1], [1, 1] → [1, 1, 1, 1]",
        "All values in list1 larger than list2: [10], [1,2,3] → [1,2,3,10]",
        "Maximum constraint size: n=50, m=50 → 100 nodes",
      ]),
      hints: JSON.stringify([
        "Use a dummy head node to simplify the merging logic — it avoids handling the head as a special case.",
        "Compare current nodes from both lists and append the smaller one.",
        "When one list is exhausted, append the remainder of the other list.",
      ]),
      tags: JSON.stringify(["linked-list"]),
      companySlug: "apple",
      topicSlug: "linked-list",
      languageSlug: "python",

      bruteForceSolution: `Approach: Collect and Sort (O((n+m) log(n+m)))
Traverse both lists, collect values into an array, sort the array, and build a new linked list.
This uses extra O(n+m) space and does unnecessary sorting on already sorted data.

Algorithm:
1. Initialize empty array values
2. While list1 != null: append list1.val; list1 = list1.next
3. While list2 != null: append list2.val; list2 = list2.next
4. Sort values array
5. Build new linked list from sorted values
6. Return head of new list`,

      optimalSolution: `Approach: Two-Pointer Iterative (O(n+m))
Leverage the fact that both lists are already sorted. Use two pointers to traverse both lists simultaneously, always picking the smaller element. No extra space needed.

Algorithm:
1. Create dummy node (sentinel) with value 0
2. tail = dummy
3. While both list1 and list2 are not null:
   a. If list1.val < list2.val: tail.next = list1; list1 = list1.next
   b. Else: tail.next = list2; list2 = list2.next
   c. tail = tail.next
4. Append remaining nodes: tail.next = list1 != null ? list1 : list2
5. Return dummy.next`,

      complexityAnalysis: `Collect and Sort Approach:
• Time Complexity: O((n+m) log(n+m)) — dominated by sorting
• Space Complexity: O(n+m) — array to store all values

Optimal Approach (Iterative):
• Time Complexity: O(n+m) — each node from both lists is visited exactly once
• Space Complexity: O(1) — only a few pointers, regardless of input size

Recursive Approach:
• Time Complexity: O(n+m)
• Space Complexity: O(n+m) — recursion stack depth`,

      dryRun: `Example: list1 = 1→2→4, list2 = 1→3→4

dummy = 0 (sentinel)
tail = dummy

Step 1: list1.val(1) >= list2.val(1) → take list2
  tail.next = 1, list2 = 3→4, tail = 1
Step 2: list1.val(1) < list2.val(3) → take list1
  tail.next = 1, list1 = 2→4, tail = 1
Step 3: list1.val(2) < list2.val(3) → take list1
  tail.next = 2, list1 = 4, tail = 2
Step 4: list1.val(4) >= list2.val(3) → take list2
  tail.next = 3, list2 = 4, tail = 3
Step 5: list1.val(4) >= list2.val(4) → take list2
  tail.next = 4, list2 = null, tail = 4
Step 6: list2 is null, append list1 → tail.next = 4

Result: 0 → 1 → 1 → 2 → 3 → 4 → 4
Return dummy.next = 1 → 1 → 2 → 3 → 4 → 4 ✓`,

      pseudoCode: `function mergeTwoLists(list1, list2):
    dummy = new ListNode(0)
    tail = dummy
    while list1 != null and list2 != null:
        if list1.val < list2.val:
            tail.next = list1
            list1 = list1.next
        else:
            tail.next = list2
            list2 = list2.next
        tail = tail.next
    tail.next = list1 != null ? list1 : list2
    return dummy.next`,

      solutionJava: `public class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val < list2.val) {
                tail.next = list1;
                list1 = list1.next;
            } else {
                tail.next = list2;
                list2 = list2.next;
            }
            tail = tail.next;
        }
        tail.next = (list1 != null) ? list1 : list2;
        return dummy.next;
    }
}`,
      solutionPython: `def merge_two_lists(list1, list2):
    dummy = ListNode(0)
    tail = dummy
    while list1 and list2:
        if list1.val < list2.val:
            tail.next = list1
            list1 = list1.next
        else:
            tail.next = list2
            list2 = list2.next
        tail = tail.next
    tail.next = list1 or list2
    return dummy.next`,
      solutionCpp: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (list1 && list2) {
            if (list1->val < list2->val) {
                tail->next = list1;
                list1 = list1->next;
            } else {
                tail->next = list2;
                list2 = list2->next;
            }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;
        return dummy.next;
    }
};`,
      solutionJavaScript: `function mergeTwoLists(list1, list2) {
    const dummy = new ListNode(0);
    let tail = dummy;
    while (list1 !== null && list2 !== null) {
        if (list1.val < list2.val) {
            tail.next = list1;
            list1 = list1.next;
        } else {
            tail.next = list2;
            list2 = list2.next;
        }
        tail = tail.next;
    }
    tail.next = list1 !== null ? list1 : list2;
    return dummy.next;
}`,
      solutionGo: `func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    dummy := &ListNode{Val: 0}
    tail := dummy
    for list1 != nil && list2 != nil {
        if list1.Val < list2.Val {
            tail.Next = list1
            list1 = list1.Next
        } else {
            tail.Next = list2
            list2 = list2.Next
        }
        tail = tail.Next
    }
    if list1 != nil {
        tail.Next = list1
    } else {
        tail.Next = list2
    }
    return dummy.Next
}`,
      solutionKotlin: `class Solution {
    fun mergeTwoLists(list1: ListNode?, list2: ListNode?): ListNode? {
        val dummy = ListNode(0)
        var tail = dummy
        var l1 = list1
        var l2 = list2
        while (l1 != null && l2 != null) {
            if (l1.val < l2.val) {
                tail.next = l1
                l1 = l1.next
            } else {
                tail.next = l2
                l2 = l2.next
            }
            tail = tail.next!!
        }
        tail.next = l1 ?: l2
        return dummy.next
    }
}`,
      testCases: JSON.stringify([
        { input: "3 3\n1 2 4\n1 3 4", expected: "1 1 2 3 4 4" },
        { input: "0 0\n\n", expected: "" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "1 1\n5\n5", expected: "5 5" },
        { input: "0 3\n\n1 2 3", expected: "1 2 3" },
        { input: "3 3\n1 2 3\n4 5 6", expected: "1 2 3 4 5 6" },
      ]),
      interviewTips: "Apple often asks this as a warm-up and follows up with merge k sorted lists (LeetCode 23). Key discussion: (1) The dummy node pattern is essential for linked list problems where the head might change. (2) The recursive solution is elegant: if(list1.val < list2.val) { list1.next = merge(list1.next, list2); return list1; }. (3) In-place merging saves memory.",
      commonMistakes: "Forgetting to advance the tail pointer after appending (infinite loop). Not handling the case where one list is null. Creating new nodes instead of splicing existing ones. Using > instead of >= (affects stability of merging). Forgetting the final append of remaining nodes from either list.",
    },

    // ═══════════════════════════════════════════════════
    //  7. BINARY SEARCH IN ROTATED SORTED ARRAY
    // ═══════════════════════════════════════════════════
    {
      title: "Search in Rotated Sorted Array",
      slug: "binary-search-rotated",
      difficulty: "hard",
      story: "A search index database had its pages rotated (offset by an unknown amount). Users still need to find records efficiently without a full scan.",
      problemStatement: "There is an integer array nums sorted in ascending order (with distinct values) that is rotated at an unknown pivot index. Given the array nums and an integer target, return the index of target if it is in nums, or -1 if it is not. Your algorithm must run in O(log n) time.",
      inputFormat: "First line: n target.\nSecond line: n space-separated integers (the rotated sorted array).",
      outputFormat: "Single integer — the index of target, or -1 if not found.",
      constraints: "1 ≤ n ≤ 5000\n-10^4 ≤ nums[i], target ≤ 10^4\nAll values in nums are unique.\nnums is guaranteed to be rotated at some pivot.",
      examples: JSON.stringify([
        { input: "7 0\n4 5 6 7 0 1 2", output: "4", explanation: "Target 0 is at index 4. The array rotated at pivot index 3." },
        { input: "7 3\n4 5 6 7 0 1 2", output: "-1", explanation: "Target 3 is not in the array." },
      ]),
      edgeCases: JSON.stringify([
        "Array not rotated (k=0): nums = [1,2,3,4,5], works like normal binary search",
        "Target at pivot: nums = [5,1,2,3,4], target=5 or target=1",
        "Single element: nums = [1], target=1 → 0, target=2 → -1",
        "Two elements rotated: nums = [2,1], target=1 → 1",
        "Target at the ends of the array",
      ]),
      hints: JSON.stringify([
        "Modify binary search — at each step, one half of the array is always sorted normally.",
        "Check which half is sorted: if nums[left] <= nums[mid], the left half is sorted.",
        "Once you identify the sorted half, check if the target lies within it.",
        "If the target is in the sorted half, search there; otherwise search the other half.",
      ]),
      tags: JSON.stringify(["array", "binary-search"]),
      companySlug: "microsoft",
      topicSlug: "binary-search",
      languageSlug: "python",

      bruteForceSolution: `Approach: Linear Search (O(n))
Simply scan the array from left to right until the target is found or the array is exhausted.
This does not meet the O(log n) requirement and will fail follow-up interviews.

Algorithm:
1. For i from 0 to n-1:
   a. If nums[i] == target: return i
2. Return -1`,

      optimalSolution: `Approach: Modified Binary Search (O(log n))
In a rotated sorted array, at each step, at least one half (left or right) is completely sorted.
Determine which half is sorted and check if the target lies within it.

Algorithm:
1. left = 0, right = n-1
2. While left <= right:
   a. mid = left + (right - left) / 2
   b. If nums[mid] == target: return mid
   c. If nums[left] <= nums[mid]: (left half is sorted)
      i. If nums[left] <= target < nums[mid]: right = mid - 1
      ii. Else: left = mid + 1
   d. Else: (right half is sorted)
      i. If nums[mid] < target <= nums[right]: left = mid + 1
      ii. Else: right = mid - 1
3. Return -1`,

      complexityAnalysis: `Linear Search Approach:
• Time Complexity: O(n) — scans entire array in worst case
• Space Complexity: O(1) — constant extra space

Optimal Approach (Modified Binary Search):
• Time Complexity: O(log n) — halves the search space at each step
• Space Complexity: O(1) — only three pointers

Important Note: Finding the pivot first (O(log n)) then searching the appropriate half (O(log n)) is another valid approach, but the single-pass modified binary search shown above is cleaner.`,

      dryRun: `Example: nums = [4,5,6,7,0,1,2], target = 0

Step 1: left=0, right=6, mid=3
  nums[3]=7 != 0
  nums[0]=4 <= nums[3]=7 → left half sorted [4,5,6,7]
  Is target(0) in [4,7]? No. Go to right half.
  left = mid+1 = 4

Step 2: left=4, right=6, mid=5
  nums[5]=1 != 0
  nums[4]=0 <= nums[5]=1 → left half sorted [0,1]
  Is target(0) in [0,1]? Yes! Search left.
  right = mid-1 = 4

Step 3: left=4, right=4, mid=4
  nums[4]=0 == 0 → return 4 ✓`,

      pseudoCode: `function search(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target: return mid
        if nums[left] <= nums[mid]:  # left half sorted
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:  # right half sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1`,

      solutionJava: `public class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[left] <= nums[mid]) {
                if (nums[left] <= target && target < nums[mid]) right = mid - 1;
                else left = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[right]) left = mid + 1;
                else right = mid - 1;
            }
        }
        return -1;
    }
}`,
      solutionPython: `def search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target: return mid
        if nums[left] <= nums[mid]:  # left half sorted
            if nums[left] <= target < nums[mid]: right = mid - 1
            else: left = mid + 1
        else:  # right half sorted
            if nums[mid] < target <= nums[right]: left = mid + 1
            else: right = mid - 1
    return -1`,
      solutionCpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[left] <= nums[mid]) {
                if (nums[left] <= target && target < nums[mid]) right = mid - 1;
                else left = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[right]) left = mid + 1;
                else right = mid - 1;
            }
        }
        return -1;
    }
};`,
      solutionJavaScript: `function search(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        if (nums[mid] === target) return mid;
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}`,
      solutionGo: `func search(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2
        if nums[mid] == target { return mid }
        if nums[left] <= nums[mid] {
            if nums[left] <= target && target < nums[mid] {
                right = mid - 1
            } else {
                left = mid + 1
            }
        } else {
            if nums[mid] < target && target <= nums[right] {
                left = mid + 1
            } else {
                right = mid - 1
            }
        }
    }
    return -1
}`,
      solutionKotlin: `class Solution {
    fun search(nums: IntArray, target: Int): Int {
        var left = 0
        var right = nums.size - 1
        while (left <= right) {
            val mid = left + (right - left) / 2
            if (nums[mid] == target) return mid
            if (nums[left] <= nums[mid]) {
                if (nums[left] <= target && target < nums[mid]) right = mid - 1
                else left = mid + 1
            } else {
                if (nums[mid] < target && target <= nums[right]) left = mid + 1
                else right = mid - 1
            }
        }
        return -1
    }
}`,
      testCases: JSON.stringify([
        { input: "7 0\n4 5 6 7 0 1 2", expected: "4" },
        { input: "7 3\n4 5 6 7 0 1 2", expected: "-1" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "1 1\n1", expected: "0" },
        { input: "2 2\n3 1", expected: "-1" },
        { input: "5 5\n5 1 2 3 4", expected: "0" },
        { input: "5 4\n5 1 2 3 4", expected: "4" },
      ]),
      interviewTips: "Microsoft often asks this as a twist on classic binary search. Key discussion points: (1) What if duplicates are allowed? (LeetCode 81) (2) The condition uses <= not < for the left half check because when left==mid, the left half has one element. (3) Alternative approach: find pivot with binary search first, then binary search the correct half. Be fluent in both approaches.",
      commonMistakes: "Using < instead of <= in the condition 'if nums[left] <= nums[mid]' — this fails when left==mid (i.e., two elements remain). Not checking boundary conditions properly (the target range check must use <= on the low end and < on the high end to avoid infinite loops). Forgetting that the array has distinct values (the problem guarantees this).",
    },

    // ═══════════════════════════════════════════════════
    //  8. INVERT BINARY TREE
    // ═══════════════════════════════════════════════════
    {
      title: "Invert Binary Tree",
      slug: "invert-binary-tree",
      difficulty: "easy",
      story: "You're building a photo editing app that needs to mirror image tree structures horizontally.",
      problemStatement: "Given the root of a binary tree, invert the tree (swap every left and right child) and return its root.",
      inputFormat: "Level-order traversal of the tree (space-separated integers, using -1 for null nodes).",
      outputFormat: "Level-order traversal of the inverted tree.",
      constraints: "0 ≤ nodes ≤ 100\n-100 ≤ Node.val ≤ 100",
      examples: JSON.stringify([
        { input: "4 2 7 1 3 6 9", output: "4 7 2 9 6 3 1", explanation: "Left and right children are swapped at every node. The tree is mirrored vertically." },
        { input: "1", output: "1", explanation: "Single node remains unchanged." },
      ]),
      edgeCases: JSON.stringify([
        "Empty tree (root = null): return null",
        "Single node: unchanged",
        "Unbalanced tree: root with only left child, invert to only right child",
        "Deep tree (up to 100 nodes): ensure recursion depth is safe or use iterative approach",
        "All nodes on one side: a left-skewed tree becomes right-skewed",
      ]),
      hints: JSON.stringify([
        "This is a classic recursive problem — swap the children and recurse on each.",
        "The base case is simple: if root is null, return null.",
        "For the iterative approach, use a queue (BFS) or stack (DFS).",
      ]),
      tags: JSON.stringify(["tree", "recursion"]),
      companySlug: "netflix",
      topicSlug: "tree",
      languageSlug: "python",

      bruteForceSolution: `Approach: Level-Order Rebuild (O(n) time, O(n) space)
Traverse the tree level by level, collect values, then rebuild the tree with swapped children.
This is unnecessarily complex and uses extra space.

Algorithm:
1. BFS traversal to collect all node values
2. Rebuild the tree in inverted order
(Not recommended — the in-place solution is much simpler)`,

      optimalSolution: `Approach: Recursive DFS (O(n) time, O(h) space where h is height)
Swap the left and right children of each node recursively.

Algorithm (Recursive):
1. If root is null: return null
2. Swap left and right child: temp = root.left; root.left = root.right; root.right = temp
3. Recursively invert left subtree: invertTree(root.left)
4. Recursively invert right subtree: invertTree(root.right)
5. Return root

Algorithm (Iterative using Stack):
1. If root is null: return null
2. Push root onto stack
3. While stack is not empty:
   a. Pop node from stack
   b. Swap its left and right children
   c. Push children onto stack (if not null)
4. Return root`,

      complexityAnalysis: `Recursive Approach:
• Time Complexity: O(n) — every node is visited exactly once
• Space Complexity: O(h) where h is height of tree — recursion stack
  - Best case (balanced tree): O(log n)
  - Worst case (skewed tree): O(n)

Iterative Approach:
• Time Complexity: O(n)
• Space Complexity: O(n) — stack/queue can hold up to n nodes`,

      dryRun: `Example: Tree:    4        Inverted:   4
                  /   \                /   \
                 2     7    →         7     2
                / \   / \            / \   / \
               1   3 6   9          9   6 3   1

Step 1: root=4, swap children: left=7, right=2
Step 2: go to left child (7): swap children: left=9, right=6
Step 3: go to left child (9): both null, return
Step 4: go to right child (6): both null, return
Step 5: back to root, go to right child (2): swap children: left=3, right=1
Step 6: go to left child (3): both null, return
Step 7: go to right child (1): both null, return

Level-order of inverted tree: 4 7 2 9 6 3 1 ✓`,

      pseudoCode: `function invertTree(root):
    if root == null: return null
    
    # Swap children
    temp = root.left
    root.left = root.right
    root.right = temp
    
    # Recurse
    invertTree(root.left)
    invertTree(root.right)
    
    return root`,

      solutionJava: `public class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode temp = root.left;
        root.left = root.right;
        root.right = temp;
        invertTree(root.left);
        invertTree(root.right);
        return root;
    }
}`,
      solutionPython: `def invert_tree(root):
    if not root: return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root`,
      solutionCpp: `class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* temp = root->left;
        root->left = invertTree(root->right);
        root->right = invertTree(temp);
        return root;
    }
};`,
      solutionJavaScript: `function invertTree(root) {
    if (root === null) return null;
    const temp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(temp);
    return root;
}`,
      solutionGo: `func invertTree(root *TreeNode) *TreeNode {
    if root == nil { return nil }
    root.Left, root.Right = invertTree(root.Right), invertTree(root.Left)
    return root
}`,
      solutionKotlin: `class Solution {
    fun invertTree(root: TreeNode?): TreeNode? {
        if (root == null) return null
        val temp = root.left
        root.left = invertTree(root.right)
        root.right = invertTree(temp)
        return root
    }
}`,
      testCases: JSON.stringify([
        { input: "4 2 7 1 3 6 9", expected: "4 7 2 9 6 3 1" },
        { input: "1", expected: "1" },
      ]),
      hiddenTestCases: JSON.stringify([
        { input: "", expected: "" },
        { input: "1 2 -1 3 -1", expected: "1 -1 2 -1 3" },
        { input: "1 2 3", expected: "1 3 2" },
      ]),
      interviewTips: "Netflix occasionally asks tree problems. This problem went viral as the '6 lines of code' interview question. Key discussion: (1) This can be solved with BFS using a queue — the iterative approach. (2) Swap can be done before (pre-order) or after (post-order) recursion — both work. (3) The problem tests whether you understand tree recursion fundamentals. Most candidates overthink it.",
      commonMistakes: "Not handling the null case first (base case for recursion). Swapping children but not recursing (only swaps at root level). Swapping after recursion instead of before (post-order vs pre-order — both actually work for this specific problem, but pre-order is more intuitive). Forgetting to return the root at the end.",
    },
  ];

  // ── Seed Problems into Database ──
  for (const p of problems) {
    const existing = await prisma.codingProblem.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      const company = p.companySlug ? await prisma.company.findUnique({ where: { slug: p.companySlug } }) : null;
      const topic = p.topicSlug ? await prisma.topic.findUnique({ where: { slug: p.topicSlug } }) : null;
      const langId = await getLangId(p.languageSlug);

      await prisma.codingProblem.create({
        data: {
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty as any,
          story: p.story,
          problemStatement: p.problemStatement,
          inputFormat: p.inputFormat,
          outputFormat: p.outputFormat,
          constraints: p.constraints,
          examples: p.examples,
          edgeCases: p.edgeCases,
          hints: p.hints,
          tags: p.tags,
          testCases: p.testCases,
          hiddenTestCases: p.hiddenTestCases,
          bruteForceSolution: p.bruteForceSolution,
          optimalSolution: p.optimalSolution,
          complexityAnalysis: p.complexityAnalysis,
          dryRun: p.dryRun,
          pseudoCode: p.pseudoCode,
          solutionJava: p.solutionJava,
          solutionPython: p.solutionPython,
          solutionCpp: p.solutionCpp,
          solutionJavaScript: p.solutionJavaScript,
          solutionGo: p.solutionGo,
          solutionKotlin: p.solutionKotlin,
          interviewTips: p.interviewTips,
          commonMistakes: p.commonMistakes,
          companyId: company?.id || null,
          topicId: topic?.id || null,
          languageId: langId,
          status: "published",
        },
      });
      console.log(`  ✅ Problem: ${p.title}`);
    } else {
      console.log(`  ℹ️  Skipped (exists): ${p.title}`);
    }
  }

  console.log("\n✨ Coding Interview Platform seed complete!");
  console.log(`   ${languages.length} languages`);
  console.log(`   ${companies.length} companies`);
  console.log(`   ${topics.length} topics`);
  console.log(`   ${problems.length} sample problems`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
