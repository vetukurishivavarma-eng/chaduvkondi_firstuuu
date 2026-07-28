import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// POST /api/interviews — Create a new mock interview
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      companySlug,
      experienceYears = 2,
      durationMinutes = 60,
      title,
    } = body;

    if (!companySlug) {
      return errorResponse("Company is required", 400);
    }

    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      return errorResponse("Company not found", 400);
    }

    const interviewTitle = title || `${company.name} Mock Interview`;

    // Fetch coding problems for this company (up to 2 for coding problems)
    const companyProblems = await prisma.codingProblem.findMany({
      where: {
        companyId: company.id,
        status: "published",
      },
      take: 2,
      orderBy: { totalSubmissions: "desc" },
    });

    // Generate MCQ questions based on experience level
    const mcqQuestions = generateMcqQuestions(company.name, experienceYears);
    const sqlQuestions = generateSqlQuestions(company.name);
    const debuggingQuestions = generateDebuggingQuestions(company.name);
    const outputPredictionQuestions = generateOutputPredictionQuestions(company.name);
    const lldQuestions = generateLldQuestions(company.name);
    const systemDesignQuestions = generateSystemDesignQuestions(company.name, experienceYears);

    // Select which problem types to include based on duration
    const allQuestionTypes = [
      ...(companyProblems.length > 0 ? [{ type: "coding" as const, problems: companyProblems }] : []),
      { type: "mcq" as const, items: mcqQuestions },
      { type: "sql" as const, items: sqlQuestions },
      { type: "debugging" as const, items: debuggingQuestions },
      { type: "output_prediction" as const, items: outputPredictionQuestions },
      { type: "lld" as const, items: lldQuestions },
      { type: "system_design" as const, items: systemDesignQuestions },
    ];

    // Distribute items across the duration
    const interview = await prisma.mockInterview.create({
      data: {
        userId: session.id,
        title: interviewTitle,
        companyId: company.id,
        experienceYears,
        durationMinutes,
        status: "pending",
      },
    });

    // Add coding problems
    for (let i = 0; i < companyProblems.length; i++) {
      await prisma.interviewProblem.create({
        data: {
          interviewId: interview.id,
          problemId: companyProblems[i].id,
          order: i,
        },
      });
    }

    // Add MCQ questions
    let orderOffset = companyProblems.length;
    for (let i = 0; i < mcqQuestions.length; i++) {
      await prisma.interviewQuestion.create({
        data: {
          interviewId: interview.id,
          questionText: mcqQuestions[i].text,
          type: "mcq",
          choices: JSON.stringify(mcqQuestions[i].choices),
          correctAnswer: mcqQuestions[i].correctAnswer,
          explanation: mcqQuestions[i].explanation,
          order: orderOffset + i,
        },
      });
    }
    orderOffset += mcqQuestions.length;

    // Add SQL questions
    for (let i = 0; i < sqlQuestions.length; i++) {
      await prisma.interviewQuestion.create({
        data: {
          interviewId: interview.id,
          questionText: sqlQuestions[i].text,
          type: "sql",
          choices: JSON.stringify(sqlQuestions[i].choices),
          correctAnswer: sqlQuestions[i].correctAnswer,
          explanation: sqlQuestions[i].explanation,
          order: orderOffset + i,
        },
      });
    }
    orderOffset += sqlQuestions.length;

    // Add debugging questions
    for (let i = 0; i < debuggingQuestions.length; i++) {
      await prisma.interviewQuestion.create({
        data: {
          interviewId: interview.id,
          questionText: debuggingQuestions[i].text,
          type: "debugging",
          choices: JSON.stringify(debuggingQuestions[i].choices),
          correctAnswer: debuggingQuestions[i].correctAnswer,
          explanation: debuggingQuestions[i].explanation,
          order: orderOffset + i,
        },
      });
    }
    orderOffset += debuggingQuestions.length;

    // Add output prediction questions
    for (let i = 0; i < outputPredictionQuestions.length; i++) {
      await prisma.interviewQuestion.create({
        data: {
          interviewId: interview.id,
          questionText: outputPredictionQuestions[i].text,
          type: "output_prediction",
          choices: JSON.stringify(outputPredictionQuestions[i].choices),
          correctAnswer: outputPredictionQuestions[i].correctAnswer,
          explanation: outputPredictionQuestions[i].explanation,
          order: orderOffset + i,
        },
      });
    }
    orderOffset += outputPredictionQuestions.length;

    // Add LLD questions
    for (let i = 0; i < lldQuestions.length; i++) {
      await prisma.interviewQuestion.create({
        data: {
          interviewId: interview.id,
          questionText: lldQuestions[i].text,
          type: "lld",
          choices: JSON.stringify(lldQuestions[i].choices),
          correctAnswer: lldQuestions[i].correctAnswer,
          explanation: lldQuestions[i].explanation,
          order: orderOffset + i,
        },
      });
    }
    orderOffset += lldQuestions.length;

    // Add system design questions
    for (let i = 0; i < systemDesignQuestions.length; i++) {
      await prisma.interviewQuestion.create({
        data: {
          interviewId: interview.id,
          questionText: systemDesignQuestions[i].text,
          type: "system_design",
          choices: JSON.stringify(systemDesignQuestions[i].choices),
          correctAnswer: systemDesignQuestions[i].correctAnswer,
          explanation: systemDesignQuestions[i].explanation,
          order: orderOffset + i,
        },
      });
    }

    return successResponse({
      id: interview.id,
      title: interviewTitle,
      company: company.name,
      status: "pending",
      problemCount: companyProblems.length,
      questionCount: mcqQuestions.length + sqlQuestions.length + debuggingQuestions.length +
        outputPredictionQuestions.length + lldQuestions.length + systemDesignQuestions.length,
      durationMinutes,
    });
  } catch (error) {
    console.error("Create interview error:", error);
    return handleApiError(error);
  }
}

// GET /api/interviews — List user's mock interviews
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const interviews = await prisma.mockInterview.findMany({
      where: { userId: session.id },
      include: {
        company: { select: { name: true, slug: true, logoUrl: true } },
        _count: { select: { problems: true, questions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return successResponse(
      interviews.map((i) => ({
        id: i.id,
        title: i.title,
        company: i.company,
        status: i.status,
        score: i.score,
        experienceYears: i.experienceYears,
        durationMinutes: i.durationMinutes,
        codingProblems: i._count.problems,
        totalQuestions: i._count.questions,
        startedAt: i.startedAt?.toISOString() || null,
        completedAt: i.completedAt?.toISOString() || null,
        createdAt: i.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("List interviews error:", error);
    return handleApiError(error);
  }
}

// ── Question Generators ──

function generateMcqQuestions(company: string, _exp: number) {
  return [
    {
      text: `In ${company}'s tech stack, which data structure would you use to implement a Least Recently Used (LRU) cache?`,
      choices: [
        { id: "a", text: "HashMap + Doubly Linked List" },
        { id: "b", text: "Array + Binary Search Tree" },
        { id: "c", text: "Queue + Stack" },
        { id: "d", text: "HashSet + TreeMap" },
      ],
      correctAnswer: "a",
      explanation: "LRU cache requires O(1) get and put operations. HashMap provides O(1) lookup, while Doubly Linked List enables O(1) removal and insertion at the head/tail. This combination is the standard LRU implementation used in production systems like Redis.",
    },
    {
      text: `What is the time complexity to find the median of two sorted arrays of sizes m and n?`,
      choices: [
        { id: "a", text: "O(m + n)" },
        { id: "b", text: "O(log(m + n))" },
        { id: "c", text: "O(m * n)" },
        { id: "d", text: "O(min(m, n))" },
      ],
      correctAnswer: "b",
      explanation: "Using binary search on the smaller array, we can find the correct partition that divides both arrays into left and right halves with equal elements. This achieves O(log(min(m, n))) time, which is optimal. This is a favorite question at top tech companies.",
    },
    {
      text: `Which design pattern is used by Java's Collections.sort() method that allows different sorting behaviors?`,
      choices: [
        { id: "a", text: "Factory Pattern" },
        { id: "b", text: "Observer Pattern" },
        { id: "c", text: "Strategy Pattern" },
        { id: "d", text: "Decorator Pattern" },
      ],
      correctAnswer: "c",
      explanation: "The Strategy pattern allows selecting an algorithm at runtime. Collections.sort() accepts a Comparator, which is a Strategy for sorting. Different Comparators define different sorting strategies without changing the sort method itself. This is a classic example of the Strategy pattern in the Java Collections Framework.",
    },
    {
      text: `In a distributed system like ${company}'s infrastructure, what consistency model does Amazon's DynamoDB use by default?`,
      choices: [
        { id: "a", text: "Strong Consistency" },
        { id: "b", text: "Eventual Consistency" },
        { id: "c", text: "Linearizable Consistency" },
        { id: "d", text: "Causal Consistency" },
      ],
      correctAnswer: "b",
      explanation: "DynamoDB uses eventual consistency for its default read mode, providing high availability and partition tolerance as per the CAP theorem. It also offers strongly consistent reads as an optional feature, but at the cost of higher latency and lower availability during network partitions.",
    },
    {
      text: `What happens when you execute 'git rebase' on a branch?`,
      choices: [
        { id: "a", text: "Merges the current branch into the target branch" },
        { id: "b", text: "Reapplies commits from the current branch on top of the target branch's tip" },
        { id: "c", text: "Creates a new merge commit combining both branches" },
        { id: "d", text: "Deletes the current branch after merging" },
      ],
      correctAnswer: "b",
      explanation: "Git rebase rewrites commit history by taking commits from the current branch and replaying them one by one on top of the target branch's latest commit. This creates a linear history without merge commits. However, it should never be used on shared branches as it rewrites history.",
    },
  ];
}

function generateSqlQuestions(company: string) {
  return [
    {
      text: `${company} has an employees table with columns: id, name, department_id, salary. Write a query to find the top 3 highest-paid employees in each department.`,
      choices: [
        { id: "a", text: "SELECT * FROM employees ORDER BY salary DESC LIMIT 3 PER department_id" },
        { id: "b", text: "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as rn FROM employees) WHERE rn <= 3" },
        { id: "c", text: "SELECT TOP 3 salary FROM employees GROUP BY department_id" },
        { id: "d", text: "SELECT MAX(salary) FROM employees GROUP BY department_id LIMIT 3" },
      ],
      correctAnswer: "b",
      explanation: "The correct approach uses ROW_NUMBER() with PARTITION BY department_id and ORDER BY salary DESC to rank employees within each department. The outer query then filters for rank <= 3. This is a classic 'Top N per Group' problem that appears frequently in SQL interviews.",
    },
    {
      text: `Which SQL index type is most efficient for queries with both equality and range conditions, such as 'WHERE status = 'active' AND created_at > '2024-01-01''?`,
      choices: [
        { id: "a", text: "Hash index on status" },
        { id: "b", text: "B-tree composite index on (status, created_at)" },
        { id: "c", text: "Bitmap index on created_at" },
        { id: "d", text: "Full-text index on status" },
      ],
      correctAnswer: "b",
      explanation: "A B-tree composite index with the equality column first (status) followed by the range column (created_at) is most efficient. The database first matches the exact status, then uses the B-tree's sorted structure for efficient range scanning on created_at. Hash indexes only support equality lookups.",
    },
  ];
}

function generateDebuggingQuestions(company: string) {
  return [
    {
      text: `${company}'s developer wrote this code to reverse a linked list. What is the bug?\n\nfunction reverseList(head) {\n  let prev = null;\n  let curr = head;\n  while (curr) {\n    let next = curr.next;\n    prev = curr;\n    curr = next;\n    curr.next = prev;\n  }\n  return prev;\n}`,
      choices: [
        { id: "a", text: "The function doesn't handle empty lists" },
        { id: "b", text: "'curr.next = prev' is placed after advancing curr, causing null pointer" },
        { id: "c", text: "The return value should be 'head' instead of 'prev'" },
        { id: "d", text: "The loop condition should be 'curr.next' instead of 'curr'" },
      ],
      correctAnswer: "b",
      explanation: "The bug is that 'curr.next = prev' is executed after 'curr = next'. At this point, curr points to the next node (or null for the last node). Setting curr.next = prev after advancing breaks the pointer of the wrong node. The correct order is: save next, set curr.next = prev, move prev to curr, then advance curr to next.",
    },
    {
      text: `What is wrong with this binary search implementation?\n\nfunction binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left < right) {\n    let mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid;\n    else right = mid;\n  }\n  return -1;\n}`,
      choices: [
        { id: "a", text: "The while condition should be 'left <= right'" },
        { id: "b", text: "'left = mid' should be 'left = mid + 1' and 'right = mid' should be 'right = mid - 1'" },
        { id: "c", text: "mid calculation should use (left + right + 1) / 2" },
        { id: "d", text: "The function returns -1 instead of the index" },
      ],
      correctAnswer: "b",
      explanation: "Multiple bugs: (1) The while loop should use 'left <= right' to check the last remaining element. (2) When arr[mid] < target, left should be mid + 1 (not mid) because mid is already checked. (3) When arr[mid] > target, right should be mid - 1 (not mid). Without these fixes, the loop can become infinite when target is at the boundaries.",
    },
  ];
}

function generateOutputPredictionQuestions(company: string) {
  return [
    {
      text: `${company} interview question: What is the output?\n\npublic class Test {\n  public static void main(String[] args) {\n    Integer a = 128;\n    Integer b = 128;\n    System.out.println(a == b);\n    System.out.println(a.equals(b));\n  }\n}`,
      choices: [
        { id: "a", text: "true\\ntrue" },
        { id: "b", text: "false\\ntrue" },
        { id: "c", text: "true\\nfalse" },
        { id: "d", text: "Compilation error" },
      ],
      correctAnswer: "b",
      explanation: "Integer caching in Java caches values from -128 to 127. For 128 (outside this range), new Integer objects are created, so '==' compares references and returns false. However, .equals() compares values, so it returns true. This is a common interview trap that tests knowledge of wrapper class caching.",
    },
    {
      text: `What will this JavaScript code output?\n\nconsole.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);`,
      choices: [
        { id: "a", text: "1, 2, 3, 4" },
        { id: "b", text: "1, 4, 3, 2" },
        { id: "c", text: "1, 4, 2, 3" },
        { id: "d", text: "4, 1, 2, 3" },
      ],
      correctAnswer: "b",
      explanation: "This tests the JavaScript event loop. Synchronous code (console.log(1) and console.log(4)) runs first. Microtasks (Promise.then) execute before macrotasks (setTimeout). So the order is: 1 (sync), 4 (sync), 3 (microtask), 2 (macrotask). This is a classic Node.js/JS interview question.",
    },
  ];
}

function generateLldQuestions(company: string) {
  return [
    {
      text: `Design a parking lot system for ${company}'s headquarters. Which class structure is most maintainable and follows SOLID principles?`,
      choices: [
        { id: "a", text: "Single ParkingLot class with methods for all vehicle types and spot management" },
        { id: "b", text: "ParkingLot, ParkingSpot (abstract), Vehicle (abstract with subclasses Car, Bike, Truck), Ticket, PaymentStrategy (interface)" },
        { id: "c", text: "Separate classes for each floor with duplicate parking logic" },
        { id: "d", text: "Enum-based parking slots with switch statements for rates" },
      ],
      correctAnswer: "b",
      explanation: "The correct design uses: (1) Abstract Vehicle class with subclasses allowing easy addition of new types (Open/Closed Principle). (2) Strategy pattern for PaymentStrategy enables different pricing models. (3) ParkingLot manages ParkingSpots, each handling different vehicle sizes. (4) Ticket tracks vehicle-spot-time details. This follows SRP, OCP, and Dependency Inversion.",
    },
    {
      text: `For ${company}'s URL shortening service (like TinyURL), which approach best supports 100M+ URLs?`,
      choices: [
        { id: "a", text: "Use auto-increment ID and encode to base62" },
        { id: "b", text: "Generate random 6-character strings and check uniqueness in DB" },
        { id: "c", text: "Use MD5 hash of the URL and take first 7 characters" },
        { id: "d", text: "Pre-generate all possible short codes in a lookup table" },
      ],
      correctAnswer: "a",
      explanation: "Auto-increment ID with base62 encoding (0-9, a-z, A-Z) is most scalable: (1) Guarantees uniqueness without collisions. (2) Base62 encoding of a 64-bit integer gives compact URLs (11 chars for 2^64). (3) Works with distributed ID generators like Snowflake. (4) No need for collision checking on every insert. Random strings and hash prefixes have collision risks at scale.",
    },
  ];
}

function generateSystemDesignQuestions(company: string, _exp: number) {
  const isSenior = _exp >= 3;
  return [
    {
      text: `${isSenior ? "Design WhatsApp/Telegram for ${company} — a real-time messaging system handling 1B+ messages/day. What's the most critical architectural decision?" : "How would you design ${company}'s user notification system?"}`,
      choices: [
        { id: "a", text: isSenior
          ? "Use a monolithic server with WebSocket connections for real-time updates"
          : "Store all notifications in a single database table with user_id index" },
        { id: "b", text: isSenior
          ? "WebSocket gateway for persistent connections, Kafka for message queuing, Cassandra for message storage, and CDN for media"
          : "Use a message queue (RabbitMQ/Kafka) with worker services processing and sending notifications" },
        { id: "c", text: isSenior
          ? "Polling every 5 seconds from the client to check for new messages"
          : "Send push notifications from the web server directly when events occur" },
        { id: "d", text: isSenior
          ? "P2P connections between users without any central server"
          : "Use cron jobs to batch process and send all notifications daily" },
      ],
      correctAnswer: "b",
      explanation: isSenior
        ? "WhatsApp-scale messaging requires: (1) WebSocket gateways for persistent, bidirectional connections with sticky load balancing. (2) Kafka for reliable, ordered message delivery between services. (3) Cassandra for time-series message data with write-optimized storage. (4) CDN for media to reduce server load. The key insight is choosing the right database (Cassandra over SQL) for the write-heavy, time-ordered workload."
        : "A notification system should decouple notification generation from delivery using a message queue. Workers consume from the queue and send via the appropriate channel (email, push, SMS). This allows independent scaling of producers and consumers, retries on failure, and adding new notification channels without modifying existing code.",
    },
  ];
}
