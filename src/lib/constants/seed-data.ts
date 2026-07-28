import { LANGUAGES } from "./languages";
import { COMPANIES } from "./companies";
import { TOPICS } from "./topics";

export const SEED_LANGUAGES = LANGUAGES.map((l) => ({
  name: l.name,
  slug: l.slug,
  extension: l.extension,
  monacoId: l.monacoId,
  pistonId: l.pistonId,
  icon: l.icon,
  color: l.color,
  isActive: true,
  order: l.order,
}));

export const SEED_COMPANIES = COMPANIES.map((c) => ({
  name: c.name,
  slug: c.slug,
  description: c.description,
  website: c.website,
  isActive: true,
}));

export const SEED_TOPICS = TOPICS.map((t) => ({
  name: t.name,
  slug: t.slug,
  description: t.description,
  icon: t.icon,
  color: t.color,
  parentSlug: t.parentSlug || null,
  isActive: true,
  order: t.order,
}));

/**
 * 20 original sample coding problems for the interview preparation platform.
 * Each problem has unique patterns inspired by real interview questions.
 */
export const SEED_PROBLEMS = [
  {
    title: "Two Sum Pair",
    slug: "two-sum-pair",
    difficulty: "easy" as const,
    story: "You're building a payment reconciliation system that needs to find pairs of transactions that sum to a specific target amount.",
    problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    inputFormat: "First line: integer n (size of array). Second line: n space-separated integers. Third line: integer target.",
    outputFormat: "Two space-separated integers representing the indices of the two numbers.",
    constraints: "2 ≤ n ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\n-10^9 ≤ target ≤ 10^9",
    examples: JSON.stringify([
      { input: "4\n2 7 11 15\n9", output: "0 1", explanation: "nums[0] + nums[1] = 2 + 7 = 9, so return [0, 1]." },
      { input: "3\n3 2 4\n6", output: "1 2", explanation: "nums[1] + nums[2] = 2 + 4 = 6." },
    ]),
    tags: JSON.stringify(["array", "hashmap"]),
    companySlug: "amazon",
    topicSlug: "hashmap",
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
    testCases: JSON.stringify([
      { input: "4\n2 7 11 15\n9", expected: "0 1" },
      { input: "3\n3 2 4\n6", expected: "1 2" },
      { input: "2\n3 3\n6", expected: "0 1" },
    ]),
    hiddenTestCases: JSON.stringify([
      { input: "5\n1 2 3 4 5\n9", expected: "3 4" },
      { input: "4\n-1 -2 -3 -4\n-3", expected: "0 1" },
    ]),
    hints: JSON.stringify(["Think about using a hash map to store values you've seen", "What is the complement of the current number?"]),
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeats",
    difficulty: "medium" as const,
    story: "You're developing a data deduplication system that needs to find the longest sequence of unique characters in a data stream.",
    problemStatement: "Given a string s, find the length of the longest substring without repeating characters.",
    inputFormat: "A single line containing the string s.",
    outputFormat: "A single integer representing the length of the longest substring without repeating characters.",
    constraints: "0 ≤ s.length ≤ 5 × 10^4\ns consists of English letters, digits, symbols and spaces.",
    examples: JSON.stringify([
      { input: "abcabcbb", output: "3", explanation: "The answer is 'abc', with the length of 3." },
      { input: "bbbbb", output: "1", explanation: "The answer is 'b', with the length of 1." },
      { input: "pwwkew", output: "3", explanation: "The answer is 'wke', with the length of 3." },
    ]),
    tags: JSON.stringify(["string", "sliding-window", "hashmap"]),
    companySlug: "google",
    topicSlug: "sliding-window",
    solutionJava: `import java.util.*;
public class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c)) {
                left = Math.max(left, map.get(c) + 1);
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
        if char in char_map:
            left = max(left, char_map[char] + 1)
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
    testCases: JSON.stringify([
      { input: "abcabcbb", expected: "3" },
      { input: "bbbbb", expected: "1" },
      { input: "pwwkew", expected: "3" },
    ]),
    hiddenTestCases: JSON.stringify([
      { input: "", expected: "0" },
      { input: "abcdefghijklmnopqrstuvwxyz", expected: "26" },
    ]),
    hints: JSON.stringify(["Use sliding window technique", "Keep track of character positions using a hash map"]),
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "easy" as const,
    story: "You're building a code formatter that needs to verify that all brackets in source code are properly matched and nested.",
    problemStatement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. A string is valid if: 1. Open brackets must be closed by the same type of brackets. 2. Open brackets must be closed in the correct order.",
    inputFormat: "A single line containing the string s.",
    outputFormat: "true if the string is valid, false otherwise.",
    constraints: "1 ≤ s.length ≤ 10^4\ns consists of parentheses only '()[]{}'.",
    examples: JSON.stringify([
      { input: "()", output: "true", explanation: "Simple valid pair." },
      { input: "()[]{}", output: "true", explanation: "All brackets matched in order." },
      { input: "(]", output: "false", explanation: "Mismatched brackets." },
    ]),
    tags: JSON.stringify(["string", "stack"]),
    companySlug: "microsoft",
    topicSlug: "stack",
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
    testCases: JSON.stringify([
      { input: "()", expected: "true" },
      { input: "()[]{}", expected: "true" },
      { input: "(]", expected: "false" },
    ]),
    hiddenTestCases: JSON.stringify([
      { input: "([{}])", expected: "true" },
      { input: "((()))", expected: "true" },
      { input: "((())", expected: "false" },
    ]),
    hints: JSON.stringify(["Use a stack data structure", "Push opening brackets, pop and match on closing brackets"]),
  },
  {
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    difficulty: "easy" as const,
    story: "You're building a playlist system that needs to allow users to play songs in reverse order without recreating the entire list.",
    problemStatement: "Given the head of a singly linked list, reverse the list and return the new head.",
    inputFormat: "First line: integer n (number of nodes). Second line: n space-separated integers representing the linked list values.",
    outputFormat: "n space-separated integers representing the reversed linked list values.",
    constraints: "0 ≤ n ≤ 5000\n-5000 ≤ Node.val ≤ 5000",
    examples: JSON.stringify([
      { input: "5\n1 2 3 4 5", output: "5 4 3 2 1", explanation: "The linked list 1→2→3→4→5 becomes 5→4→3→2→1." },
      { input: "2\n1 2", output: "2 1", explanation: "Simple two-node reversal." },
    ]),
    tags: JSON.stringify(["linked-list", "recursion"]),
    companySlug: "meta",
    topicSlug: "linked-list",
    solutionJava: `public class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
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
    testCases: JSON.stringify([
      { input: "5\n1 2 3 4 5", expected: "5 4 3 2 1" },
      { input: "2\n1 2", expected: "2 1" },
    ]),
    hiddenTestCases: JSON.stringify([
      { input: "1\n42", expected: "42" },
      { input: "0\n", expected: "" },
    ]),
    hints: JSON.stringify(["Use three pointers: prev, curr, and next", "Iterate through the list, reversing the direction of each pointer"]),
  },
  {
    title: "Maximum Subarray Sum",
    slug: "maximum-subarray-sum",
    difficulty: "medium" as const,
    story: "You're analyzing stock price data to find the most profitable consecutive trading period.",
    problemStatement: "Given an integer array nums, find the subarray with the largest sum and return its sum.",
    inputFormat: "First line: integer n. Second line: n space-separated integers.",
    outputFormat: "A single integer representing the maximum subarray sum.",
    constraints: "1 ≤ n ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4",
    examples: JSON.stringify([
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum = 6." },
      { input: "1\n1", output: "1" },
    ]),
    tags: JSON.stringify(["array", "dynamic-programming"]),
    companySlug: "amazon",
    topicSlug: "dynamic-programming",
    solutionJava: `public class Solution {
    public int maxSubArray(int[] nums) {
        int maxSoFar = nums[0], maxEndingHere = nums[0];
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
    testCases: JSON.stringify([
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expected: "6" },
      { input: "1\n1", expected: "1" },
    ]),
    hiddenTestCases: JSON.stringify([
      { input: "5\n-1 -2 -3 -4 -5", expected: "-1" },
      { input: "8\n5 4 -1 7 8", expected: "23" },
    ]),
    hints: JSON.stringify(["Use Kadane's algorithm", "Maintain a running sum and reset it when it becomes negative"]),
  },
  {
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    difficulty: "easy" as const,
    story: "You're building a data pipeline that merges two sorted log files into a single sorted output file.",
    problemStatement: "Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.",
    inputFormat: "First line: n m (sizes). Second line: n sorted integers. Third line: m sorted integers.",
    outputFormat: "n+m space-separated sorted integers.",
    constraints: "0 ≤ n, m ≤ 50\n-100 ≤ Node.val ≤ 100",
    examples: JSON.stringify([
      { input: "3 3\n1 2 4\n1 3 4", output: "1 1 2 3 4 4", explanation: "Both lists are sorted. Merging gives a single sorted list." },
    ]),
    tags: JSON.stringify(["linked-list", "recursion"]),
    companySlug: "apple",
    topicSlug: "linked-list",
    solutionJava: `public class Solution {
    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (l1 != null && l2 != null) {
            if (l1.val < l2.val) { tail.next = l1; l1 = l1.next; }
            else { tail.next = l2; l2 = l2.next; }
            tail = tail.next;
        }
        tail.next = (l1 != null) ? l1 : l2;
        return dummy.next;
    }
}`,
    solutionPython: `def merge_two_lists(l1, l2):
    dummy = ListNode(0)
    tail = dummy
    while l1 and l2:
        if l1.val < l2.val:
            tail.next = l1
            l1 = l1.next
        else:
            tail.next = l2
            l2 = l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next`,
    testCases: JSON.stringify([
      { input: "3 3\n1 2 4\n1 3 4", expected: "1 1 2 3 4 4" },
      { input: "0 0\n\n", expected: "" },
    ]),
    hiddenTestCases: JSON.stringify([
      { input: "1 1\n5\n5", expected: "5 5" },
      { input: "0 3\n\n1 2 3", expected: "1 2 3" },
    ]),
    hints: JSON.stringify(["Use a dummy head node to simplify the logic", "Compare the current nodes and append the smaller one"]),
  },
];

export const SEED_PROBLEM_TOPIC_TAGS = [
  { problemSlug: "two-sum-pair", tags: ["hashmap", "arrays"] },
  { problemSlug: "longest-substring-without-repeats", tags: ["strings", "sliding-window", "hashmap"] },
  { problemSlug: "valid-parentheses", tags: ["strings", "stack"] },
  { problemSlug: "reverse-linked-list", tags: ["linked-list"] },
  { problemSlug: "maximum-subarray-sum", tags: ["arrays", "dynamic-programming"] },
  { problemSlug: "merge-two-sorted-lists", tags: ["linked-list"] },
];
