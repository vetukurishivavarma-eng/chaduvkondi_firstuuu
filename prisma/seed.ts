import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Type helpers ────────────────────────────────────────────────────────────
interface QData {
  text: string;
  difficultyWeight: number;
  explanation: string;
  choices: readonly { text: string; isCorrect: boolean }[];
}
interface RData {
  title: string;
  description: string;
  url: string;
  type: "video" | "article" | "documentation";
}
interface ConceptData {
  name: string;
  description: string;
  order: number;
  questions: readonly QData[];
  resources: readonly RData[];
}
interface SubDomainData {
  name: string;
  description: string;
  order: number;
  concepts: ConceptData[];
}

async function main() {
  console.log("🌱 Seeding database...");

  // NOTE: This seed NEVER deletes any data. It only creates data that doesn't exist yet.

  // Ensure admin password
  const adminCheck = await prisma.user.findUnique({ where: { email: "admin@chaduvkondi.com" } });
  if (adminCheck) {
    const bcrypt = require("bcryptjs");
    if (!bcrypt.compareSync("Admin@123", adminCheck.password)) {
      const newHash = bcrypt.hashSync("Admin@123", 10);
      await prisma.user.update({ where: { id: adminCheck.id }, data: { password: newHash } });
      console.log("🔑 Admin password updated");
    } else console.log("✅ Admin password correct");
  }

  // Create Tiers
  const tierData = [
    { name: "Spark", minScore: 0, color: "#94a3b8", icon: "✨" },
    { name: "Apprentice", minScore: 20, color: "#22c55e", icon: "🔥" },
    { name: "Specialist", minScore: 40, color: "#3b82f6", icon: "💎" },
    { name: "Expert", minScore: 60, color: "#8b5cf6", icon: "🏆" },
    { name: "Architect", minScore: 80, color: "#f59e0b", icon: "👑" },
    { name: "Elite", minScore: 95, color: "#ef4444", icon: "🌟" },
  ];
  const tiers: any[] = [];
  for (const td of tierData) {
    let t = await prisma.tierDefinition.findUnique({ where: { name: td.name } });
    if (!t) t = await prisma.tierDefinition.create({ data: td });
    tiers.push(t);
  }
  console.log(`✅ ${tiers.length} tiers`);

  // Create Admin
  if (!await prisma.user.findUnique({ where: { email: "admin@chaduvkondi.com" } })) {
    await prisma.user.create({
      data: {
        email: "admin@chaduvkondi.com",
        password: "$2b$10$FDjrjLGOv6K4WtANkqQ95.oh3CYTzXGM.6PCwqcYcPRZ8h6bQSPFu",
        name: "Platform Admin", role: "admin", tierId: tiers[5].id, bio: "Platform administrator",
      },
    });
    console.log("✅ Created admin");
  } else console.log("✅ Admin exists");

  // ─── Helpers ─────────────────────────────────────────────────────────────
  async function addQuestions(conceptId: string, questions: readonly QData[]) {
    for (const q of questions) {
      if (await prisma.question.findFirst({ where: { text: q.text, conceptId } })) continue;
      await prisma.question.create({
        data: {
          text: q.text, difficultyWeight: q.difficultyWeight, explanation: q.explanation, conceptId,
          choices: { create: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })) },
        },
      });
    }
  }
  async function addResources(conceptId: string, resources: readonly RData[]) {
    for (const r of resources) {
      if (await prisma.resource.findFirst({ where: { url: r.url, conceptId } })) continue;
      await prisma.resource.create({ data: { ...r, conceptId } });
    }
  }
  async function ensureConcept(subDomainId: string, cd: ConceptData) {
    let c = await prisma.concept.findFirst({ where: { name: cd.name, subDomainId } });
    if (!c) {
      c = await prisma.concept.create({ data: { name: cd.name, description: cd.description, order: cd.order, subDomainId } });
      console.log(`  ➕ ${cd.name}`);
    }
    await addQuestions(c.id, cd.questions);
    await addResources(c.id, cd.resources);
    return c;
  }
  async function createSubDomains(trackId: string, subDomains: SubDomainData[]) {
    for (const sd of subDomains) {
      let sub = await prisma.subDomain.findFirst({ where: { name: sd.name, trackId } });
      if (!sub) {
        sub = await prisma.subDomain.create({ data: { name: sd.name, description: sd.description, order: sd.order, trackId } });
        console.log(` ➕ SubDomain: ${sd.name}`);
      }
      for (const concept of sd.concepts) await ensureConcept(sub.id, concept);
    }
  }
  async function createTrack(data: { name: string; description: string; longDescription: string; icon: string; color: string; difficulty: string; popularity: number }, subDomains: SubDomainData[]) {
    let track = await prisma.track.findUnique({ where: { name: data.name } });
    if (!track) {
      track = await prisma.track.create({ data: { ...data, isActive: true } });
      console.log(`✅ Created track: ${data.name}`);
    } else console.log(`✅ Track exists: ${data.name}`);
    await createSubDomains(track.id, subDomains);
  }

  // ─── Helper for creating sub-domain data arrays ──────────────────────────
  function Q(text: string, difficultyWeight: number, explanation: string, ...choices: [string, boolean][]): QData {
    return { text, difficultyWeight, explanation, choices: choices.map(([t, c]) => ({ text: t, isCorrect: c })) };
  }
  function R(title: string, description: string, url: string, type: "video" | "article" | "documentation"): RData {
    return { title, description, url, type };
  }
  function C(name: string, description: string, order: number, questions: QData[], resources: RData[]): ConceptData {
    return { name, description, order, questions, resources };
  }
  function SD(name: string, description: string, order: number, ...concepts: ConceptData[]): SubDomainData {
    return { name, description, order, concepts };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACK 1: Salesforce Developer (existing)
  // ═══════════════════════════════════════════════════════════════════════════
  await createTrack({
    name: "Salesforce Developer",
    description: "Master Salesforce development — Apex, LWC, Flow, Data Modeling, Security, and more.",
    longDescription: "Comprehensive Salesforce development track covering administration, Apex programming, Lightning Web Components, Flow automation, integration patterns, and DevOps.",
    icon: "☁️", color: "#00a1e0", difficulty: "Beginner to Expert", popularity: 95,
  }, [
    SD("Admin & Configuration", "Salesforce administration, setup, and platform configuration", 1,
      C("Salesforce Setup & Organization", "Org setup, company information, and org-wide defaults", 1, [
        Q("What is the maximum number of active users allowed in a Developer Edition org?", 1.0, "Developer Edition orgs support up to 5 active users.", ["5", true], ["10", false], ["25", false], ["Unlimited", false]),
        Q("Which sandbox type copies all metadata AND all data from production?", 1.4, "A Full Sandbox copies your entire production org including all metadata and all data.", ["Full Sandbox", true], ["Developer Sandbox", false], ["Developer Pro Sandbox", false], ["Partial Copy Sandbox", false]),
        Q("What is the purpose of My Domain in Salesforce?", 1.3, "My Domain provides a custom subdomain required for SSO and many features.", ["Creates a custom subdomain URL required for SSO and many features", true], ["Creates a separate sandbox for testing", false], ["Allows hosting your own email server", false], ["Provides a custom login page designer", false]),
      ], [
        R("Salesforce Setup Guide", "Official setup guide", "https://help.salesforce.com/s/articleView?id=sf.admin_setup.htm", "documentation"),
        R("Sandbox Types Guide", "Understanding sandbox types", "https://help.salesforce.com/s/articleView?id=sf.sandbox_about.htm", "documentation"),
      ]),
      C("Object & Field Management", "Custom objects, fields, and relationships", 2, [
        Q("Which relationship type creates an optional lookup on the child?", 1.0, "Lookup relationships can be optional. Master-Detail requires a parent.", ["Lookup Relationship", true], ["Master-Detail Relationship", false], ["Many-to-Many Relationship", false], ["Self Relationship", false]),
        Q("What is the maximum custom objects in Enterprise Edition?", 1.3, "Enterprise allows 200 custom objects.", ["200", true], ["50", false], ["500", false], ["Unlimited", false]),
        Q("What does a Master-Detail relationship cascade?", 1.5, "Master-Detail cascades deletes and inherits security/owner from the master.", ["Cascade delete, inherited security, and owner from master", true], ["Independent delete and separate ownership", false], ["Cross-object formulas not supported", false], ["Children can have different owners", false]),
      ], [
        R("Custom Objects Guide", "Creating custom objects", "https://help.salesforce.com/s/articleView?id=sf.custom_object_create.htm", "documentation"),
        R("Relationship Types", "Lookup vs Master-Detail", "https://help.salesforce.com/s/articleView?id=sf.relationships_considerations.htm", "documentation"),
      ]),
      C("Security & Sharing", "Profiles, permission sets, sharing rules, OWD", 3, [
        Q("What is the correct order of security evaluation?", 1.5, "Org → Object → Field → Record level.", ["Org → Object → Field → Record", true], ["Object → Field → Record → Org", false], ["Record → Field → Object → Org", false], ["Field → Org → Object → Record", false]),
        Q("What does Private OWD mean?", 1.2, "Users only see records they own or that are explicitly shared.", ["Users only see records they own or that are explicitly shared", true], ["All users can see all records", false], ["Only admins see all records", false], ["Records auto-share up the hierarchy", false]),
        Q("What is the difference between Profile and Permission Set?", 1.4, "Profiles are base permissions; Permission Sets grant additional access.", ["Profiles are base permissions, Permission Sets grant additional access", true], ["Permission Sets replace profiles entirely", false], ["Profiles grant additional access", false], ["They are interchangeable", false]),
      ], [
        R("Salesforce Security Guide", "Security architecture docs", "https://help.salesforce.com/s/articleView?id=sf.security_sharing_architecture.htm", "documentation"),
        R("Profiles vs Permission Sets", "Understanding permissions", "https://help.salesforce.com/s/articleView?id=sf.permissions_overview.htm", "documentation"),
      ]),
      C("Validation Rules & Formulas", "Validation rules, formula fields, and functions", 4, [
        Q("What happens when a validation rule evaluates to TRUE?", 1.0, "The record is prevented from saving and an error is shown.", ["The record is prevented from saving and an error is shown", true], ["The record saves successfully", false], ["The record saves but a warning is logged", false], ["Only admins can save the record", false]),
        Q("Which function returns current date and time?", 1.2, "NOW() returns current date and time; TODAY() returns just the date.", ["NOW()", true], ["TODAY()", false], ["DATE()", false], ["TIMESTAMP()", false]),
        Q("What is the max length of a formula field result?", 1.5, "Formula fields are limited to 3,900 characters.", ["3,900 characters", true], ["1,000 characters", false], ["32,000 characters", false], ["255 characters", false]),
      ], [
        R("Formula Operators Reference", "Formula functions and operators", "https://help.salesforce.com/s/articleView?id=sf.formula_overview.htm", "documentation"),
      ]),
      C("Record Types & Picklists", "Record types, global/custom picklists, dependent picklists", 5, [
        Q("What is the primary purpose of Record Types?", 1.0, "Record Types offer different business processes and page layouts on the same object.", ["To provide different business processes, picklist values, and page layouts", true], ["To store records in different database tables", false], ["To create different API names", false], ["To limit records per user", false]),
        Q("How many active record types per object?", 1.3, "Up to 600 record types per object.", ["600 record types per object", true], ["100 record types per object", false], ["Unlimited", false], ["50 record types per object", false]),
        Q("How do Dependent Picklists work?", 1.5, "A controlling field filters available values in the dependent field.", ["A controlling field filters available values in the dependent field", true], ["Both fields show all values independently", false], ["The dependent field controls the controlling field", false], ["Only checkbox controlling fields work", false]),
      ], [
        R("Record Types Overview", "Configuring record types", "https://help.salesforce.com/s/articleView?id=sf.record_types_overview.htm", "documentation"),
        R("Picklist Guide", "Managing picklists", "https://help.salesforce.com/s/articleView?id=sf.picklist_about.htm", "documentation"),
      ]),
    ),
    SD("Apex Programming", "Apex language, governor limits, triggers, and design patterns", 2,
      C("Apex Basics & Syntax", "Data types, collections, control flow", 1, [
        Q("Which is NOT a valid Apex primitive?", 1.0, "char is not a valid Apex primitive. Apex has Integer, Long, Double, Decimal, String, Boolean, Date, Datetime, Time, ID, Blob.", ["char", true], ["Integer", false], ["Decimal", false], ["Boolean", false]),
        Q("Which collection maintains insertion order with duplicates?", 1.2, "A List maintains insertion order and allows duplicates.", ["List", true], ["Set", false], ["Map", false], ["Array", false]),
        Q("What does '==' compare for Strings in Apex?", 1.5, "In Apex, '==' compares references. Use '.equals()' for content comparison.", ["Object references (not content)", true], ["String content", false], ["Memory addresses only", false], ["Hash codes", false]),
      ], [
        R("Apex Developer Guide", "Official Apex docs", "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_dev_guide.htm", "documentation"),
        R("Apex Collections", "Lists, Sets, Maps", "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_collections.htm", "documentation"),
      ]),
      C("Apex Governor Limits", "Understanding and managing limits", 2, [
        Q("CPU time limit for synchronous Apex?", 1.5, "10 seconds (10,000 ms) for synchronous, 60 seconds for async.", ["10,000 ms (10 seconds)", true], ["30,000 ms (30 seconds)", false], ["60,000 ms (60 seconds)", false], ["5,000 ms (5 seconds)", false]),
        Q("Max records in a single DML operation?", 1.3, "10,000 records total per transaction across all DML statements.", ["10,000 records total per transaction", true], ["10,000 records per DML statement", false], ["50,000 records per transaction", false], ["Unlimited", false]),
        Q("Heap size limit for synchronous Apex?", 1.2, "6 MB for synchronous, 12 MB for asynchronous.", ["6 MB", true], ["12 MB", false], ["3 MB", false], ["10 MB", false]),
      ], [
        R("Governor Limits", "Execution limits documentation", "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm", "documentation"),
      ]),
      C("Apex Triggers", "Trigger events, best practices, frameworks", 3, [
        Q("Which trigger events are supported?", 1.0, "before/after insert, update, delete, undelete.", ["before/after insert, update, delete, undelete", true], ["before/after insert, update, delete", false], ["before/after insert only", false], ["before/after insert, update, delete, upsert, undelete", false]),
        Q("Best practice for writing triggers?", 1.5, "Delegate all logic to a handler class. Keep triggers logic-free.", ["Delegate all logic to a handler class, keep triggers logic-free", true], ["Write business logic directly in trigger body", false], ["Use multiple triggers per object", false], ["Avoid Trigger.old and Trigger.new", false]),
        Q("How many triggers per object per event?", 1.2, "Only one trigger per object per event combination.", ["One trigger per object per event", true], ["Five triggers per object per event", false], ["Unlimited triggers", false], ["Two triggers per object per event", false]),
      ], [
        R("Apex Triggers Guide", "Official trigger docs", "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm", "documentation"),
      ]),
      C("Apex Exception Handling", "Try-catch, custom exceptions, debugging", 4, [
        Q("Which is NOT a built-in Apex exception?", 1.2, "FileException is not built-in. DmlException, QueryException, ListException, etc. are.", ["FileException", true], ["DmlException", false], ["QueryException", false], ["LimitException", false]),
        Q("Can you catch a LimitException?", 1.5, "LimitException CANNOT be caught. It forces a transaction rollback.", ["No, LimitException cannot be caught — it forces transaction rollback", true], ["Yes, it can be caught like any other exception", false], ["Only in async Apex", false], ["Only in test classes", false]),
      ], [
        R("Exception Handling", "Try-catch and custom exceptions", "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_exception_handling.htm", "documentation"),
      ]),
      C("Apex Design Patterns", "Singleton, factory, strategy, trigger frameworks", 5, [
        Q("Which pattern ensures only one instance?", 1.2, "Singleton ensures a single instance with a global access point.", ["Singleton", true], ["Factory", false], ["Strategy", false], ["Observer", false]),
        Q("Benefit of Trigger Handler pattern?", 1.5, "Centralizes logic, enables ordering, recursion prevention, testability.", ["Centralizes logic for ordering, recursion prevention, and testability", true], ["Automatically creates unit tests", false], ["Eliminates governor limits", false], ["Increases max triggers per object", false]),
      ], [
        R("Apex Design Patterns", "Common design patterns in Apex", "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_design_patterns_intro.htm", "documentation"),
      ]),
    ),
    SD("Lightning Web Components", "LWC framework, components, data binding, lifecycle", 3,
      C("LWC Component Basics", "Component structure, decorators, lifecycle", 1, [
        Q("Which files are required for every LWC?", 1.0, "Every LWC must have an HTML template and a JS file.", [".html template and .js file", true], [".html, .js, and .css files", false], ["Only the .js file", false], [".html, .js, .css, and .svg files", false]),
        Q("Which decorator makes a property reactive?", 1.2, "@track makes private properties reactive. @api is for public properties.", ["@track", true], ["@api", false], ["@wire", false], ["@reactive", false]),
        Q("Which lifecycle hook runs on DOM insertion?", 1.4, "connectedCallback() runs when component is inserted into the DOM.", ["connectedCallback()", true], ["renderedCallback()", false], ["disconnectedCallback()", false], ["constructor()", false]),
        Q("What does js-meta.xml define?", 1.2, "It defines target config, design attributes, and exposure settings.", ["Target configurations, design attributes, and exposure in Salesforce UI", true], ["The component's template HTML", false], ["Component CSS styles", false], ["JavaScript test files", false]),
      ], [
        R("LWC Developer Guide", "Official LWC documentation", "https://developer.salesforce.com/docs/platform/lwc/guide/get-started.html", "documentation"),
        R("LWC Lifecycle Hooks", "Lifecycle hooks reference", "https://developer.salesforce.com/docs/platform/lwc/guide/reference-lifecycle-hooks.html", "documentation"),
      ]),
      C("LWC Data Services", "Wire adapters, imperative Apex, data handling", 2, [
        Q("Which wire adapter retrieves a single record by ID?", 1.5, "getRecord retrieves a single record with specified fields.", ["getRecord", true], ["getRecords", false], ["getRecordById", false], ["fetchRecord", false]),
        Q("What happens when @wire returns an error?", 1.3, "data is undefined, error contains the error details.", ["The data property is undefined and error property contains details", true], ["The component crashes", false], ["The wire retries automatically", false], ["Error is silently ignored", false]),
        Q("What does refreshApex do?", 1.5, "It programmatically refreshes wired data after DML operations.", ["Programmatically refresh wired data after DML operations", true], ["Refresh the browser page", false], ["Re-render the component template", false], ["Clear the LWC framework cache", false]),
      ], [
        R("LWC Data & Wire Service", "Wire service documentation", "https://developer.salesforce.com/docs/platform/lwc/guide/data-wire-service-about.html", "documentation"),
        R("Imperative Apex Calls", "Calling Apex from LWC", "https://developer.salesforce.com/docs/platform/lwc/guide/data-apex.html", "documentation"),
      ]),
      C("LWC Composition & Events", "Custom events, propagation, pub-sub", 3, [
        Q("How do child components send data to parents?", 1.3, "Fire a CustomEvent and listen with on-event-name handlers.", ["Firing a CustomEvent and listening with on-event-name handler", true], ["Directly calling a parent method", false], ["Using global variables", false], ["Using @api decorator on parent", false]),
        Q("Default event propagation mode for LWC events?", 1.5, "Bubbling phase (bubbles: true, composed: false).", ["Bubbling phase (bubbles: true, composed: false)", true], ["Capturing phase only", false], ["No propagation", false], ["Crosses shadow boundaries (composed: true)", false]),
        Q("Pattern for sibling communication?", 1.4, "Pub-sub pattern via a shared service.", ["Publish-Subscribe (Pub-Sub) pattern via a shared service", true], ["Direct method invocation", false], ["window.postMessage", false], ["Siblings cannot communicate", false]),
      ], [
        R("LWC Events Guide", "Events and communication", "https://developer.salesforce.com/docs/platform/lwc/guide/events-intro.html", "documentation"),
      ]),
      C("LWC Styling & SLDS", "CSS scoping, SLDS, responsive design", 4, [
        Q("How does CSS scoping work in LWC?", 1.2, "Shadow DOM automatically scopes CSS to the component.", ["Shadow DOM automatically scopes CSS to the component", true], ["Must manually prefix class names", false], ["CSS is global across all components", false], ["CSS scoping is not supported", false]),
        Q("How to use SLDS in LWC?", 1.3, "SLDS is automatically available. Use SLDS classes directly in HTML.", ["Use SLDS CSS classes directly in the HTML template (automatically available)", true], ["Import SLDS as an npm package", false], ["Copy SLDS CSS into each component", false], ["SLDS is not compatible with LWC", false]),
      ], [
        R("LWC Styling Guide", "CSS and styling in LWC", "https://developer.salesforce.com/docs/platform/lwc/guide/create-css.html", "documentation"),
      ]),
    ),
    SD("Flow & Automation", "Flow Builder, approval processes, automation", 4,
      C("Flow Builder Basics", "Screen flows, auto-launched, record-triggered flows", 1, [
        Q("Which flow type can run before record save?", 1.2, "Record-Triggered Flow (before-save) runs before the record is committed.", ["Record-Triggered Flow (before-save)", true], ["Auto-Launched Flow", false], ["Screen Flow", false], ["Platform Event-Triggered Flow", false]),
        Q("What element pauses a flow until a condition is met?", 1.3, "The Wait element pauses until a specified time, date, or event occurs.", ["Wait Element", true], ["Pause Element", false], ["Scheduled Path", false], ["Sleep Element", false]),
        Q("Difference between Screen Flow and Auto-Launched Flow?", 1.4, "Screen Flows have UI for user interaction; Auto-Launched runs in background.", ["Screen Flows have UI screens; Auto-Launched Flows run in background", true], ["Screen Flows run on mobile only", false], ["Auto-Launched only triggered by records", false], ["Screen Flows cannot update records", false]),
        Q("How many elements per flow?", 1.5, "Up to 2,000 elements per flow.", ["2,000 elements per flow", true], ["500 elements per flow", false], ["10,000 elements per flow", false], ["Unlimited", false]),
      ], [
        R("Flow Builder Guide", "Official Flow Builder documentation", "https://help.salesforce.com/s/articleView?id=platform.automate_flow_about.htm", "documentation"),
        R("Flow Builder Trailhead", "Interactive Flow Builder learning", "https://trailhead.salesforce.com/content/learn/modules/flow_builder", "documentation"),
      ]),
      C("Approval Processes", "Approval steps, queues, history", 2, [
        Q("What determines which records enter an approval process?", 1.2, "Entry criteria (formula or record criteria) define eligible records.", ["Entry criteria (formula or record criteria) that records must match", true], ["The record type", false], ["The profile of the record owner", false], ["All records enter automatically", false]),
        Q("What happens when an approval step is rejected?", 1.4, "It can reject permanently, allow resubmission, or escalate — configured per step.", ["Can reject permanently, allow resubmission, or escalate — configured per step", true], ["Record is automatically deleted", false], ["Record goes to next approver", false], ["Submitter is locked out", false]),
        Q("Purpose of an Approval Queue?", 1.3, "A shared group of users who can process pending approval requests.", ["A shared group of users who can process pending approval requests", true], ["A queue of records waiting to be submitted", false], ["A list of pending approvals for one user", false], ["FIFO ordering of approval requests", false]),
      ], [
        R("Approval Process Guide", "Setting up approval processes", "https://help.salesforce.com/s/articleView?id=sf.approvals_about.htm", "documentation"),
      ]),
      C("Process Automation Best Practices", "Flow optimization, subflows, error handling", 3, [
        Q("How to reuse logic across multiple flows?", 1.3, "Create an auto-launched subflow that other flows can call.", ["Create an Auto-Launched Flow and call it as a Subflow from other flows", true], ["Duplicate the logic in each flow", false], ["Use Apex triggers instead", false], ["Create a Screen Flow", false]),
        Q("How should flow errors be handled in production?", 1.5, "Use Fault Paths to log errors and send notifications.", ["Use Fault Paths to handle errors gracefully with logging and notifications", true], ["Errors are automatically handled", false], ["Wrap the flow in a try-catch", false], ["Ignore errors — flows retry automatically", false]),
      ], [
        R("Flow Best Practices", "Optimization and error handling", "https://help.salesforce.com/s/articleView?id=platform.flow_optimization.htm", "documentation"),
      ]),
    ),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACK 2: Python
  // ═══════════════════════════════════════════════════════════════════════════
  await createTrack({
    name: "Python", description: "Master Python from fundamentals to advanced — data structures, OOP, web frameworks, and data science.",
    longDescription: "Comprehensive Python track covering syntax, data structures, object-oriented programming, standard library, web development with Flask/Django, and data science with NumPy/Pandas.",
    icon: "🐍", color: "#3776AB", difficulty: "Beginner to Advanced", popularity: 98,
  }, [
    SD("Python Fundamentals", "Python basics, syntax, control flow, and functions", 1,
      C("Variables & Data Types", "Python data types, variables, and type conversion", 1, [
        Q("What is the output of: print(type(3.14))?", 1.0, "3.14 is a float in Python. Python has dynamic typing, so the type is determined at runtime.", ["<class 'float'>", true], ["<class 'int'>", false], ["<class 'decimal'>", false], ["<class 'double'>", false]),
        Q("Which of the following is a mutable data type in Python?", 1.2, "Lists are mutable — they can be modified after creation. Tuples and strings are immutable.", ["List", true], ["Tuple", false], ["String", false], ["Frozenset", false]),
        Q("What does the range(5) function return?", 1.0, "range(5) returns an iterable that yields 0, 1, 2, 3, 4 (not including 5).", ["0, 1, 2, 3, 4", true], ["1, 2, 3, 4, 5", false], ["0, 1, 2, 3, 4, 5", false], ["1, 2, 3, 4", false]),
        Q("How do you check the length of a list in Python?", 1.0, "len() is a built-in function that returns the number of items in a container.", ["len(my_list)", true], ["my_list.length()", false], ["my_list.size()", false], ["length(my_list)", false]),
      ], [
        R("Python Official Tutorial", "Official Python getting started guide", "https://docs.python.org/3/tutorial/introduction.html", "documentation"),
        R("Real Python - Variables", "Python variables and data types", "https://realpython.com/python-variables/", "article"),
        R("Corey Schafer - Python Basics", "Comprehensive Python beginner tutorial", "https://www.youtube.com/watch?v=YYXdXT2l-Gg", "video"),
      ]),
      C("Control Flow & Functions", "Conditionals, loops, and function definitions", 2, [
        Q("What is the output of: print(3 == '3')?", 1.2, "Python does NOT perform type coercion in comparisons. 3 (int) != '3' (str), so the result is False.", ["False", true], ["True", false], ["TypeError", false], ["None", false]),
        Q("Which keyword defines a function in Python?", 1.0, "Functions are defined using the 'def' keyword followed by the function name and parentheses.", ["def", true], ["function", false], ["func", false], ["define", false]),
        Q("What does the 'break' statement do in a loop?", 1.0, "break immediately terminates the innermost enclosing loop.", ["Exits the current loop immediately", true], ["Skips to the next iteration", false], ["Restarts the loop from the beginning", false], ["Ends the entire program", false]),
        Q("What is the output of: print(2 ** 3)?", 1.0, "** is the exponentiation operator. 2 ** 3 = 2 * 2 * 2 = 8.", ["8", true], ["6", false], ["5", false], ["9", false]),
      ], [
        R("Python Control Flow", "Official control flow documentation", "https://docs.python.org/3/tutorial/controlflow.html", "documentation"),
        R("Functions - Real Python", "Python functions deep dive", "https://realpython.com/defining-your-own-python-function/", "article"),
      ]),
      C("Lists, Tuples & Dictionaries", "Python collection data structures", 3, [
        Q("How do you add an element to the end of a list?", 1.0, "append() adds an element to the end of a list. extend() adds multiple elements.", ["append()", true], ["add()", false], ["push()", false], ["insert()", false]),
        Q("What is the key difference between a list and a tuple?", 1.2, "Lists are mutable (can be changed), tuples are immutable (cannot be changed after creation).", ["Lists are mutable, tuples are immutable", true], ["Lists are ordered, tuples are unordered", false], ["Lists can have duplicates, tuples cannot", false], ["Lists use [], tuples use {}", false]),
        Q("What does a dictionary comprehension do?", 1.4, "Dictionary comprehensions create dictionaries from iterables using {key: value for item in iterable} syntax.", ["Creates a dictionary from an iterable using key:value pairs", true], ["Creates a list from dictionary keys", false], ["Converts a list to a dictionary", false], ["Sorts a dictionary by its values", false]),
        Q("What is the output of: print({1, 2, 3} & {2, 3, 4})?", 1.5, "& is the set intersection operator, returning elements common to both sets: {2, 3}.", ["{2, 3}", true], ["{1, 2, 3, 4}", false], ["{1, 4}", false], ["{2, 3, 4}", false]),
      ], [
        R("Python Data Structures", "Official data structures guide", "https://docs.python.org/3/tutorial/datastructures.html", "documentation"),
        R("Real Python - Lists & Tuples", "Lists vs tuples comparison", "https://realpython.com/python-lists-tuples/", "article"),
      ]),
    ),
    SD("Object-Oriented Python", "Classes, inheritance, magic methods, and design patterns", 2,
      C("Classes & Objects", "Class definitions, constructors, instance/class methods", 1, [
        Q("What is the purpose of __init__ in Python classes?", 1.0, "__init__ is the constructor method, called automatically when a new instance is created.", ["Constructor called when creating a new instance", true], ["Destructor called when deleting an instance", false], ["Method called on every attribute access", false], ["String representation method", false]),
        Q("What does 'self' refer to in a class method?", 1.0, "self refers to the current instance of the class. It's the first parameter of instance methods.", ["The current instance of the class", true], ["The class itself", false], ["The parent class", false], ["A special Python keyword for privacy", false]),
        Q("What is the difference between @staticmethod and @classmethod?", 1.4, "@staticmethod has no access to cls or self; @classmethod receives cls (the class).", ["@staticmethod has no cls/self; @classmethod receives cls", true], ["@staticmethod receives cls; @classmethod receives self", false], ["They are identical in behavior", false], ["@staticmethod is for private methods only", false]),
        Q("What is a property decorator used for?", 1.3, "@property allows defining methods that can be accessed like attributes, enabling computed properties.", ["Define methods accessible as attributes (computed properties)", true], ["Mark a method as private", false], ["Cache method return values", false], ["Define abstract methods", false]),
      ], [
        R("Python Classes Tutorial", "Official classes documentation", "https://docs.python.org/3/tutorial/classes.html", "documentation"),
        R("Real Python - OOP", "Object-oriented programming in Python", "https://realpython.com/python3-object-oriented-programming/", "article"),
      ]),
      C("Inheritance & Polymorphism", "Inheritance, method overriding, super(), abstract classes", 2, [
        Q("How do you call a parent class constructor from a child class?", 1.2, "super().__init__() calls the parent class constructor. super() returns a proxy object for the parent.", ["super().__init__()", true], ["parent.__init__()", false], ["Parent().__init__()", false], ["self.__parent__()", false]),
        Q("What is Method Resolution Order (MRO) in Python?", 1.5, "MRO defines the order in which Python searches for methods in inheritance hierarchies, using the C3 linearization algorithm.", ["The order Python searches for methods in inheritance (C3 linearization)", true], ["The order constructors are called", false], ["A sorting algorithm for class methods", false], ["A security permission system for methods", false]),
        Q("What is duck typing in Python?", 1.4, "Python determines an object's suitability by its methods/attributes rather than its type. 'If it walks like a duck...'", ["Object suitability determined by methods/attributes, not type", true], ["Forcing type conversions at runtime", false], ["A special type of exception handling", false], ["A design pattern for database access", false]),
      ], [
        R("Python super() Guide", "Understanding super()", "https://realpython.com/python-super/", "article"),
      ]),
      C("Magic Methods & Protocols", "Dunder methods, context managers, iterators", 3, [
        Q("Which magic method is called by str() and print()?", 1.2, "__str__() defines the 'informal' string representation used by str() and print(). __repr__() is for debugging.", ["__str__()", true], ["__repr__()", false], ["__format__()", false], ["__len__()", false]),
        Q("What methods define a context manager (used with 'with')?", 1.4, "__enter__() and __exit__() define context managers. __enter__ runs on entry, __exit__ on exit (even on exceptions).", ["__enter__() and __exit__()", true], ["__open__() and __close__()", false], ["__start__() and __stop__()", false], ["__init__() and __del__()", false]),
        Q("What does __len__() return?", 1.0, "__len__() should return the number of items in the container, used by the built-in len() function.", ["The number of items in the container", true], ["The length of the class name", false], ["The memory size of the object in bytes", false], ["The number of methods in the class", false]),
      ], [
        R("Python Data Model", "Official magic methods reference", "https://docs.python.org/3/reference/datamodel.html", "documentation"),
      ]),
    ),
    SD("Web Development & Data Science", "Flask, Django basics, NumPy, Pandas", 3,
      C("Flask Web Framework", "Routes, templates, request handling, REST APIs", 1, [
        Q("How do you define a route in Flask?", 1.0, "Use the @app.route() decorator on a view function. The decorator maps a URL to the function.", ["@app.route('/path')", true], ["@flask.route('/path')", false], ["route('/path')", false], ["@route('/path')", false]),
        Q("What does request.args contain in Flask?", 1.3, "request.args contains query string parameters from the URL (GET parameters).", ["Query string parameters from the URL", true], ["Form data submitted via POST", false], ["JSON request body", false], ["Uploaded file data", false]),
        Q("How does Flask handle JSON request data?", 1.4, "request.get_json() parses the JSON request body. request.json is an alias for the same method.", ["request.get_json()", true], ["request.data", false], ["request.body", false], ["request.json()", false]),
      ], [
        R("Flask Official Docs", "Flask web framework documentation", "https://flask.palletsprojects.com/", "documentation"),
        R("Real Python Flask Tutorial", "Flask by example", "https://realpython.com/tutorials/flask/", "article"),
      ]),
      C("NumPy & Pandas", "Numerical computing and data analysis", 2, [
        Q("What is the main data structure in Pandas?", 1.0, "DataFrame is the primary Pandas data structure. It's a 2D labeled data structure with columns of potentially different types.", ["DataFrame", true], ["Array", false], ["Series", false], ["Table", false]),
        Q("How do you read a CSV file in Pandas?", 1.0, "pd.read_csv('file.csv') reads a CSV file into a DataFrame. Pandas supports many file formats.", ["pd.read_csv('file.csv')", true], ["pd.load('file.csv')", false], ["pd.import('file.csv')", false], ["pd.parse('file.csv')", false]),
        Q("What does df.head() do in Pandas?", 1.0, "df.head() returns the first 5 rows of the DataFrame by default. Useful for quickly inspecting data.", ["Returns the first 5 rows of the DataFrame", true], ["Returns the last 5 rows", false], ["Returns all rows sorted by the first column", false], ["Returns summary statistics of all columns", false]),
      ], [
        R("Pandas Official Guide", "Pandas data analysis library", "https://pandas.pydata.org/docs/", "documentation"),
        R("NumPy Quickstart", "NumPy array computing", "https://numpy.org/doc/stable/user/quickstart.html", "documentation"),
        R("Corey Schafer - Pandas Tutorial", "Pandas tutorial series", "https://www.youtube.com/watch?v=ZyhVh-qRZPA", "video"),
      ]),
    ),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACK 3: JavaScript / TypeScript
  // ═══════════════════════════════════════════════════════════════════════════
  await createTrack({
    name: "JavaScript / TypeScript",
    description: "Master JavaScript and TypeScript — from fundamentals to modern async patterns, Node.js, and React.",
    longDescription: "Comprehensive JS/TS track covering JavaScript fundamentals, DOM APIs, async programming, TypeScript type system, Node.js runtime, React frontend development, and testing.",
    icon: "💛", color: "#F7DF1E", difficulty: "Beginner to Advanced", popularity: 97,
  }, [
    SD("JavaScript Fundamentals", "JS basics, types, functions, objects, and ES6+ features", 1,
      C("Variables & Types", "var, let, const, primitive types, type coercion", 1, [
        Q("What is the difference between let and const?", 1.0, "let allows reassignment; const does not. Both are block-scoped, unlike var.", ["let allows reassignment, const does not", true], ["const allows reassignment, let does not", false], ["let is function-scoped, const is block-scoped", false], ["There is no difference", false]),
        Q("What is the typeof null in JavaScript?", 1.2, "typeof null returns 'object'. This is a well-known bug/legacy behavior in JavaScript from its first implementation.", ["'object'", true], ["'null'", false], ["'undefined'", false], ["'boolean'", false]),
        Q("What does the === operator check?", 1.0, "=== is strict equality — it checks both value AND type without coercion.", ["Equality without type coercion (strict equality)", true], ["Equality with type coercion (loose equality)", false], ["Reference equality only", false], ["Value inequality", false]),
        Q("What is the difference between null and undefined?", 1.2, "undefined means a variable is declared but not assigned; null is an intentional absence of value.", ["undefined: not assigned; null: intentional absence of value", true], ["They are identical in JavaScript", false], ["null: not assigned; undefined: intentional absence", false], ["undefined: only for objects; null: for primitives", false]),
      ], [
        R("MDN JavaScript Guide", "Mozilla JavaScript documentation", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "documentation"),
        R("JavaScript.info", "Comprehensive JS tutorial", "https://javascript.info/", "article"),
      ]),
      C("Functions & Scope", "Function declarations, expressions, arrow functions, closures", 2, [
        Q("What is the difference between function declaration and arrow function?", 1.3, "Arrow functions do not have their own 'this' binding; they inherit it from the enclosing scope. Function declarations have their own 'this'.", ["Arrow functions inherit 'this', function declarations have their own 'this'", true], ["Arrow functions can't take parameters", false], ["Function declarations can't be called before definition", false], ["Arrow functions are always anonymous", false]),
        Q("What is a closure in JavaScript?", 1.4, "A closure is a function that retains access to its outer (enclosing) function's variables even after the outer function has returned.", ["A function with access to its outer scope's variables after the outer function returns", true], ["A function that closes over the global scope only", false], ["A function that has no parameters", false], ["A function that is immediately invoked", false]),
        Q("What is an IIFE?", 1.2, "An Immediately Invoked Function Expression (IIFE) runs as soon as it's defined. Syntax: (function(){...})()", ["Immediately Invoked Function Expression — runs as soon as it's defined", true], ["Inline Interactive Function Expression", false], ["Instance Initialization Function Expression", false], ["Integrated Interface Function Element", false]),
        Q("What does the spread operator (...) do?", 1.1, "The spread operator expands iterables (arrays, objects, strings) into individual elements.", ["Expands iterables into individual elements", true], ["Concatenates two arrays into a nested array", false], ["Creates a deep copy of an object", false], ["Rests/collects remaining arguments", false]),
      ], [
        R("MDN Functions Guide", "Functions documentation", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions", "documentation"),
        R("Closures - MDN", "Closures in JavaScript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures", "documentation"),
        R("Traversy Media - JS Crash Course", "JavaScript crash course", "https://www.youtube.com/watch?v=hdI2bqOjy3c", "video"),
      ]),
      C("Objects & Arrays", "Object manipulation, array methods, destructuring", 3, [
        Q("Which method creates a NEW array with transformed elements?", 1.0, "map() creates a new array by calling a function on every element of the original array.", ["map()", true], ["forEach()", false], ["filter()", false], ["reduce()", false]),
        Q("What does the filter() method return?", 1.0, "filter() creates a new array with elements that pass a test function. It does NOT modify the original array.", ["A new array with elements that pass the test", true], ["The first element that passes the test", false], ["A boolean indicating if any element passes", false], ["The original array with removed elements", false]),
        Q("How do you destructure an object in JavaScript?", 1.3, "Object destructuring extracts properties into variables using { propertyName } = object syntax.", ["const { name } = obj;", true], ["const name = obj.name;", false], ["const [name] = obj;", false], ["const name = obj['name'];", false]),
        Q("What is the difference between slice() and splice()?", 1.5, "slice() returns a new array (non-mutating); splice() changes the original array (mutating).", ["slice() is non-mutating (returns new), splice() mutates the original", true], ["slice() mutates, splice() returns new", false], ["slice() works on strings, splice() on arrays", false], ["They are the same method", false]),
      ], [
        R("MDN Array Guide", "Array methods documentation", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array", "documentation"),
        R("Destructuring - MDN", "Destructuring assignment", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment", "documentation"),
      ]),
    ),
    SD("Async JavaScript & TypeScript", "Promises, async/await, TypeScript types and generics", 2,
      C("Promises & Async/Await", "Promise chaining, error handling, async/await syntax", 1, [
        Q("What states can a Promise be in?", 1.2, "A Promise has three states: pending, fulfilled (resolved), and rejected.", ["Pending, Fulfilled, Rejected", true], ["Pending, Resolved, Error", false], ["Waiting, Done, Failed", false], ["Open, Closed, Error", false]),
        Q("What does async/await provide over Promise chains?", 1.3, "Async/await provides cleaner, more readable code by making asynchronous code look synchronous.", ["Cleaner syntax making async code look synchronous", true], ["Better performance than Promise chains", false], ["Automatic parallel execution of async operations", false], ["Error handling without try/catch", false]),
        Q("What does Promise.all() do?", 1.4, "Promise.all() runs multiple promises in parallel and resolves when ALL of them have resolved. Rejects immediately if any reject.", ["Runs multiple promises in parallel, resolves when all resolve", true], ["Runs promises sequentially, one after another", false], ["Resolves when the first promise resolves", false], ["Cancels all promises if one rejects", false]),
        Q("What is the event loop in JavaScript?", 1.5, "The event loop handles asynchronous callbacks by checking the callback queue when the call stack is empty, enabling non-blocking I/O.", ["Mechanism that handles async callbacks when call stack is empty", true], ["A loop that iterates over all event listeners", false], ["A way to handle DOM events in order of priority", false], ["A debugging tool for tracking function calls", false]),
      ], [
        R("MDN - Using Promises", "Promise documentation", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises", "documentation"),
        R("MDN - Async/Await", "Async function guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function", "documentation"),
        R("Event Loop Visualized", "Great visual explanation", "https://www.youtube.com/watch?v=8aGhZQkoFbQ", "video"),
      ]),
      C("TypeScript Fundamentals", "Types, interfaces, enums, union/intersection types", 2, [
        Q("What is the key benefit of TypeScript over JavaScript?", 1.0, "TypeScript adds static type checking at compile time, catching errors before runtime.", ["Static type checking catches errors before runtime", true], ["TypeScript runs faster than JavaScript", false], ["TypeScript has better browser compatibility", false], ["TypeScript does not need a compiler", false]),
        Q("How do you define an interface in TypeScript?", 1.1, "Use the 'interface' keyword: interface Person { name: string; age: number; }", ["Using the 'interface' keyword", true], ["Using the 'type' keyword only", false], ["Using the 'class' keyword", false], ["Using the 'struct' keyword", false]),
        Q("What is the difference between interface and type in TypeScript?", 1.4, "Interfaces can be extended (merged), types are aliases and cannot be reopened. Interfaces are preferred for object shapes.", ["Interfaces can be merged/declaration-merged; types are closed aliases", true], ["Types can be merged; interfaces cannot", false], ["They are completely identical", false], ["Types only work with primitives", false]),
        Q("What does the '?' mean in TypeScript property definitions?", 1.0, "The ? makes a property optional — it can be either the specified type or undefined.", ["The property is optional (can be undefined)", true], ["The property is read-only", false], ["The property is private", false], ["The property is a getter/setter", false]),
      ], [
        R("TypeScript Handbook", "Official TypeScript documentation", "https://www.typescriptlang.org/docs/handbook/intro.html", "documentation"),
        R("TypeScript Deep Dive", "Comprehensive TypeScript guide", "https://basarat.gitbook.com/typescript/", "article"),
      ]),
      C("TypeScript Generics & Advanced", "Generics, utility types, conditional types, mapped types", 3, [
        Q("What is the purpose of generics in TypeScript?", 1.3, "Generics allow creating reusable components that work with multiple types while maintaining type safety.", ["Create type-safe reusable components that work with multiple types", true], ["Dynamically generate new types at runtime", false], ["Optimize types for better performance", false], ["Convert JavaScript to TypeScript automatically", false]),
        Q("What does Partial<T> utility type do?", 1.3, "Partial<T> makes ALL properties of type T optional. Opposite of Required<T>.", ["Makes all properties of T optional", true], ["Makes all properties of T required", false], ["Picks a subset of properties from T", false], ["Makes all properties of T readonly", false]),
        Q("What is the 'as const' assertion used for?", 1.5, "'as const' makes a value deeply readonly and infers literal types (narrowest possible type).", ["Makes a value deeply readonly with literal type inference", true], ["Casts a value to a constant variable", false], ["Declares a constant class property", false], ["Optimizes runtime performance", false]),
      ], [
        R("TypeScript Generics", "Generics documentation", "https://www.typescriptlang.org/docs/handbook/2/generics.html", "documentation"),
        R("Utility Types", "TypeScript utility types reference", "https://www.typescriptlang.org/docs/handbook/utility-types.html", "documentation"),
      ]),
    ),
    SD("Node.js & React", "Server-side JavaScript, React components, hooks, state management", 3,
      C("Node.js Fundamentals", "Modules, file system, npm, Express basics", 1, [
        Q("What is the purpose of package.json?", 1.0, "package.json defines project metadata, dependencies, scripts, and entry point. It's the manifest file for Node.js projects.", ["Defines project metadata, dependencies, and scripts", true], ["Contains the compiled JavaScript code", false], ["Stores environment variables", false], ["Configures the Node.js runtime version", false]),
        Q("What does 'require()' do in Node.js?", 1.0, "require() imports modules into the current file. It's the CommonJS module system.", ["Imports modules using CommonJS", true], ["Exports modules from the current file", false], ["Installs npm packages", false], ["Downloads remote modules", false]),
        Q("What is module.exports used for?", 1.1, "module.exports defines what a module exports when it is required by another file.", ["Defines what a module exports to other files", true], ["Creates a new Node.js module", false], ["Configures module installation settings", false], ["Imports modules from node_modules", false]),
        Q("What is the EventEmitter in Node.js?", 1.4, "EventEmitter is a core Node.js class that allows objects to emit and listen for custom events. Many Node.js APIs extend it.", ["Core class for emitting and listening to events", true], ["A tool for measuring event timing", false], ["A DOM API polyfill for Node.js", false], ["An error handling utility", false]),
      ], [
        R("Node.js Official Docs", "Node.js documentation", "https://nodejs.org/en/docs/", "documentation"),
        R("Node.js Design Patterns", "Patterns for Node.js development", "https://www.nodejsdesignpatterns.com/", "article"),
      ]),
      C("React Fundamentals", "Components, JSX, props, state, hooks", 2, [
        Q("What is JSX in React?", 1.0, "JSX is a syntax extension for JavaScript that looks like HTML. It's transpiled to React.createElement() calls.", ["Syntax extension that looks like HTML, transpiled to React.createElement()", true], ["A separate templating language like Handlebars", false], ["JavaScript XML parser for server-side rendering", false], ["A CSS-in-JS styling solution", false]),
        Q("What is the useState hook used for?", 1.1, "useState adds state to functional components. It returns [value, setterFunction] array.", ["Adds state to functional components", true], ["Manages component lifecycle events", false], ["Handles HTTP requests", false], ["Provides context to child components", false]),
        Q("What is the useEffect hook used for?", 1.3, "useEffect handles side effects in functional components: API calls, subscriptions, DOM manipulation, timers.", ["Handles side effects: API calls, subscriptions, DOM manipulation", true], ["Manages local component state", false], ["Optimizes component re-renders", false], ["Handles form validation", false]),
        Q("What is the purpose of the dependency array in useEffect?", 1.4, "The dependency array controls when the effect runs. Empty [] means run once. Omitted means run on every render. Values inside trigger re-runs.", ["Controls when the effect re-runs based on value changes", true], ["Lists the packages the effect depends on", false], ["Sets the priority level of the effect", false], ["Declares which APIs the effect calls", false]),
      ], [
        R("React Official Docs", "React documentation", "https://react.dev/", "documentation"),
        R("React Hooks Guide", "Using React Hooks", "https://react.dev/reference/react", "documentation"),
        R("Traversy Media - React Crash Course", "React crash course", "https://www.youtube.com/watch?v=w7ejDZ8SWv8", "video"),
      ]),
    ),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACK 4: Java
  // ═══════════════════════════════════════════════════════════════════════════
  await createTrack({
    name: "Java", description: "Master Java from fundamentals to enterprise — OOP, Collections, Streams, Spring Boot, and testing.",
    longDescription: "Comprehensive Java track covering language syntax, object-oriented programming, Collections Framework, Streams API, Spring Boot, JPA, and testing with JUnit and Mockito.",
    icon: "☕", color: "#ED8B00", difficulty: "Beginner to Expert", popularity: 93,
  }, [
    SD("Java Fundamentals", "Java basics, types, control flow, arrays, and exception handling", 1,
      C("Variables & Control Flow", "Primitive types, operators, conditionals, loops", 1, [
        Q("What is the size of an int in Java?", 1.0, "int is 32 bits (4 bytes) in Java. Range: -2^31 to 2^31-1.", ["32 bits (4 bytes)", true], ["64 bits (8 bytes)", false], ["16 bits (2 bytes)", false], ["128 bits (16 bytes)", false]),
        Q("What is the default value of a boolean instance variable?", 1.2, "boolean defaults to false. All primitive instance variables have default values (0 for numbers, false for boolean).", ["false", true], ["true", false], ["null", false], ["0", false]),
        Q("How does the switch statement work with strings in Java?", 1.4, "Java 7+ supports String in switch statements. The comparison is case-sensitive and uses String.equals().", ["Java 7+ supports String in switch with case-sensitive comparison", true], ["String is not supported in switch statements", false], ["Only enum types work in switch", false], ["String comparison in switch is case-insensitive", false]),
        Q("What is the difference between break and continue in loops?", 1.1, "break exits the loop entirely. continue skips the current iteration and moves to the next one.", ["break exits loop, continue skips to next iteration", true], ["break skips iteration, continue exits loop", false], ["Both exit the loop", false], ["Both skip to next iteration", false]),
      ], [
        R("Java Language Specification", "Official Java specification", "https://docs.oracle.com/javase/specs/", "documentation"),
        R("Java Tutorials - Oracle", "Official Java tutorials", "https://docs.oracle.com/javase/tutorial/", "documentation"),
        R("Programming with Mosh - Java", "Java programming course", "https://www.youtube.com/watch?v=eIrMbAQSU34", "video"),
      ]),
      C("Arrays & Strings", "Array manipulation, String immutability, StringBuilder", 2, [
        Q("Are Strings mutable in Java?", 1.0, "Strings are immutable in Java. Any 'modification' creates a new String object. Use StringBuilder for mutable strings.", ["No, Strings are immutable", true], ["Yes, Strings can be modified in place", false], ["Strings are mutable only in certain Java versions", false], ["Strings are mutable when using the new keyword", false]),
        Q("What does StringBuilder provide over String concatenation?", 1.3, "StringBuilder is mutable and efficient for repeated concatenations. String + creates many intermediate objects.", ["Mutable and efficient for repeated string operations", true], ["Thread-safe alternative to String", false], ["Shorter syntax than String concatenation", false], ["Automatic string encoding", false]),
        Q("How do you find the length of an array in Java?", 1.0, "Arrays have a length property (not a method). String.length() is a method.", [".length property (e.g., arr.length)", true], [".length() method (e.g., arr.length())", false], [".size() method", false], [".getLength() method", false]),
      ], [
        R("Java String Documentation", "String class API", "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/String.html", "documentation"),
      ]),
      C("Exception Handling", "try-catch-finally, checked vs unchecked exceptions, custom exceptions", 3, [
        Q("What is the difference between checked and unchecked exceptions?", 1.4, "Checked exceptions (extends Exception) MUST be caught or declared. Unchecked (extends RuntimeException) don't need to be.", ["Checked exceptions must be caught/declared; unchecked are not required to be", true], ["Unchecked must be caught; checked don't", false], ["Both must always be caught", false], ["Neither needs to be caught", false]),
        Q("What is the purpose of the 'finally' block?", 1.1, "The finally block ALWAYS executes — whether an exception is thrown or not. It's used for cleanup (closing files, connections).", ["Always executes for cleanup regardless of exception", true], ["Executes only if an exception is caught", false], ["Executes only if no exception occurs", false], ["Executes before the try block for setup", false]),
        Q("What is try-with-resources in Java 7+?", 1.5, "try-with-resources automatically closes resources (AutoCloseable) when the try block completes. No need for explicit finally.", ["Automatically closes resources implementing AutoCloseable", true], ["A try block that catches all exception types", false], ["A resource management tool for CPU optimization", false], ["An alternative to the synchronized keyword", false]),
      ], [
        R("Java Exception Handling", "Exceptions tutorial", "https://docs.oracle.com/javase/tutorial/essential/exceptions/", "documentation"),
      ]),
    ),
    SD("Java OOP & Collections", "Object-oriented programming, Collections Framework, Generics", 2,
      C("Classes & Inheritance", "Class structure, inheritance, abstract classes, interfaces", 1, [
        Q("Can a Java class extend multiple classes?", 1.0, "Java supports single inheritance — a class can extend only ONE class. But it can implement MULTIPLE interfaces.", ["No, Java does not support multiple class inheritance", true], ["Yes, Java supports multiple inheritance via classes", false], ["Only interfaces can have multiple inheritance", false], ["Yes, using the 'extends' keyword multiple times", false]),
        Q("What is the difference between abstract class and interface?", 1.4, "Abstract classes can have state (fields) and constructors; interfaces define contracts (behavior). Java 8+ interfaces can have default methods.", ["Abstract classes can have state/constructors; interfaces define contracts", true], ["Interfaces can have state; abstract classes cannot", false], ["They are completely interchangeable", false], ["Abstract classes cannot have methods with bodies", false]),
        Q("What is polymorphism in Java?", 1.2, "Polymorphism allows objects of different types to respond to the same method call. Achieved via method overriding (runtime) and overloading (compile-time).", ["Objects of different types respond to the same method call", true], ["A class having multiple constructors", false], ["Converting one type to another", false], ["Protecting data from external access", false]),
        Q("What keyword prevents a class from being inherited?", 1.1, "The 'final' keyword prevents inheritance. A final class cannot be extended; a final method cannot be overridden.", ["final", true], ["static", false], ["private", false], ["sealed", false]),
      ], [
        R("Java OOP Guide", "Object-oriented programming concepts", "https://docs.oracle.com/javase/tutorial/java/concepts/", "documentation"),
        R("Baeldung - Java OOP", "OOP principles in Java", "https://www.baeldung.com/java-oop", "article"),
      ]),
      C("Collections Framework", "List, Set, Map, Queue, Collections utility class", 2, [
        Q("What is the difference between ArrayList and LinkedList?", 1.3, "ArrayList uses dynamic array (fast random access, slow insertion/deletion). LinkedList uses doubly-linked list (fast insertion/deletion, slow random access).", ["ArrayList: array-backed, fast access; LinkedList: linked nodes, fast insertion", true], ["ArrayList is for primitives; LinkedList for objects", false], ["ArrayList is synchronized; LinkedList is not", false], ["They are functionally identical", false]),
        Q("How does a HashSet determine element uniqueness?", 1.4, "HashSet uses hashCode() and equals() methods. Elements are unique if their hash codes and equals() match.", ["Uses hashCode() and equals() methods", true], ["Uses compareTo() method", false], ["Uses the == operator for reference equality", false], ["Uses the memory address of the object", false]),
        Q("What is the difference between HashMap and TreeMap?", 1.4, "HashMap uses hash table (O(1) operations, no ordering). TreeMap uses Red-Black tree (O(log n), sorted by keys).", ["HashMap: O(1), unordered; TreeMap: O(log n), sorted by keys", true], ["HashMap is for single-threaded; TreeMap is thread-safe", false], ["HashMap stores key-value pairs; TreeMap stores values only", false], ["HashMap allows null keys; TreeMap does not allow null values", false]),
        Q("How do you make a collection thread-safe?", 1.5, "Use Collections.synchronizedList()/Map()/Set() or concurrent collections like ConcurrentHashMap and CopyOnWriteArrayList.", ["Collections.synchronized*() or java.util.concurrent collections", true], ["Use the volatile keyword on the collection variable", false], ["Collections are inherently thread-safe", false], ["Use the synchronized keyword on each method call", false]),
      ], [
        R("Java Collections Tutorial", "Collections Framework guide", "https://docs.oracle.com/javase/tutorial/collections/", "documentation"),
        R("Baeldung - Java Collections", "Collections guide with examples", "https://www.baeldung.com/java-collections", "article"),
      ]),
      C("Generics & Streams", "Generic types, type erasure, Streams API, lambda expressions", 3, [
        Q("What is type erasure in Java generics?", 1.5, "Type erasure removes generic type information at compile time, replacing type parameters with their bounds or Object. This ensures backward compatibility.", ["Generic type info removed at compile time for backward compatibility", true], ["Generic types are preserved at runtime", false], ["Type erasure makes generics slower than raw types", false], ["Type erasure only applies to wildcard types", false]),
        Q("What is a lambda expression in Java?", 1.2, "Lambda expressions provide a concise way to implement functional interfaces (interfaces with one abstract method) using -> syntax.", ["A concise way to implement functional interfaces", true], ["A new type of anonymous inner class", false], ["A way to create threads in Java", false], ["A mathematical expression evaluator", false]),
        Q("What does the Stream.map() operation do?", 1.3, "map() is an intermediate operation that transforms each element using a function, returning a new Stream.", ["Transforms each element using a function, returns new Stream", true], ["Filters elements that match a predicate", false], ["Reduces stream to a single value", false], ["Sorts elements in natural order", false]),
        Q("What is the difference between intermediate and terminal operations?", 1.4, "Intermediate ops (map, filter) return Stream and are lazy. Terminal ops (collect, forEach) trigger execution and close the stream.", ["Intermediate return Stream (lazy); Terminal trigger execution", true], ["Intermediate close the stream; Terminal return Stream", false], ["Both are lazy operations", false], ["Terminal operations can be chained indefinitely", false]),
      ], [
        R("Java Streams Guide", "Stream API documentation", "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/package-summary.html", "documentation"),
        R("Baeldung - Java Streams", "Stream API guide with examples", "https://www.baeldung.com/java-streams", "article"),
      ]),
    ),
    SD("Spring Boot & Testing", "Spring Boot, JPA, REST APIs, JUnit testing", 3,
      C("Spring Boot Basics", "Dependency injection, auto-configuration, REST controllers", 1, [
        Q("What annotation starts a Spring Boot application?", 1.0, "@SpringBootApplication is a convenience annotation combining @Configuration, @EnableAutoConfiguration, and @ComponentScan.", ["@SpringBootApplication", true], ["@SpringApplication", false], ["@EnableBoot", false], ["@BootApplication", false]),
        Q("What is dependency injection in Spring?", 1.3, "DI is a pattern where objects receive their dependencies from an external source (Spring container) rather than creating them internally.", ["Objects receive dependencies from Spring container instead of creating them", true], ["Objects create their own dependencies internally", false], ["A way to inject configuration properties", false], ["An alternative to the Factory pattern", false]),
        Q("What annotation creates a REST endpoint in Spring Boot?", 1.1, "@RestController combines @Controller and @ResponseBody, making a class handle REST API requests.", ["@RestController", true], ["@WebService", false], ["@Endpoint", false], ["@API", false]),
        Q("What is the purpose of @Autowired?", 1.2, "@Autowired tells Spring to inject a bean dependency automatically. It can be used on constructors, setters, or fields.", ["Marks a dependency for automatic injection by Spring", true], ["Creates a new instance of a class", false], ["Configures a database connection", false], ["Enables auto-recompilation on code changes", false]),
      ], [
        R("Spring Boot Guide", "Official Spring Boot documentation", "https://spring.io/projects/spring-boot", "documentation"),
        R("Baeldung - Spring Boot", "Spring Boot tutorials", "https://www.baeldung.com/spring-boot", "article"),
      ]),
      C("Testing with JUnit & Mockito", "Unit testing, mocking, assertions, test lifecycle", 2, [
        Q("What annotation marks a method as a test in JUnit 5?", 1.0, "@Test marks a method as a test case. JUnit 5's @Test is from org.junit.jupiter.api.", ["@Test", true], ["@TestCase", false], ["@Run", false], ["@TestMe", false]),
        Q("What does Mockito.mock() do?", 1.3, "mock() creates a mock object that has no real behavior unless explicitly stubbed. Used to isolate the unit under test.", ["Creates a mock instance without real behavior", true], ["Creates a real instance of the class", false], ["Verifies that a method was called", false], ["Initializes the test class", false]),
        Q("What is the purpose of @BeforeEach in JUnit 5?", 1.2, "@BeforeEach methods run BEFORE each test method. Used for setup: initializing objects, opening connections, etc.", ["Method that runs before each test case for setup", true], ["Method that runs after each test case for cleanup", false], ["Method that runs once before all tests", false], ["Method that validates test configuration", false]),
        Q("What does assertThrows() verify in JUnit?", 1.4, "assertThrows() verifies that a specific exception is thrown by the code inside the lambda. Fails if no exception or wrong type.", ["Verifies that a specific exception is thrown", true], ["Verifies that no exception is thrown", false], ["Throws an exception for testing purposes", false], ["Catches and logs all exceptions", false]),
      ], [
        R("JUnit 5 User Guide", "Official JUnit documentation", "https://junit.org/junit5/docs/current/user-guide/", "documentation"),
        R("Mockito Documentation", "Mockito testing framework", "https://site.mockito.org/documentation", "documentation"),
      ]),
    ),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACK 5: Go
  // ═══════════════════════════════════════════════════════════════════════════
  await createTrack({
    name: "Go", description: "Master Go programming — syntax, concurrency, HTTP servers, testing, and best practices.",
    longDescription: "Comprehensive Go track covering language fundamentals, goroutines and channels, HTTP web services, testing, and idiomatic Go patterns.",
    icon: "🔵", color: "#00ADD8", difficulty: "Beginner to Advanced", popularity: 88,
  }, [
    SD("Go Fundamentals", "Go syntax, types, control flow, functions, and packages", 1,
      C("Variables & Types", "Go types, zero values, type inference, constants", 1, [
        Q("How do you declare a variable in Go?", 1.0, "Go uses 'var' keyword or ':=' short declaration. Short declaration (:=) is used inside functions and infers type.", ["var x int or x := value (short declaration)", true], ["x = 5 only", false], ["let x = 5 (JavaScript style)", false], ["int x = 5 (Java style)", false]),
        Q("What is the zero value of a pointer in Go?", 1.2, "nil is the zero value for pointers, slices, maps, channels, functions, and interfaces.", ["nil", true], ["0", false], ["false", false], ["undefined", false]),
        Q("What is the difference between var and := in Go?", 1.1, "var can be used at package level (outside functions). := (short declaration) can only be used inside functions and requires initialization.", ["var: package level; := function level only with initialization", true], [":= can be used anywhere; var only in functions", false], ["var creates global vars; := creates local vars", false], ["There is no difference", false]),
        Q("What does 'const' mean in Go?", 1.1, "Constants in Go are immutable values known at compile time. They can be characters, strings, booleans, or numeric values.", ["Immutable values known at compile time", true], ["Variables that cannot be exported", false], ["Function parameters that cannot change", false], ["Global variables with restricted access", false]),
      ], [
        R("Official Go Tour", "Interactive Go introduction", "https://go.dev/tour/welcome/1", "documentation"),
        R("Effective Go", "Idiomatic Go patterns", "https://go.dev/doc/effective_go", "documentation"),
        R("Go by Example", "Learn Go by examples", "https://gobyexample.com/", "article"),
      ]),
      C("Functions & Structs", "Function types, multiple returns, methods, structs, interfaces", 2, [
        Q("Does Go support multiple return values?", 1.0, "Yes, Go functions can return multiple values. This is commonly used for returning a result and an error.", ["Yes, functions can return multiple values", true], ["No, Go only supports single return values", false], ["Only via pointer parameters", false], ["Only via tuple types", false]),
        Q("How does error handling work in Go?", 1.3, "Go uses explicit error returns (no exceptions). Functions return error as the last return value. Errors are checked with if err != nil.", ["Explicit error returns checked with if err != nil (no exceptions)", true], ["Try-catch exception handling like Java", false], ["Errors are automatically logged and ignored", false], ["Error handling via global error handler", false]),
        Q("What is the difference between a method and a function in Go?", 1.3, "A method has a receiver (value or pointer) attached to a type. A function has no receiver. Methods are called on instances of the type.", ["Methods have a receiver; functions do not", true], ["Functions can be exported; methods cannot", false], ["Methods can only exist in packages; functions are global", false], ["There is no difference", false]),
        Q("How do you define a struct in Go?", 1.0, "Structs are defined using the 'type' and 'struct' keywords: type Person struct { Name string }", ["Using 'type X struct { fields }'", true], ["Using 'class Person { fields }'", false], ["Using 'struct Person { fields }'", false], ["Using 'object Person { fields }'", false]),
      ], [
        R("Go Methods & Interfaces", "Methods and interfaces", "https://go.dev/tour/methods/1", "documentation"),
      ]),
    ),
    SD("Concurrency & HTTP", "Goroutines, channels, select, HTTP servers, middleware", 2,
      C("Goroutines & Channels", "Goroutines, channels, select statement, sync primitives", 1, [
        Q("How do you start a goroutine in Go?", 1.0, "Prefix a function call with 'go': go myFunction(). Goroutines run concurrently with other goroutines.", ["Use the 'go' keyword: go myFunction()", true], ["Use the 'async' keyword", false], ["Use the 'thread' keyword", false], ["Use the 'run' keyword", false]),
        Q("What is a channel in Go?", 1.2, "A channel is a typed conduit for communication between goroutines. Created with make(chan Type).", ["A typed conduit for communication between goroutines", true], ["A network socket for HTTP communication", false], ["A buffer for temporary data storage", false], ["A configuration pipeline for servers", false]),
        Q("What does the 'select' statement do?", 1.5, "select blocks until one of its cases can run (channel operation ready). It's like a switch but for channel operations.", ["Blocks until one channel operation is ready", true], ["Selects random values from a slice", false], ["Filters elements from a channel", false], ["Selects which channel to create", false]),
        Q("How do you prevent data races in Go?", 1.5, "Use mutexes (sync.Mutex), channels for communication, or atomic operations. Also use the -race flag for detection.", ["Mutexes, channels (share by communicating), atomic operations", true], ["Use the volatile keyword on variables", false], ["All Go code is automatically thread-safe", false], ["Use synchronized blocks like Java", false]),
      ], [
        R("Go Concurrency", "Concurrency patterns", "https://go.dev/tour/concurrency/1", "documentation"),
        R("Go Concurrency Patterns", "Advanced concurrency talk", "https://www.youtube.com/watch?v=f6kdp27TYZs", "video"),
      ]),
      C("HTTP Servers & Testing", "net/http, routing, middleware, testing with go test", 2, [
        Q("What package handles HTTP servers in Go?", 1.0, "The 'net/http' package provides HTTP client and server implementations. It's part of Go's standard library.", ["net/http", true], ["http", false], ["server", false], ["web", false]),
        Q("What is an http.Handler in Go?", 1.3, "http.Handler is an interface with ServeHTTP(ResponseWriter, *Request). Anything implementing it can handle HTTP requests.", ["An interface with ServeHTTP(ResponseWriter, *Request)", true], ["A function that starts an HTTP server", false], ["A middleware configuration struct", false], ["A connection pool for HTTP clients", false]),
        Q("How do you run tests in Go?", 1.0, "Use 'go test' command. Test files end with _test.go and functions start with Test. No assertions library needed.", ["go test command with _test.go files and TestXxx functions", true], ["npm test like JavaScript", false], ["Java-style JUnit annotations", false], ["Python-style pytest", false]),
        Q("What is table-driven testing in Go?", 1.4, "Table-driven tests define test cases as struct slices, iterating over them in a test function. This is the idiomatic Go testing pattern.", ["Defining test cases as struct slices iterated in a loop", true], ["Using a database table to store test data", false], ["Testing all functions in a package at once", false], ["Generating tests from SQL schemas", false]),
      ], [
        R("net/http Package", "HTTP server and client", "https://pkg.go.dev/net/http", "documentation"),
        R("Go Testing Guide", "Testing with go test", "https://go.dev/doc/code#Testing", "documentation"),
        R("Go by Example - HTTP", "HTTP servers example", "https://gobyexample.com/http-servers", "article"),
      ]),
    ),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACK 6: Rust
  // ═══════════════════════════════════════════════════════════════════════════
  await createTrack({
    name: "Rust", description: "Master Rust systems programming — ownership, borrowing, traits, error handling, and async.",
    longDescription: "Comprehensive Rust track covering language fundamentals, ownership/borrowing system, traits and generics, error handling, async programming, and systems programming patterns.",
    icon: "🦀", color: "#DEA584", difficulty: "Intermediate to Advanced", popularity: 85,
  }, [
    SD("Rust Fundamentals", "Rust syntax, ownership, borrowing, and lifetimes", 1,
      C("Variables & Ownership", "Mutability, shadowing, ownership rules, move semantics", 1, [
        Q("Which of the following is NOT an ownership rule in Rust?", 1.0, "The three ownership rules: (1) Each value has one owner, (2) Only one owner at a time, (3) Value is dropped when owner goes out of scope. References are NOT owners.", ["References own the values they point to", true], ["Each value has exactly one owner at a time", false], ["When the owner goes out of scope, the value is dropped", false], ["There can only be one owner of a value", false]),
        Q("What happens when you assign one variable to another in Rust?", 1.2, "For types that don't implement Copy, the value is MOVED. The original variable can no longer be used.", ["The value is moved, original variable becomes invalid", true], ["The value is deep-copied", false], ["A reference is created", false], ["The program panics", false]),
        Q("How do you create a mutable variable in Rust?", 1.0, "Use the 'let mut' keyword: let mut x = 5;. Without 'mut', variables are immutable by default.", ["Use 'let mut' keyword", true], ["Use 'let var' keyword", false], ["All variables are mutable by default", false], ["Use 'let mut' on the variable type", false]),
        Q("What is shadowing in Rust?", 1.3, "Shadowing lets you declare a new variable with the same name as a previous one, effectively hiding the previous binding.", ["Declaring a new variable with the same name, hiding the previous one", true], ["A variable that cannot be accessed", false], ["Creating a reference to a variable", false], ["A type of compiler optimization", false]),
      ], [
        R("The Rust Book - Ownership", "Official ownership guide", "https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html", "documentation"),
        R("Rust by Example", "Learn Rust with examples", "https://doc.rust-lang.org/stable/rust-by-example/", "documentation"),
        R("Rustlings Course", "Interactive Rust exercises", "https://github.com/rust-lang/rustlings", "article"),
      ]),
      C("Borrowing & Lifetimes", "References, borrowing rules, lifetime annotations", 2, [
        Q("What are the two rules of borrowing in Rust?", 1.5, "(1) You can have one mutable reference OR any number of immutable references, (2) References must always be valid (no dangling pointers).", ["One mutable XOR many immutable; References must always be valid", true], ["Many mutable XOR one immutable; References are optional", false], ["Unlimited references of any kind", false], ["Mutable references are not allowed", false]),
        Q("What is a dangling reference in Rust?", 1.4, "A reference that points to memory that has been freed. Rust's borrow checker prevents dangling references at compile time.", ["Reference to memory that has been freed (prevented by compile-time checks)", true], ["A reference that points to null", false], ["A mutable reference to a read-only value", false], ["A reference that hasn't been initialized", false]),
        Q("What does the ' lifetime annotation mean?", 1.5, "'a is a lifetime parameter that specifies how long a reference is valid. The compiler ensures references don't outlive their data.", ["A generic lifetime parameter ensuring references stay valid", true], ["The starting point of a reference in memory", false], ["The address of a variable on the stack", false], ["A type annotation for reference counting", false]),
        Q("What is the elision (implicit lifetime) rule?", 1.5, "Rust automatically adds lifetime annotations for common patterns (each input reference gets its own lifetime, output gets same as input).", ["Compiler automatically infers lifetimes for common patterns", true], ["Lifetimes are never needed in function signatures", false], ["All lifetimes must be manually annotated", false], ["Elision only works with structs", false]),
      ], [
        R("Rust Book - References & Borrowing", "References and borrowing", "https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html", "documentation"),
        R("Rust Book - Lifetimes", "Lifetime annotations", "https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html", "documentation"),
      ]),
    ),
    SD("Traits & Error Handling", "Traits, generics, Result/Option, custom errors", 2,
      C("Traits & Generics", "Trait definitions, implementations, generics, trait bounds", 1, [
        Q("What is a trait in Rust?", 1.0, "A trait defines shared behavior (like interfaces in other languages). Types implement traits to provide that behavior.", ["A collection of methods that types can implement (like interfaces)", true], ["A type of struct with special properties", false], ["A debugging tool for tracking variable types", false], ["A memory allocation strategy", false]),
        Q("What is a generic type parameter in Rust?", 1.2, "Generics allow functions and structs to work with multiple types while maintaining type safety at compile time.", ["Allows code to work with multiple types while maintaining type safety", true], ["A type that can change at runtime", false], ["A type that is automatically generated", false], ["A placeholder for any value type", false]),
        Q("What does the 'impl' keyword do in Rust?", 1.1, "'impl' is used to implement methods for a type, or to implement a trait for a type.", ["Implements methods on a type or implements a trait for a type", true], ["Imports a module into the current scope", false], ["Declares a new type", false], ["Creates a new instance of a type", false]),
        Q("What is a trait bound in Rust?", 1.4, "Trait bounds constrain generic types to only those that implement specific traits. Written as fn foo<T: TraitName>(x: T).", ["Constrains generics to types implementing specific traits", true], ["A limit on how many traits a type can implement", false], ["A runtime check for trait implementation", false], ["A way to disable trait implementations", false]),
      ], [
        R("Rust Book - Traits", "Traits documentation", "https://doc.rust-lang.org/book/ch10-02-traits.html", "documentation"),
        R("Rust Book - Generics", "Generic types", "https://doc.rust-lang.org/book/ch10-01-syntax.html", "documentation"),
      ]),
      C("Error Handling", "Result and Option types, pattern matching, custom errors", 2, [
        Q("What is the Result type in Rust?", 1.1, "Result<T, E> is an enum used for recoverable errors. It has two variants: Ok(T) for success and Err(E) for failure.", ["Result<T, E> enum: Ok(T) for success, Err(E) for failure", true], ["A type that always panics on error", false], ["A logging mechanism for runtime errors", false], ["A type that only stores error codes", false]),
        Q("What does the '?' operator do in Rust?", 1.3, "The ? operator propagates errors: if the Result is Ok, it unwraps the value; if Err, it returns early with the error.", ["Unwraps Ok value or returns early with Err", true], ["Marks a function as error-prone", false], ["Converts any error to a panic", false], ["Suppresses compiler warnings about errors", false]),
        Q("What is the difference between unwrap() and expect()?", 1.2, "unwrap() panics on Err with a default message. expect() panics with a custom message on Err.", ["unwrap(): default panic message; expect(): custom panic message", true], ["unwrap() returns the error; expect() panics", false], ["expect() returns the error; unwrap() panics", false], ["There is no difference", false]),
        Q("What does Option<T> represent?", 1.0, "Option<T> represents an optional value: Some(T) means a value exists, None means no value. Used instead of null.", ["An optional value: Some(T) or None (replaces null)", true], ["An optional function parameter", false], ["A configuration option for the compiler", false], ["A type that can be either T or any other type", false]),
      ], [
        R("Rust Book - Error Handling", "Error handling with Result and Option", "https://doc.rust-lang.org/book/ch09-00-error-handling.html", "documentation"),
        R("Rust by Example - Error Handling", "Error handling examples", "https://doc.rust-lang.org/rust-by-example/error.html", "documentation"),
      ]),
    ),
    SD("Advanced Rust", "Pattern matching, closures, iterators, async/await", 3,
      C("Pattern Matching & Enums", "match, if let, enums with data, exhaustive patterns", 1, [
        Q("What does the match expression guarantee in Rust?", 1.2, "Match expressions must be EXHAUSTIVE — every possible value must be handled. The compiler ensures this at compile time.", ["Exhaustive — all possible values must be handled (compile-time checked)", true], ["Patterns are optional — unmatched values are ignored", false], ["Only the first matching branch executes", false], ["Matches are lazy — they only run when needed", false]),
        Q("What is 'if let' syntax in Rust?", 1.3, "'if let' is concise pattern matching for when you only care about one pattern. It's syntactic sugar for match with one arm.", ["Concise pattern matching for single-pattern cases (sugar for match)", true], ["A conditional with no pattern matching", false], ["A way to declare variables in if statements", false], ["An alternative to the ternary operator", false]),
        Q("Can enums hold data in Rust?", 1.0, "Yes! Rust enums can hold data of any type. Each variant can have different types and amounts of associated data.", ["Yes, enum variants can hold different types and amounts of data", true], ["No, enums are simple C-style enumerations only", false], ["Yes, but only one variant can hold data", false], ["Enums can only hold primitive types", false]),
      ], [
        R("Rust Book - Enums & Pattern Matching", "Enums, match, and if let", "https://doc.rust-lang.org/book/ch06-00-enums.html", "documentation"),
      ]),
      C("Closures & Iterators", "Closures, iterators, functional programming patterns", 2, [
        Q("What syntax is used for closures in Rust?", 1.0, "Closures use || { } syntax: |params| { body }. They can capture variables from their enclosing scope.", ["|params| { body } syntax", true], ["function(params) { body }", false], ["lambda params: body", false], ["fn(params) => body", false]),
        Q("What are the Fn, FnMut, and FnOnce traits?", 1.5, "Fn: takes immutable references (can be called multiple times). FnMut: takes mutable references. FnOnce: can be called once (consumes captured values).", ["Fn: immutable; FnMut: mutable; FnOnce: can be called once", true], ["Fn: once; FnMut: multiple; FnOnce: never", false], ["They all behave identically", false], ["Fn: for async code; FnMut: for sync code", false]),
        Q("What is the Iterator trait?", 1.2, "The Iterator trait requires a next() method returning Option<Item>. It enables for loops and iterator adapters (map, filter, etc.).", ["Trait with next() -> Option<Item> enabling loops and adapters", true], ["A trait for iterating over threads", false], ["A trait for looping in async code", false], ["A trait that provides random access to elements", false]),
        Q("What does the collect() method do?", 1.2, "collect() transforms an iterator into a collection type (Vec, HashMap, etc.). The target type is inferred from context.", ["Transforms an iterator into a collection (type inferred)", true], ["Collects garbage memory in the program", false], ["Gathers all elements into a single value", false], ["Collects elements that match a condition", false]),
      ], [
        R("Rust Book - Closures", "Closures in Rust", "https://doc.rust-lang.org/book/ch13-01-closures.html", "documentation"),
        R("Rust Book - Iterators", "Iterator pattern", "https://doc.rust-lang.org/book/ch13-02-iterators.html", "documentation"),
      ]),
    ),
  ]);
// ═══════════════════════════════════════════════════════════════════════════
// TRACK 7: Angular Frontend
// ═══════════════════════════════════════════════════════════════════════════
await createTrack({
  name: "Angular",
  description: "Master Angular from fundamentals to enterprise — components, RxJS, state management, routing, and testing.",
  longDescription: "Comprehensive Angular track covering component architecture, TypeScript integration, RxJS observables, NgRx state management, Angular routing, reactive forms, PWA capabilities, testing with Jasmine/Karma, and performance optimization.",
  icon: "🅰️", color: "#DD0031", difficulty: "Beginner to Expert", popularity: 90,
}, [
  SD("Angular Fundamentals", "Components, modules, templates, data binding, and dependency injection", 1,
    C("Components & Modules", "Component architecture, NgModules, component lifecycle, templates", 1, [
      Q("What decorator marks a class as an Angular component?", 1.0, "The @Component decorator marks a class as an Angular component, providing metadata like selector, template, and styles.", ["@Component", true], ["@NgModule", false], ["@Directive", false], ["@Injectable", false]),
      Q("What is the purpose of NgModules in Angular?", 1.2, "NgModules organize related components, directives, pipes, and services into cohesive units. Every Angular app has at least one module (AppModule).", ["To organize related code into cohesive functional units", true], ["To handle HTTP requests", false], ["To manage component styles", false], ["To define routing configurations", false]),
      Q("Which lifecycle hook is called after a component's view has been fully initialized?", 1.3, "ngAfterViewInit() is called after the component's view and child views have been fully initialized and rendered.", ["ngAfterViewInit()", true], ["ngOnInit()", false], ["ngOnChanges()", false], ["ngAfterContentInit()", false]),
      Q("What is the difference between constructor and ngOnInit()?", 1.4, "Constructor is called first by TypeScript/JavaScript engine. ngOnInit() is called after Angular has set up input properties, making it safe to access them.", ["Constructor: JS engine; ngOnInit: after Angular sets inputs", true], ["They are called at the exact same time", false], ["ngOnInit is called before the constructor", false], ["Constructor is for fetching data, ngOnInit for initialization", false]),
    ], [
      R("Angular Components Overview", "Official Angular component documentation", "https://angular.dev/guide/components", "documentation"),
      R("Angular Lifecycle Hooks", "Complete lifecycle hook reference", "https://angular.dev/guide/lifecycle-hooks", "documentation"),
      R("Angular NgModules Guide", "Understanding Angular modules", "https://angular.dev/guide/ngmodules", "documentation"),
    ]),
    C("Data Binding & Directives", "Interpolation, property binding, event binding, structural and attribute directives", 2, [
      Q("Which syntax is used for two-way data binding in Angular?", 1.0, "The [()] banana-in-a-box syntax combines property binding and event binding for two-way data binding with ngModel.", ["[(ngModel)]", true], ["{{ngModel}}", false], ["[ngModel]", false], ["(ngModel)", false]),
      Q("What does the *ngFor structural directive do?", 1.0, "*ngFor iterates over a collection and renders a template for each item. It's Angular's equivalent of a for loop in templates.", ["Repeats a template for each item in a collection", true], ["Conditionally shows or hides an element", false], ["Applies a CSS class conditionally", false], ["Creates a form control for each item", false]),
      Q("What is the difference between attribute and structural directives?", 1.3, "Structural directives (*ngIf, *ngFor) change the DOM layout by adding/removing elements. Attribute directives ([ngClass], [ngStyle]) change appearance or behavior.", ["Structural: change DOM layout; Attribute: change appearance/behavior", true], ["Attribute: change DOM; Structural: change behavior", false], ["They are the same thing", false], ["Structural only work on components, attributes on elements", false]),
      Q("What does the @Input() decorator do?", 1.1, "@Input() makes a component property bindable from a parent component, allowing data to flow into the child.", ["Allows a parent component to pass data into this component property", true], ["Emits events from the component to its parent", false], ["Marks a property as read-only", false], ["Injects a service into the component", false]),
    ], [
      R("Angular Property Binding", "Property binding documentation", "https://angular.dev/guide/templates/property-binding", "documentation"),
      R("Angular Structural Directives", "Structural directives guide", "https://angular.dev/guide/directives/structural-directives", "documentation"),
    ]),
    C("Services & Dependency Injection", "Creating services, DI hierarchy, providers, injection tokens", 3, [
      Q("How do you make a class an injectable service in Angular?", 1.0, "Use the @Injectable({ providedIn: 'root' }) decorator. This creates a singleton service available throughout the app.", ["@Injectable({ providedIn: 'root' })", true], ["@Service()", false], ["@Component({ providers: [] })", false], ["@Inject({ singleton: true })", false]),
      Q("What is the default behavior of Angular's dependency injection hierarchy?", 1.3, "Angular's DI is hierarchical. Services can be provided at root (singleton), module, or component level. Each injector creates a child injector with access to parent services.", ["Hierarchical: root → module → component level with inheritance", true], ["Services are always singletons across the entire app", false], ["Each component gets a completely separate injector", false], ["Services must be explicitly passed to child components", false]),
      Q("What is an InjectionToken used for?", 1.4, "InjectionToken creates a unique token for non-class dependencies (interfaces, objects, strings), preventing naming collisions.", ["A unique token for non-class dependencies to prevent naming collisions", true], ["A token for authenticating API requests", false], ["A security token for Angular modules", false], ["A token for lazily loading modules", false]),
      Q("What is the providedIn property in @Injectable?", 1.2, "providedIn determines which injector provides the service. 'root' = app-level singleton. 'platform' = shared across multiple apps. A specific module = scoped to that module.", ["Controls which injector provides the service (root, platform, or specific module)", true], ["Sets the service's dependency order", false], ["Determines if the service is lazy-loaded", false], ["Specifies the service's visibility to other modules", false]),
    ], [
      R("Angular Dependency Injection", "DI guide and concepts", "https://angular.dev/guide/di", "documentation"),
      R("Angular Service Basics", "Creating and using services", "https://angular.dev/tutorials/first-app/04-creating-a-service", "documentation"),
    ]),
  ),
  SD("RxJS & State Management", "Observables, operators, subjects, NgRx, and Signals", 2,
    C("RxJS Observables & Operators", "Observables, Subjects, pipeable operators, higher-order mapping", 1, [
      Q("What is the difference between Observable and Promise?", 1.2, "Observables can emit multiple values over time and are cancellable. Promises emit a single value and cannot be cancelled after creation.", ["Observables: multiple values, cancellable; Promises: single value, not cancellable", true], ["They are the same except syntax", false], ["Promises can emit multiple values, Observables only one", false], ["Observables are always synchronous, Promises async", false]),
      Q("What is a Subject in RxJS?", 1.4, "A Subject is both an Observable (can be subscribed to) and an Observer (can emit values via next()). It's a multicast observable.", ["Both Observable and Observer — multicasts values to all subscribers", true], ["A special type of Promise", false], ["A synchronous version of an Observable", false], ["A deprecated Observable type", false]),
      Q("What is the difference between BehaviorSubject and regular Subject?", 1.3, "BehaviorSubject requires an initial value and replays the last emitted value to new subscribers. Subject has no initial value and doesn't replay.", ["BehaviorSubject: has initial value, replays last value to new subscribers", true], ["Subject has initial value, BehaviorSubject doesn't", false], ["They work identically", false], ["BehaviorSubject can only emit once", false]),
      Q("What does the switchMap operator do?", 1.5, "switchMap maps each value to an inner observable, then switches to the new inner observable, cancelling the previous one. Perfect for search-as-you-type.", ["Switches to a new inner observable, cancelling the previous one", true], ["Merges all inner observables into one stream", false], ["Waits for all inner observables to complete", false], ["Concatenates inner observables in order", false]),
    ], [
      R("RxJS Overview", "Reactive Extensions for JavaScript", "https://rxjs.dev/guide/overview", "documentation"),
      R("Angular RxJS Guide", "Using RxJS with Angular", "https://angular.dev/guide/rxjs", "documentation"),
    ]),
    C("NgRx & Signals", "NgRx store, actions, reducers, effects, Angular Signals", 2, [
      Q("What are the core principles of NgRx?", 1.3, "NgRx follows Redux patterns: single immutable state tree, actions describe state changes, reducers apply actions to produce new state, effects handle side effects.", ["Single state tree, actions, reducers (pure functions), effects for side effects", true], ["Multiple state stores, mutations allowed", false], ["State is stored in component local variables", false], ["NgRx only works with HTTP requests", false]),
      Q("What is the purpose of an Effect in NgRx?", 1.4, "Effects handle side effects like HTTP requests, localStorage, or WebSocket connections. They listen for dispatched actions, perform side effects, and dispatch new actions with results.", ["Handle side effects (HTTP, storage, etc.) and dispatch results as new actions", true], ["Define the initial state of the store", false], ["Combine multiple reducers into one", false], ["Optimize re-rendering of components", false]),
      Q("What are Angular Signals?", 1.5, "Signals are a reactive primitive introduced in Angular 16+. They track dependencies automatically and update the UI efficiently without Zone.js.", ["Reactive primitive with automatic dependency tracking and efficient UI updates", true], ["A replacement for TypeScript generics", false], ["A new type of HTTP client", false], ["Angular-specific CSS custom properties", false]),
      Q("What does a Selector do in NgRx?", 1.2, "Selectors are pure functions that select and derive a slice of state from the NgRx store. They can be memoized for performance.", ["Pure functions that select and derive slices of state with memoization", true], ["Selectors dispatch actions to the store", false], ["Selectors modify state directly", false], ["Selectors manage HTTP caching", false]),
    ], [
      R("NgRx Documentation", "Official NgRx guide", "https://ngrx.io/guide/store", "documentation"),
      R("Angular Signals Guide", "Angular signals documentation", "https://angular.dev/guide/signals", "documentation"),
    ]),
  ),
  SD("Advanced Angular", "Routing, forms, PWA, testing, and performance optimization", 3,
    C("Routing & Navigation", "Router module, lazy loading, guards, resolvers, child routes", 1, [
      Q("How do you set up lazy loading for a feature module in Angular?", 1.3, "Use loadChildren in the route configuration: { path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) }", ["Using loadChildren with dynamic import in route configuration", true], ["Add the module to the AppModule imports array", false], ["Use the @LazyLoad decorator on the module", false], ["Lazy loading is automatic for all modules", false]),
      Q("What is a Route Guard in Angular?", 1.1, "Route guards control access to routes. CanActivate checks if a route can be activated. CanDeactivate checks if a user can leave. CanLoad prevents lazy loading.", ["Controls route access: CanActivate, CanDeactivate, CanLoad, CanActivateChild", true], ["Prevents users from entering invalid URLs", false], ["Encrypts route data for security", false], ["Automatically redirects to 404 pages", false]),
      Q("What does a Resolver do? when is it used?", 1.4, "A Resolver pre-fetches data before navigating to a route. This ensures the component has data ready when it loads, avoiding empty states or loading spinners.", ["Pre-fetches route data before navigation, ensuring component has data ready", true], ["Resolves URL parameter conflicts", false], ["Generates dynamic route paths", false], ["Validates form inputs before submission", false]),
      Q("How do you pass data between routes in Angular?", 1.3, "You can pass data via route params (paramMap), query params (queryParamMap), state object in Router.navigate(), or a shared service.", ["Route params, query params, state object, or shared service", true], ["Only through URL parameters", false], ["Using localStorage only", false], ["Route communication is not supported", false]),
    ], [
      R("Angular Routing Guide", "Complete routing documentation", "https://angular.dev/guide/routing", "documentation"),
      R("Angular Lazy Loading", "Lazy loading modules", "https://angular.dev/guide/ngmodules/lazy-loading", "documentation"),
    ]),
    C("Forms & Testing", "Reactive forms, form validation, unit testing, end-to-end testing", 2, [
      Q("What is the difference between Template-Driven and Reactive Forms?", 1.3, "Template-driven: logic in template, easier for simple forms. Reactive: logic in component class, more scalable, easier to test, better for complex validation.", ["Reactive: logic in component, scalable, testable; Template: logic in template, simple", true], ["Reactive forms use ngModel, template-driven use FormGroup", false], ["Template-driven is newer than reactive forms", false], ["Reactive forms cannot be validated", false]),
      Q("How do you create a custom validator in Reactive Forms?", 1.4, "A custom validator is a function that takes an AbstractControl and returns either null (valid) or a ValidationErrors object (invalid).", ["A function: (control) => null | ValidationErrors", true], ["Using the @Validator decorator on a property", false], ["By extending the Validator class", false], ["Custom validators are not supported", false]),
      Q("What testing framework does Angular CLI use by default?", 1.0, "Angular uses Jasmine (testing framework) with Karma (test runner) by default. TestBed provides Angular-specific testing utilities.", ["Jasmine + Karma (with TestBed for Angular utilities)", true], ["Jest only", false], ["Mocha + Chai", false], ["Cypress is the default unit test framework", false]),
      Q("What is TestBed in Angular testing?", 1.2, "TestBed is Angular's primary testing API. It creates a testing module that mimics the behaviors of NgModules for testing components, services, and directives.", ["Creates a testing module mimicking NgModule behavior for unit tests", true], ["A tool for database testing", false], ["A performance testing framework", false], ["An end-to-end testing tool", false]),
    ], [
      R("Angular Reactive Forms", "Reactive forms documentation", "https://angular.dev/guide/forms/reactive-forms", "documentation"),
      R("Angular Testing Guide", "Testing with TestBed", "https://angular.dev/guide/testing", "documentation"),
    ]),
    C("Performance & PWA", "Change detection, OnPush strategy, lazy loading images, PWA setup", 3, [
      Q("What is the OnPush change detection strategy?", 1.4, "OnPush reduces change detection checks. It only checks a component when: inputs change (immutably), event triggers, or an observable emits. Significantly improves performance.", ["Only checks component on: immutable input changes, events, or observable emissions", true], ["Disables change detection entirely", false], ["Automatically detects all changes without checking", false], ["Only works with NgRx store", false]),
      Q("What tool does Angular provide for PWA support?", 1.2, "Angular Service Worker (@angular/service-worker) provides PWA support including: service worker registration, caching strategies, push notifications, and app shell.", ["@angular/service-worker — service worker registration and caching", true], ["service-worker.js in the root directory", false], ["Workbox integration", false], ["PWA support is not available in Angular", false]),
      Q("How do you optimize the initial bundle size in Angular?", 1.5, "Optimize via: lazy loading modules, Angular CLI budgets, differential loading (modern/legacy bundles), tree-shaking (remove unused code), and using providedIn: 'root'.", ["Lazy loading, budgets, differential loading, tree-shaking, and Scoped DI", true], ["Always bundle everything in a single file", false], ["Disable TypeScript for smaller bundles", false], ["Use JIT compilation instead of AOT", false]),
    ], [
      R("Angular Performance Guide", "Performance optimization strategies", "https://angular.dev/best-practices/performance", "documentation"),
      R("Angular PWA Guide", "Building Progressive Web Apps", "https://angular.dev/ecosystem/service-workers", "documentation"),
    ]),
  ),
]);

// ═══════════════════════════════════════════════════════════════════════════
// TRACK 8: Django Backend (Python)
// ═══════════════════════════════════════════════════════════════════════════
await createTrack({
  name: "Django Backend",
  description: "Master Django — models, views, REST APIs, authentication, Celery, and deployment.",
  longDescription: "Comprehensive Django track covering: ORM and database design, class-based views, Django REST Framework, JWT authentication, Celery for async tasks, caching strategies, testing with pytest, and production deployment tips.",
  icon: "🎯", color: "#092E20", difficulty: "Beginner to Expert", popularity: 92,
}, [
  SD("Django Fundamentals", "Models, ORM, views, templates, URLs, and the Django admin", 1,
    C("Models & ORM", "Model design, relationships, querying, and migrations", 1, [
      Q("What is a Django model?", 1.0, "A Django model is a Python class that subclasses django.db.models.Model and represents a database table. Each attribute is a database field.", ["A Python class that represents a database table", true], ["A JavaScript function for frontend rendering", false], ["A configuration file for the database connection", false], ["An HTML template for displaying data", false]),
      Q("How do you create a one-to-many relationship in Django?", 1.2, "Use ForeignKey field on the child model that points to the parent model. Django automatically creates the reverse relation.", ["ForeignKey field on the child model pointing to the parent", true], ["OneToManyField on the parent model", false], ["ManyToManyField with through model", false], ["Create a separate junction table manually", false]),
      Q("What does the select_related() method do?", 1.4, "select_related() performs a SQL JOIN to retrieve related objects in the same query, reducing database hits. It works with ForeignKey and OneToOneField.", ["Performs SQL JOIN to fetch related objects in a single query", true], ["Prefetches related objects in a separate query", false], ["Selects only specific columns from the table", false], ["Orders the queryset by a related field", false]),
      Q("What is the difference between select_related() and prefetch_related()?", 1.5, "select_related() does a SQL JOIN (for ForeignKey/OneToOne). prefetch_related() does separate queries then joins in Python (for ManyToMany/reverse relations).", ["select_related: SQL JOIN; prefetch_related: separate queries + Python join", true], ["They are identical in behavior", false], ["prefetch_related does SQL JOIN, select_related uses Python join", false], ["select_related is for updating, prefetch_related for reading", false]),
      Q("What command creates and applies database migrations in Django?", 1.1, "python manage.py makemigrations creates migration files. python manage.py migrate applies them to the database.", ["makemigrations (create) + migrate (apply)", true], ["migrate (create) + makemigrations (apply)", false], ["syncdb", false], ["db:migrate", false]),
    ], [
      R("Django Models & Databases", "Official Django model documentation", "https://docs.djangoproject.com/en/5.1/topics/db/models/", "documentation"),
      R("Django QuerySet API", "Complete QuerySet API reference", "https://docs.djangoproject.com/en/5.1/ref/models/querysets/", "documentation"),
      R("Django Migrations Guide", "Understanding and using migrations", "https://docs.djangoproject.com/en/5.1/topics/migrations/", "documentation"),
      R("Very Academy - Django Models", "Django model relationships tutorial", "https://www.youtube.com/watch?v=wM7FhYk4K8E", "video"),
    ]),
    C("Views, Templates & URLs", "Class-based views, function views, template rendering, URL routing", 2, [
      Q("What is the difference between function-based and class-based views in Django?", 1.2, "Function-based views are simple Python functions. Class-based views (CBVs) are classes that provide methods for different HTTP methods (get, post) and built-in generic views.", ["CBVs: class with HTTP method handlers; FBVs: simple Python functions", true], ["FBVs are newer and preferred over CBVs", false], ["CBVs cannot handle POST requests", false], ["FBVs must always return JSON, CBVs return HTML", false]),
      Q("What is the Django template language?", 1.0, "Django's template language is a text-based template system with variables ({{ var }}) and tags ({% tag %}) for rendering dynamic content.", ["Text-based system with {{ }} variables and {% %} tags for dynamic content", true], ["A JavaScript-based templating engine", false], ["A compiled template language similar to Jinja", false], ["An inline Python code execution system", false]),
      Q("What is the purpose of the path() function in urls.py?", 1.0, "path() maps a URL pattern to a view function or class. It takes route, view, and optional kwargs and name parameters.", ["Maps URL patterns to view functions with optional parameters", true], ["Defines the file path to template files", false], ["Creates absolute URL paths for static files", false], ["Configures database connection paths", false]),
      Q("What does the include() function do in URL configuration?", 1.2, "include() references other URL configurations, enabling modular URL structures. It's essential for organizing app-specific URLs.", ["References other URL configurations for modular URL structures", true], ["Includes static files in the template", false], ["Imports Python modules for URL patterns", false], ["Merges multiple URL patterns into one", false]),
    ], [
      R("Django Class-Based Views", "CBV documentation and reference", "https://docs.djangoproject.com/en/5.1/topics/class-based-views/", "documentation"),
      R("Django Templates", "Template language documentation", "https://docs.djangoproject.com/en/5.1/topics/templates/", "documentation"),
      R("Django URL Dispatcher", "URL routing documentation", "https://docs.djangoproject.com/en/5.1/topics/http/urls/", "documentation"),
    ]),
    C("Django Admin Panel", "Customizing the admin interface, ModelAdmin, inlines, actions", 3, [
      Q("How do you register a model with the Django admin?", 1.0, "Use admin.site.register(ModelName) in admin.py. You can also create a ModelAdmin subclass to customize the interface.", ["admin.site.register(ModelName) or custom ModelAdmin subclass", true], ["Add the model to INSTALLED_APPS", false], ["Run python manage.py admin register", false], ["Models are automatically registered", false]),
      Q("What is list_display used for in ModelAdmin?", 1.1, "list_display specifies which model fields (or callables) are displayed as columns in the admin list view.", ["Defines which fields show as columns in the admin list view", true], ["Sets which fields are editable in the list view", false], ["Configures pagination for the list view", false], ["Specifies which filters to show in the sidebar", false]),
      Q("What are admin actions in Django?", 1.3, "Admin actions are functions that perform operations on selected items in the admin list view. Built-in: delete_selected. Custom actions can export data, change statuses, etc.", ["Functions that operate on selected items in the admin list view", true], ["URL shortcuts for admin page navigation", false], ["JavaScript click events for the admin interface", false], ["Permissions that restrict admin page access", false]),
      Q("What are InlineModelAdmin classes used for?", 1.2, "InlineModelAdmin (TabularInline, StackedInline) lets you edit related models on the same page as the parent model. Great for editing ForeignKey relations.", ["Edit related models (ForeignKey) inline on the parent model's admin page", true], ["Create inline CSS styles for the admin panel", false], ["Inline JavaScript for form validation", false], ["Replace the entire admin interface", false]),
    ], [
      R("Django Admin Site", "Complete admin documentation", "https://docs.djangoproject.com/en/5.1/ref/contrib/admin/", "documentation"),
    ]),
  ),
  SD("Django REST Framework & Auth", "DRF serializers, viewsets, routers, JWT authentication, permissions", 2,
    C("DRF Serializers & Views", "ModelSerializer, Serializer, ViewSet, ModelViewSet, routers", 1, [
      Q("What is a Django REST Framework Serializer?", 1.0, "Serializers convert complex data types (like querysets, model instances) to/from JSON. They also validate incoming data.", ["Converts data types to/from JSON with built-in validation", true], ["A system for serializing Python code to bytecode", false], ["A middleware for compressing HTTP responses", false], ["A template engine for generating JSON", false]),
      Q("What is the difference between Serializer and ModelSerializer?", 1.2, "ModelSerializer automatically generates fields and validations based on the model definition. Regular Serializer requires explicit field definitions.", ["ModelSerializer auto-generates from model; Serializer needs explicit fields", true], ["Serializer auto-generates; ModelSerializer needs explicit fields", false], ["They are identical in functionality", false], ["ModelSerializer cannot validate data", false]),
      Q("What does a ViewSet provide in DRF?", 1.3, "A ViewSet groups related actions (list, create, retrieve, update, partial_update, destroy) into a single class. Routers auto-generate URLs for these actions.", ["Groups CRUD actions into one class with auto-generated URLs via routers", true], ["A single-purpose view for one action", false], ["A view that renders HTML templates", false], ["A view that only handles authentication", false]),
      Q("What is the purpose of DefaultRouter in DRF?", 1.1, "DefaultRouter auto-generates URL patterns for ViewSets. It creates URL patterns for list, create, retrieve, update, and delete operations automatically.", ["Auto-generates URL patterns for ViewSets (list, create, detail, etc.)", true], ["Routes HTTP requests to the correct database", false], ["Routes emails to the correct SMTP server", false], ["Routes WebSocket connections", false]),
    ], [
      R("Django REST Framework", "Official DRF documentation", "https://www.django-rest-framework.org/", "documentation"),
      R("DRF Serializers Guide", "Serializer documentation", "https://www.django-rest-framework.org/api-guide/serializers/", "documentation"),
      R("DRF ViewSets & Routers", "ViewSets and routers guide", "https://www.django-rest-framework.org/api-guide/viewsets/", "documentation"),
      R("Very Academy - DRF Tutorial", "Django REST Framework series", "https://www.youtube.com/watch?v=ulOXi5C1jJ0", "video"),
    ]),
    C("Authentication & Permissions", "JWT, session auth, permission classes, throttling", 2, [
      Q("What is the simplest way to add token authentication to Django REST Framework?", 1.2, "Use rest_framework.authtoken for built-in token auth, or django-rest-framework-simplejwt for JWT-based auth with refresh tokens.", ["rest_framework.authtoken (simple tokens) or SimpleJWT (JWT-based)", true], ["Django's built-in session authentication only", false], ["OAuth2 is the only authentication method", false], ["DRF does not support authentication", false]),
      Q("What are permission classes in DRF?", 1.1, "Permission classes control access to views. IsAuthenticated requires login. IsAdminUser requires staff status. IsAuthenticatedOrReadOnly allows reads without auth.", ["Control view access: IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly", true], ["Set the rate limit for API endpoints", false], ["Define which fields can be serialized", false], ["Configure database connection permissions", false]),
      Q("What is throttling in DRF?", 1.4, "Throttling limits the rate of requests from clients. Built-in: AnonRateThrottle (unauthenticated) and UserRateThrottle (authenticated).", ["Limits request rates per client with built-in throttle classes", true], ["Controls database connection pool size", false], ["Limits response payload size", false], ["Limits the number of active users simultaneously", false]),
      Q("How does JWT authentication work in DRF?", 1.5, "JWT (JSON Web Token) provides stateless authentication. User logs in → gets access + refresh tokens. Access token sent in Authorization header. Short-lived (minutes), refresh token gets new access tokens.", ["Stateless auth: login → access token (short-lived) + refresh token (longer-lived)", true], ["JWT tokens never expire", false], ["JWT stores user passwords in the token", false], ["JWT replaces database user storage", false]),
    ], [
      R("SimpleJWT Documentation", "JWT authentication for DRF", "https://django-rest-framework-simplejwt.readthedocs.io/", "documentation"),
      R("DRF Authentication Guide", "Authentication in DRF", "https://www.django-rest-framework.org/api-guide/authentication/", "documentation"),
    ]),
  ),
  SD("Advanced Django", "Signals, Celery, caching, testing, and production deployment", 3,
    C("Signals & Task Queues", "Django signals, Celery configuration, async tasks, periodic tasks", 1, [
      Q("What are Django Signals used for?", 1.2, "Signals allow decoupled applications to be notified when certain actions occur elsewhere. Built-in: pre_save, post_save, pre_delete, post_delete.", ["Decoupled notification system for actions like save, delete events", true], ["A way to send emails from Django", false], ["A real-time WebSocket communication system", false], ["An alternative to AJAX requests", false]),
      Q("What is Celery in the context of Django?", 1.3, "Celery is a distributed task queue for executing tasks asynchronously. Common uses: sending emails, image processing, data exports, scheduled tasks.", ["Distributed task queue for async/background task execution", true], ["A database migration tool like Alembic", false], ["A template engine like Jinja", false], ["An API testing framework", false]),
      Q("What is the purpose of the @shared_task decorator in Celery?", 1.1, "@shared_task defines a task that can be called asynchronously. It creates a Celery task from a regular Python function.", ["Defines an async task function that Celery can execute in the background", true], ["Defines a periodic task that runs on a schedule", false], ["Shares task data across multiple Celery workers", false], ["Optimizes database queries for the task", false]),
      Q("What is Flower in Celery ecosystem?", 1.4, "Flower is a web-based tool for monitoring and administering Celery clusters. It shows task history, worker status, queue lengths, and can revoke tasks.", ["Web-based monitoring and administration tool for Celery clusters", true], ["A flower-themed Django admin alternative", false], ["A task scheduling library", false], ["A database optimization tool", false]),
    ], [
      R("Django Signals", "Signal documentation", "https://docs.djangoproject.com/en/5.1/topics/signals/", "documentation"),
      R("Celery with Django", "Celery integration guide", "https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html", "documentation"),
      R("Flower Documentation", "Celery monitoring tool", "https://flower.readthedocs.io/", "documentation"),
      R("Very Academy - Celery Django", "Celery with Django tutorial", "https://www.youtube.com/watch?v=ivk-Gi2ROIA", "video"),
    ]),
    C("Caching & Performance", "Cache framework, Redis, database optimization, select_related", 2, [
      Q("What caching backends does Django support out of the box?", 1.2, "Django supports: Memcached, Redis (via django-redis), database caching, file-based caching, local-memory caching, and dummy caching.", ["Memcached, Redis, database, file-based, local-memory, and dummy caching", true], ["Only Redis is supported", false], ["Only Memcached is supported", false], ["Django does not support caching", false]),
      Q("How do you cache a view's output in Django?", 1.0, "Use the @cache_page decorator: @cache_page(60 * 15) caches the view output for 15 minutes.", ["@cache_page(timeout) decorator on the view function", true], ["Add the view to CACHES setting", false], ["Use the {% cache %} template tag", false], ["Caching views requires a third-party package", false]),
      Q("What is the purpose of the low-level cache API in Django?", 1.3, "Django's low-level cache API (cache.get(), cache.set(), cache.delete()) provides programmatic access to the cache for storing any pickleable data.", ["Programmatic cache access: cache.get(), cache.set(), cache.delete()", true], ["An API for managing cache servers", false], ["A cache for low-resolution images", false], ["A caching system for CSS and JavaScript files", false]),
      Q("What is a key consideration when caching database queries?", 1.5, "Invalidation is the hardest part. Cache keys must consider queryset parameters. Use versioning or time-based expiration. Never cache user-specific data without user ID in the key.", ["Cache invalidation is critical — use proper keys, versioning, and expiration", true], ["Cache everything forever without expiration", false], ["Never cache database queries", false], ["Cache invalidation is handled automatically", false]),
    ], [
      R("Django Cache Framework", "Complete caching documentation", "https://docs.djangoproject.com/en/5.1/topics/cache/", "documentation"),
    ]),
    C("Testing & Deployment", "pytest-django, testing best practices, production settings, environment configuration", 3, [
      Q("What is the recommended testing framework for Django projects?", 1.2, "pytest with pytest-django plugin is the modern standard. It provides fixtures, parameterized tests, and faster test execution compared to Django's TestCase.", ["pytest with pytest-django plugin (fixtures, parameterization, speed)", true], ["Django's built-in TestCase only", false], ["unittest is the only supported framework", false], ["JavaScript testing frameworks like Jest", false]),
      Q("What is the purpose of the @pytest.mark.django_db decorator? (assuming test DB access)", 1.1, "It marks a test that needs database access. Pytest-Django tests without this decorator don't touch the database, making them faster.", ["Marks a test that requires database access", true], ["Marks a test that should be skipped", false], ["Creates a new database for the test", false], ["Seeds the database with test data", false]),
      Q("How do you manage settings across environments (dev, staging, production)?", 1.3, "Use separate settings files (base.py, development.py, production.py). Django settings should be importable from environment variables via os.environ.get().", ["Multiple settings files with env variable overrides for sensitive data", true], ["A single settings.py with if/else conditions", false], ["Store settings in a JSON file", false], ["Use the Django admin panel for settings", false]),
      Q("What deployment pattern is recommended for Django in production?", 1.5, "Use: Gunicorn or uWSGI as WSGI server, Nginx as reverse proxy/static file server, PostgreSQL database, Redis for caching/queues, and Docker for containerization.", ["Gunicorn + Nginx + PostgreSQL + Redis + Docker", true], ["Django's built-in runserver for production", false], ["Apache HTTP Server only", false], ["Django does not need a web server", false]),
    ], [
      R("pytest-django Documentation", "Testing Django with pytest", "https://pytest-django.readthedocs.io/", "documentation"),
      R("Django Deployment Checklist", "Production deployment guide", "https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/", "documentation"),
    ]),
  ),
]);

// ═══════════════════════════════════════════════════════════════════════════
// TRACK 9: Full DevOps, FastAPI
// ═══════════════════════════════════════════════════════════════════════════
await createTrack({
  name: "Full DevOps, FastAPI",
  description: "Master DevOps — Git, CI/CD, Docker, Kubernetes, AWS, Terraform, monitoring, and site reliability.",
  longDescription: "Comprehensive DevOps track covering version control with Git, CI/CD pipelines (GitHub Actions, Jenkins), containerization (Docker, Docker Compose), orchestration (Kubernetes), cloud infrastructure (AWS), Infrastructure as Code (Terraform), monitoring (Prometheus, Grafana), and SRE principles.",
  icon: "🛠️", color: "#F05032", difficulty: "Intermediate to Expert", popularity: 94,
}, [
  SD("Version Control & CI/CD", "Git workflows, GitHub Actions, Jenkins pipelines, GitOps", 1,
    C("Git Version Control", "Branching strategies, rebasing, merge conflicts, hooks, advanced commands", 1, [
      Q("What is the difference between Git merge and rebase?", 1.3, "Merge creates a merge commit preserving branch history. Rebase rewrites history by placing commits on top of the target branch, creating a linear history.", ["Merge: preserves history (merge commit); Rebase: rewrites for linear history", true], ["Rebase preserves history; Merge creates linear history", false], ["They are identical operations", false], ["Merge only works with remote branches; Rebase with local", false]),
      Q("What does git stash do?", 1.0, "git stash temporarily shelves changes, leaving a clean working directory. git stash pop restores the changes. Useful for context switching.", ["Temporarily shelves uncommitted changes for context switching", true], ["Permanently deletes uncommitted changes", false], ["Commits changes with a default message", false], ["Creates a new branch with current changes", false]),
      Q("What is the GitFlow branching strategy?", 1.4, "GitFlow uses: main (production), develop (integration), feature/* (new features), release/* (release candidates), hotfix/* (urgent fixes).", ["main, develop, feature/*, release/*, hotfix/* branches with specific rules", true], ["Only a single main branch with tags for releases", false], ["A strategy for managing Git hooks", false], ["A workflow for writing Git commit messages", false]),
      Q("What does an interactive rebase (git rebase -i) allow you to do?", 1.5, "Interactive rebase lets you: reorder, squash, edit, drop, or reword commits. Powerful for cleaning up commit history before merging.", ["Reorder, squash, edit, drop, or reword commits for cleaner history", true], ["Merge two branches simultaneously", false], ["Automatically resolve merge conflicts", false], ["Delete remote branches in bulk", false]),
      Q("What is git bisect used for?", 1.4, "git bisect uses binary search to find the commit that introduced a bug. You mark commits as 'good' or 'bad', and Git narrows down the culprit.", ["Binary search to find the commit that introduced a bug", true], ["Splits large commits into smaller ones", false], ["Bisects branches for parallel development", false], ["Checks syntax errors in commits", false]),
    ], [
      R("Git Documentation", "Official Git reference", "https://git-scm.com/doc", "documentation"),
      R("Atlassian Git Tutorial", "Comprehensive Git tutorials", "https://www.atlassian.com/git/tutorials", "article"),
      R("GitHub Skills - Git", "Interactive Git learning", "https://skills.github.com/", "article"),
    ]),
    C("GitHub Actions & CI/CD", "Workflow syntax, triggers, matrix builds, artifacts, custom actions", 2, [
      Q("What is the basic structure of a GitHub Actions workflow?", 1.1, "A workflow YAML file defines: name, trigger (on), jobs (with runs-on and steps). Each step can run commands or use actions.", ["YAML with name, trigger (on), jobs (runs-on + steps) structure", true], ["A JSON configuration file with build instructions", false], ["A Dockerfile for CI/CD", false], ["A shell script with environment variables", false]),
      Q("What is the difference between workflow_dispatch and push triggers in GitHub Actions?", 1.3, "push triggers automatically on code push. workflow_dispatch manually triggers the workflow via GitHub UI or API with optional input parameters.", ["push: automatic on code push; workflow_dispatch: manual with optional inputs", true], ["Both are manual triggers", false], ["workflow_dispatch triggers on push; push is manual", false], ["workflow_dispatch requires a paid GitHub plan", false]),
      Q("What is a matrix build in GitHub Actions?", 1.4, "Matrix builds run a job across multiple combinations of variables (operating systems, language versions). Defined with the strategy.matrix key.", ["Runs jobs across multiple OS/version combinations defined in strategy.matrix", true], ["A visual dashboard for build status", false], ["A third-party CI/CD integration platform", false], ["A dependency management tool for CI", false]),
      Q("What are GitHub Actions artifacts?", 1.2, "Artifacts are files produced by a workflow (build outputs, logs, test reports). Uploaded via actions/upload-artifact and downloaded via actions/download-artifact.", ["Build outputs and logs shared between jobs or downloaded after workflow", true], ["Git repository metadata files", false], ["Cached dependencies for faster builds", false], ["GitHub issue templates for bug reports", false]),
      Q("What is a self-hosted runner in GitHub Actions?", 1.5, "A self-hosted runner runs on your own infrastructure instead of GitHub-hosted. Useful for: specialized hardware, internal network access, or custom environments.", ["Your own infrastructure hosting the GitHub Actions runner agent", true], ["A runner that only runs tests locally", false], ["A runner that generates self-signed certificates", false], ["A standalone CI/CD tool separate from GitHub", false]),
    ], [
      R("GitHub Actions Documentation", "Official GitHub Actions guide", "https://docs.github.com/en/actions", "documentation"),
      R("GitHub Actions Workflow Syntax", "Complete workflow syntax reference", "https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions", "documentation"),
      R("GitHub Actions - CI/CD Tutorial", "GitHub Actions tutorial series", "https://www.youtube.com/watch?v=R8_veQiYBjI", "video"),
    ]),
    C("Jenkins Pipelines", "Declarative vs scripted pipelines, multibranch pipelines, shared libraries, plugins", 3, [
      Q("What is the difference between Declarative and Scripted Jenkins pipelines?", 1.3, "Declarative: simpler, structured syntax with agent, stages, steps, post blocks. Scripted: more flexible, full Groovy syntax, can use conditionals and loops freely.", ["Declarative: structured/simpler; Scripted: flexible Groovy with full programming", true], ["Scripted is simpler than Declarative", false], ["Declarative uses XML; Scripted uses YAML", false], ["They produce the same output syntax", false]),
      Q("What is a Multibranch Pipeline in Jenkins?", 1.2, "Multibranch Pipeline auto-discovers branches in a repository and creates a pipeline for each branch that contains a Jenkinsfile.", ["Auto-discovers repository branches and creates pipelines per branch", true], ["A pipeline that deploys to multiple servers", false], ["A pipeline with multiple parallel stages", false], ["A pipeline that builds multiple programming languages", false]),
      Q("What is the purpose of the Agent directive in Jenkins pipeline?", 1.0, "Agent defines where the pipeline executes: any (any available agent), none (no global agent), label (specific agent with label), or docker (containerized agent).", ["Defines where the pipeline executes (any, none, label, docker)", true], ["The person responsible for the pipeline", false], ["An automated tool for pipeline debugging", false], ["A notification service for build status", false]),
      Q("What are Shared Libraries in Jenkins?", 1.5, "Shared Libraries allow you to define reusable pipeline code (functions, variables, steps) in a separate Git repository that multiple projects can import and use.", ["Reusable pipeline code in a separate Git repo for multi-project use", true], ["A collection of open-source Jenkins plugins", false], ["A library of Docker images for Jenkins agents", false], ["A shared database for Jenkins build artifacts", false]),
    ], [
      R("Jenkins Pipeline Documentation", "Official Jenkins pipeline guide", "https://www.jenkins.io/doc/book/pipeline/", "documentation"),
      R("Jenkins Shared Libraries", "Shared libraries documentation", "https://www.jenkins.io/doc/book/pipeline/shared-libraries/", "documentation"),
    ]),
  ),
  SD("Containers & Orchestration", "Docker, Docker Compose, Kubernetes, Helm, service mesh", 2,
    C("Docker & Containerization", "Dockerfiles, images, containers, volumes, networking, multi-stage builds", 1, [
      Q("What is the difference between a Docker image and a container?", 1.0, "An image is a read-only template (snapshot). A container is a runnable instance of an image. Images are built (docker build), containers are run (docker run).", ["Images: read-only templates; Containers: runnable instances of images", true], ["Containers: read-only templates; Images: runnable instances", false], ["They are the same thing", false], ["Images run on servers; Containers run locally", false]),
      Q("What does a multi-stage Dockerfile achieve?", 1.5, "Multi-stage builds use multiple FROM statements to separate build environment from runtime. The final image only contains runtime artifacts, dramatically reducing size.", ["Separates build (large) and runtime (small) stages to minimize image size", true], ["Builds multiple Docker images simultaneously", false], ["Deploys to multiple cloud providers at once", false], ["Scales containers across multiple hosts", false]),
      Q("How do you persist data in Docker containers?", 1.2, "Use Docker volumes (docker volume create, -v flag) or bind mounts. Volumes are managed by Docker, bind mounts map host directories into the container.", ["Volumes (Docker-managed) or bind mounts (host directory mapping)", true], ["Data is automatically persisted in containers", false], ["Use the SAVE command in the Dockerfile", false], ["Containers cannot persist data", false]),
      Q("What is Docker Compose used for?", 1.1, "Docker Compose defines and runs multi-container applications using a docker-compose.yml file. It manages networks, volumes, and service dependencies.", ["Define and run multi-container apps with docker-compose.yml", true], ["A tool for composing Docker images from layers", false], ["A Docker image registry like Docker Hub", false], ["A monitoring tool for Docker containers", false]),
      Q("What is the purpose of the Docker .dockerignore file?", 1.2, ".dockerignore excludes files/directories from the Docker build context, improving build speed and preventing sensitive data from being included in images.", ["Excludes files from build context for faster builds and better security", true], ["Docker-specific gitignore for containerized repos", false], ["Configuration for Docker daemon security", false], ["A file that lists Docker commands to ignore", false]),
    ], [
      R("Docker Overview", "Official Docker documentation", "https://docs.docker.com/get-started/overview/", "documentation"),
      R("Docker Multi-Stage Builds", "Multi-stage build guide", "https://docs.docker.com/build/building/multi-stage/", "documentation"),
      R("Docker Compose Overview", "Docker Compose documentation", "https://docs.docker.com/compose/", "documentation"),
      R("NetworkChuck - Docker", "Docker tutorial for beginners", "https://www.youtube.com/watch?v=eGz9DS-aIeY", "video"),
    ]),
    C("Kubernetes Fundamentals", "Pods, deployments, services, configmaps, namespaces, kubectl", 2, [
      Q("What is the smallest deployable unit in Kubernetes?", 1.0, "A Pod is the smallest deployable unit. It can contain one or more containers sharing storage/network. Each Pod gets a unique IP address.", ["A Pod (one or more containers with shared storage/network)", true], ["A Container", false], ["A Deployment", false], ["A Node", false]),
      Q("What is the difference between a Deployment and a StatefulSet?", 1.4, "Deployment: for stateless apps, pods are interchangeable, can be scaled/rolled out easily. StatefulSet: for stateful apps, each pod has a unique identity and sticky storage.", ["Deployment: stateless, interchangeable pods; StatefulSet: stateful, unique identity", true], ["Deployment: for databases; StatefulSet: for web servers", false], ["They are identical in functionality", false], ["StatefulSet replaces Deployment in v2", false]),
      Q("What does a Kubernetes Service do?", 1.1, "A Service provides stable networking for pods. Types: ClusterIP (internal), NodePort (external on node port), LoadBalancer (cloud LB), Ingress (HTTP routing).", ["Provides stable network endpoint for pods (ClusterIP, NodePort, LoadBalancer)", true], ["Monitors pod health and restarts failing pods", false], ["Deploys applications to the cluster", false], ["Stores configuration data as key-value pairs", false]),
      Q("What is a ConfigMap in Kubernetes?", 1.2, "ConfigMap stores non-confidential configuration data as key-value pairs. Pods consume ConfigMaps as environment variables, command-line args, or configuration files.", ["Key-value configuration data consumed by pods as env vars or files", true], ["A secret management tool for passwords", false], ["A container image registry configuration", false], ["A network policy for pod-to-pod communication", false]),
      Q("What does kubectl rolling restart do?", 1.3, "Kubectl rolling update gradually replaces pods with new ones, ensuring zero downtime. Old pods terminate only after new ones pass health checks.", ["Gradually replaces pods with zero downtime, ensuring health checks pass", true], ["Stops all pods at once", false], ["Restarts the entire Kubernetes cluster", false], ["Rolls back to the previous deployment version", false]),
    ], [
      R("Kubernetes Documentation", "Official Kubernetes docs", "https://kubernetes.io/docs/home/", "documentation"),
      R("Kubernetes Basics Tutorial", "Learn Kubernetes basics", "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "documentation"),
      R("TechWorld with Nana - K8s", "Complete Kubernetes course", "https://www.youtube.com/watch?v=X48VuDVv0do", "video"),
    ]),
    C("Helm & Service Mesh", "Helm charts, templating, Istio, service mesh concepts", 3, [
      Q("What is Helm in the Kubernetes ecosystem?", 1.2, "Helm is a package manager for Kubernetes. Charts are packages of pre-configured K8s resources. Helm manages releases, upgrades, and rollbacks.", ["Package manager: Charts (packages) with install, upgrade, rollback features", true], ["A Kubernetes monitoring tool", false], ["A CI/CD tool for Kubernetes", false], ["A security scanning tool for containers", false]),
      Q("What is a Helm chart template?", 1.3, "Helm templates use Go templating ({{ .Values.param }}) to generate K8s manifest files. values.yaml provides default values that users can override.", ["Go templates that generate K8s manifests from values.yaml parameters", true], ["A pre-built Docker image for Helm", false], ["A network topology template", false], ["A deployment diagram for Kubernetes architectures", false]),
      Q("What problem does a service mesh (e.g., Istio) solve?", 1.5, "Service mesh handles service-to-service communication: traffic management (routing, load balancing), security (mTLS), observability (metrics, tracing, logs), and reliability (retries, circuit breaking).", ["Traffic mgmt, security (mTLS), observability, and reliability for microservices", true], ["Mesh networking for on-premise servers", false], ["Container orchestration across multiple clouds", false], ["Database sharding for distributed systems", false]),
      Q("What are Helm hooks used for?", 1.4, "Hooks are special resources that run at specific points in a release lifecycle (pre-install, post-install, pre-upgrade, post-upgrade, pre-delete, post-delete).", ["Special resources that run at lifecycle points (install, upgrade, delete)", true], ["Hooks for attaching debuggers to pods", false], ["Webhook integrations with Git repositories", false], ["Prometheus alerting rules for Helm releases", false]),
    ], [
      R("Helm Documentation", "Official Helm documentation", "https://helm.sh/docs/", "documentation"),
      R("Istio Documentation", "Service mesh documentation", "https://istio.io/latest/docs/", "documentation"),
      R("TechWorld with Nana - Helm", "Helm crash course", "https://www.youtube.com/watch?v=-ykwb1d0DXU", "video"),
    ]),
  ),
  SD("Cloud & Infrastructure", "AWS core services, Terraform, monitoring, SRE principles", 3,
    C("AWS Fundamentals", "EC2, S3, RDS, Lambda, IAM, VPC — core AWS services", 1, [
      Q("What does AWS EC2 provide?", 1.0, "Amazon Elastic Compute Cloud (EC2) provides scalable virtual servers (instances) in the cloud. You choose instance type (CPU, RAM, storage, networking).", ["Scalable virtual servers (VMs) with configurable compute resources", true], ["A managed Kubernetes service", false], ["A serverless compute platform", false], ["A content delivery network", false]),
      Q("What is the difference between S3 Standard and S3 Glacier storage classes?", 1.3, "S3 Standard: frequent access, low latency, higher cost. Glacier: infrequent access/archival, lower cost, retrieval takes minutes to hours.", ["Standard: frequent/low-latency/higher-cost; Glacier: archival/lower-cost/slow-retrieval", true], ["Glacier: frequent access; Standard: archival", false], ["They are the same but different regions", false], ["S3 Standard is for backups; Glacier for live data", false]),
      Q("What does AWS Lambda allow you to do? (serverless compute)", 1.1, "AWS Lambda runs code without provisioning servers. You upload code and Lambda executes it in response to events (HTTP request, S3 upload, DB change). Pay-per-execution.", ["Serverless compute: run code in response to events, no server management", true], ["A VM-based compute platform with full OS control", false], ["A database query optimization service", false], ["A load balancing service for EC2 instances", false]),
      Q("What is the principle of least privilege in IAM?", 1.4, "Users and services should have ONLY the permissions they absolutely need to perform their tasks. Start with denied and grant specific permissions incrementally.", ["Grant only the minimum permissions necessary for each user/service", true], ["Grant all permissions and revoke as needed", false], ["Use the root account for automated tasks", false], ["Everyone gets administrator access", false]),
      Q("What is a VPC in AWS?", 1.2, "Amazon Virtual Private Cloud (VPC) is a logically isolated section of AWS where you launch resources. You control IP ranges, subnets, route tables, and gateways.", ["Isolated virtual network with full control over IP ranges, subnets, and routing", true], ["A virtual private server for running applications", false], ["A VPN connection to AWS data centers", false], ["A virtual machine image for EC2 instances", false]),
    ], [
      R("AWS Documentation", "Official AWS documentation", "https://docs.aws.amazon.com/", "documentation"),
      R("AWS Ramp-Up Guide", "AWS learning resources", "https://aws.amazon.com/training/ramp-up-guides/", "article"),
      R("FreeCodeCamp - AWS Course", "AWS services overview", "https://www.youtube.com/watch?v=3hLmDS179YE", "video"),
    ]),
    C("Terraform & IaC", "HCL syntax, state management, modules, workspaces, providers", 2, [
      Q("What is Infrastructure as Code (IaC)?", 1.0, "IaC manages infrastructure (servers, networks, databases) through machine-readable definition files instead of manual processes or interactive configuration tools.", ["Managing infrastructure through code/declarative files, not manual configuration", true], ["Writing documentation for infrastructure", false], ["Using GUI tools to configure cloud resources", false], ["Manual server configuration scripts", false]),
      Q("What is the purpose of Terraform state?", 1.4, "Terraform state maps real-world resources to configuration. It tracks resource metadata, enables idempotency, and detects drift. Store it remotely (S3, Terraform Cloud) for team use.", ["Maps config to real resources, enables idempotency and drift detection", true], ["The current status of infrastructure in a dashboard", false], ["The pricing state of cloud resources", false], ["The compiled state of Terraform configuration files", false]),
      Q("What does the terraform plan command do?", 1.0, "terraform plan creates an execution plan showing what Terraform will create, modify, or destroy. It's a dry-run — no changes are actually made.", ["Dry-run execution plan showing proposed changes without applying them", true], ["Applies changes to infrastructure immediately", false], ["Destroys all managed infrastructure", false], ["Imports existing infrastructure into state", false]),
      Q("What are Terraform modules?", 1.3, "Modules are reusable containers of Terraform configuration. They encapsulate groups of resources (e.g., a VPC module). Modules promote code reuse and standardization.", ["Reusable, self-contained Terraform configurations for standardized infrastructure", true], ["Terraform's built-in library of cloud services", false], ["A programming language for writing Terraform code", false], ["The Terraform documentation system", false]),
      Q("What is the purpose of terraform remote state? (S3/DynamoDB)", 1.5, "Remote state stores Terraform state in a shared location (AWS S3 + DynamoDB for locking). Enables team collaboration prevents concurrent modifications with state locking.", ["Shared state storage (S3) with locking (DynamoDB) for team collaboration", true], ["Running Terraform from a remote server", false], ["Managing state files in a separate repository", false], ["Syncing state between different cloud providers", false]),
    ], [
      R("Terraform Documentation", "Official HashiCorp Terraform docs", "https://developer.hashicorp.com/terraform/docs", "documentation"),
      R("Terraform AWS Provider", "AWS provider documentation", "https://registry.terraform.io/providers/hashicorp/aws/latest/docs", "documentation"),
      R("FreeCodeCamp - Terraform", "Terraform course for beginners", "https://www.youtube.com/watch?v=l5k1ai_GBDE", "video"),
    ]),
    C("Monitoring & SRE", "Prometheus, Grafana, alerting, logging, SLIs/SLOs, incident response", 3, [
      Q("What is the difference between monitoring and observability?", 1.3, "Monitoring is collecting predefined metrics and alerting on them (known unknowns). Observability lets you understand system state from outputs (unknown unknowns) — logs, metrics, traces.", ["Monitoring: predefined metrics/alerting; Observability: explore unknown states from output data", true], ["They are the same concept", false], ["Observability: predefined metrics; Monitoring: exploration", false], ["Monitoring is for frontend; Observability for backend", false]),
      Q("What metrics does the Prometheus 'RED' method focus on? (Rate, Errors, Duration)", 1.4, "RED: Rate (requests per second), Errors (failed requests), Duration (latency/distribution). It's for monitoring microservices and is equivalent to Google's Four Golden Signals.", ["Rate (request volume), Errors (failures), Duration (latency)", true], ["Resource usage, Efficiency, Deployment frequency", false], ["Reliability, Error budget, Database performance", false], ["Requests, Encryption, Decryption time", false]),
      Q("What is an SLO (Service Level Objective)?", 1.2, "SLO is a target for service reliability (e.g., 99.9% uptime). It's defined by SLIs (Service Level Indicators) and drives engineering priorities via the error budget policy.", ["A reliability target (e.g., 99.9%) that drives engineering through error budgets", true], ["A security compliance standard for cloud services", false], ["A cost optimization strategy for cloud resources", false], ["A load testing methodology", false]),
      Q("What is the role of Grafana in monitoring?", 1.0, "Grafana queries, visualizes, and alerts on metrics from Prometheus and other data sources. It creates dashboards for real-time observability.", ["Visualization and alerting dashboard for metrics from Prometheus and other sources", true], ["A log aggregation and search tool like ELK stack", false], ["A container orchestration monitoring tool", false], ["A cloud cost optimization platform", false]),
      Q("What is the error budget in SRE?", 1.5, "Error budget = 100% - SLO. It's the acceptable amount of unreliability. As long as you stay within budget, you can deploy new features. Using it up means focus on reliability.", ["100% - SLO = acceptable unreliability; governs deploy vs. stabilize decisions", true], ["The budget allocated for fixing errors in production", false], ["A monetary budget set aside for error-related costs", false], ["The number of errors per day that can be ignored", false]),
    ], [
      R("Prometheus Documentation", "Monitoring and alerting", "https://prometheus.io/docs/introduction/overview/", "documentation"),
      R("Grafana Documentation", "Visualization and dashboards", "https://grafana.com/docs/grafana/latest/", "documentation"),
      R("Google SRE Book", "Site Reliability Engineering", "https://sre.google/sre-book/table-of-contents/", "documentation"),
      R("TechWorld with Nana - Prometheus", "Prometheus & Grafana tutorial", "https://www.youtube.com/watch?v=h4Sl21RYiPg", "video"),
    ]),
  ),
]);
  // ═══════════════════════════════════════════════════════════════════════════
  // TRACK 10: FastAPI
  // ═══════════════════════════════════════════════════════════════════════════
  await createTrack({
    name: "FastAPI",
    description: "Master FastAPI from fundamentals to production — routes, Pydantic, SQLAlchemy, auth, async, testing, and deployment.",
    longDescription: "Comprehensive FastAPI track covering: route handlers and path/query params, Pydantic models and validation, dependency injection, SQLAlchemy ORM with Alembic migrations, JWT/OAuth2 authentication, background tasks, WebSocket support, async patterns, testing with pytest, Docker deployment, and OpenAPI documentation.",
    icon: "⚡", color: "#009485", difficulty: "Beginner to Expert", popularity: 88,
  }, [
    SD("FastAPI Fundamentals", "Routes, path/query parameters, Pydantic models, dependency injection, error handling", 1,
      C("Routes & Parameters", "Path operations, path/query/request body parameters, parameter validation", 1, [
        Q("What decorator is used to create a GET endpoint in FastAPI?", 1.0, "Use @app.get('/path') to create a GET endpoint. FastAPI supports @app.get, @app.post, @app.put, @app.delete, @app.patch, @app.options, and @app.head.", ["@app.get()", true], ["@app.route('GET')", false], ["@api.get()", false], ["@router.get()", false]),
        Q("How do you define a path parameter in FastAPI? e.g. /items/42", 1.1, "Use Python type hints directly in the function parameter: async def get_item(item_id: int). FastAPI automatically validates and converts types.", ["Declare the parameter with a type hint in the function signature", true], ["Use request.args.get('item_id')", false], ["Parse from request.path_params", false], ["Define it in a separate config class", false]),
        Q("What happens when a query parameter has a default value in FastAPI?", 1.2, "Query parameters with defaults become OPTIONAL. Parameters without defaults become REQUIRED. FastAPI infers this from the function signature.", ["Parameters with defaults are optional; without defaults are required", true], ["All query parameters are required", false], ["All query parameters are optional", false], ["Default values are ignored for query parameters", false]),
        Q("What is the difference between Query and Path from fastapi?", 1.4, "Query() is for query string parameters, Path() is for URL path parameters. Both provide additional validation like ge, le, min_length, max_length, regex.", ["Query: query string params; Path: URL path params; both add validation", true], ["Path: query params; Query: path params", false], ["They are identical and interchangeable", false], ["Query works for POST bodies; Path for headers", false]),
        Q("How do you define a request body in FastAPI?", 1.0, "Create a Pydantic BaseModel class and use it as a type hint in your endpoint. FastAPI automatically validates the body against the model.", ["Create a Pydantic BaseModel and add it as a function parameter", true], ["Use request.body() and parse manually", false], ["Use @body decorator on the endpoint", false], ["Add a JSON string parameter", false]),
      ], [
        R("FastAPI Path Parameters", "Official path parameters guide", "https://fastapi.tiangolo.com/tutorial/path-params/", "documentation"),
        R("FastAPI Query Parameters", "Query parameters documentation", "https://fastapi.tiangolo.com/tutorial/query-params/", "documentation"),
        R("FastAPI Request Body", "Request body with Pydantic", "https://fastapi.tiangolo.com/tutorial/body/", "documentation"),
        R("FastAPI Tutorial for Beginners", "Comprehensive FastAPI course", "https://www.youtube.com/watch?v=GN6ICac3OXY", "video"),
      ]),
      C("Pydantic Models & Validation", "BaseModel, field types, validators, nested models, Config", 2, [
        Q("What does Pydantic's BaseModel provide in FastAPI?", 1.0, "BaseModel provides automatic data validation, serialization (to JSON/dict), and schema generation for OpenAPI docs. It's the foundation of data modeling.", ["Auto-validation, serialization, and OpenAPI schema generation", true], ["Database connection management", false], ["Authentication and authorization", false], ["Background task scheduling", false]),
        Q("How do you add custom validation to a Pydantic field?", 1.3, "Use @field_validator('field_name') decorator on a classmethod. The validator receives the field value and can raise ValueError for invalid data.", ["@field_validator('field_name') classmethod that validates the value", true], ["Override the __init__ method", false], ["Add a validate() method to the model", false], ["Use the @validate decorator on the field definition", false]),
        Q("What does the Config class or model_config do in Pydantic v2?", 1.4, "model_config (Pydantic v2) configures behavior: from_attributes=True for ORM mode, extra='forbid' to reject unknown fields, frozen=True for immutability.", ["Configures behavior like ORM mode, extra fields, and immutability", true], ["Defines database table configuration", false], ["Sets environment variable prefixes", false], ["Configures logging for the model", false]),
        Q("What is a Pydantic Field used for?", 1.2, "Field() adds extra validation and metadata: default values, description, alias, ge/le constraints, examples. It enriches the OpenAPI schema.", ["Adds extra validation, constraints, descriptions, and metadata to fields", true], ["Defines the database column type", false], ["Creates a new table in the database", false], ["Generates GraphQL schema", false]),
      ], [
        R("Pydantic Field Types", "Pydantic field types reference", "https://docs.pydantic.dev/latest/concepts/fields/", "documentation"),
        R("Pydantic Validators", "Custom field validators", "https://docs.pydantic.dev/latest/concepts/validators/", "documentation"),
        R("FastAPI - Pydantic", "Using Pydantic in FastAPI", "https://fastapi.tiangolo.com/tutorial/extra-models/", "documentation"),
      ]),
      C("Dependency Injection", "Depends, callable dependencies, classes, sub-dependencies, global dependencies", 3, [
        Q("How do you define a dependency in FastAPI? e.g. common pagination", 1.1, "Create a function and use Depends() in the endpoint: def pagination(page: int = 1, limit: int = 10): return {'page': page, 'limit': limit}", ["Define a function with parameters and use Depends() in the endpoint", true], ["Use the @dependency decorator on a class", false], ["Define it in the OpenAPI schema", false], ["Add it to the application state", false]),
        Q("What is the benefit of using dependencies in FastAPI?", 1.3, "Dependencies promote code reuse, share common logic (auth, DB sessions, pagination), support sub-dependencies, and can be cached per request.", ["Code reuse for common logic: auth, DB sessions, pagination", true], ["They automatically cache API responses", false], ["They replace middleware entirely", false], ["They generate API client code", false]),
        Q("Can FastAPI dependencies be classes?", 1.2, "Yes! Classes can be used as dependencies. FastAPI calls the class as a callable. Class parameters are injected from the container like function parameters.", ["Yes, classes are callable and their parameters are auto-injected", true], ["No, only functions work as dependencies", false], ["Only async functions can be dependencies", false], ["Classes require a @dependency decorator", false]),
        Q("What does dependency caching mean in FastAPI?", 1.5, "Sub-dependencies are called ONCE per request even if used by multiple dependents. The result is cached within a request's scope, improving performance.", ["Sub-dependencies execute once per request regardless of how many times they're used", true], ["Dependencies are cached across multiple requests", false], ["Caching only works with async dependencies", false], ["Cached dependencies are stored in Redis", false]),
      ], [
        R("FastAPI Dependency Injection", "Dependencies guide", "https://fastapi.tiangolo.com/tutorial/dependencies/", "documentation"),
        R("FastAPI Classes as Dependencies", "Class-based dependencies", "https://fastapi.tiangolo.com/tutorial/dependencies/classes-as-dependencies/", "documentation"),
        R("FastAPI Sub-dependencies", "Sub-dependencies guide", "https://fastapi.tiangolo.com/tutorial/dependencies/sub-dependencies/", "documentation"),
      ]),
      C("Error Handling & Responses", "HTTPException, custom exception handlers, response models, status codes", 4, [
        Q("How do you return an HTTP error in FastAPI?", 1.0, "Raise HTTPException: raise HTTPException(status_code=404, detail='Item not found'). FastAPI catches it and returns proper JSON.", ["Raise HTTPException with status_code and detail", true], ["Return a dictionary with error key", false], ["Use the @error decorator", false], ["Return None from the endpoint", false]),
        Q("What does response_model do in FastAPI route decorators?", 1.2, "response_model filters and validates the response data against a Pydantic model. It ensures only declared fields are returned and docs show the schema.", ["Filters/validates response data and generates OpenAPI schema", true], ["Creates a database table for the response", false], ["Validates incoming request bodies", false], ["Automatically paginates responses", false]),
        Q("How do you create a custom exception handler in FastAPI?", 1.4, "Use @app.exception_handler(MyException) decorator on a function that returns a Response. This catches custom exceptions globally.", ["Use @app.exception_handler decorator on a response-returning function", true], ["Add the exception to the middleware list", false], ["Override the app's default error route", false], ["Custom exception handlers are not supported", false]),
        Q("What is the difference between status_code parameter and Response class?", 1.3, "status_code param is simpler (default). Response class gives more control: JSONResponse, HTMLResponse, RedirectResponse, StreamingResponse, FileResponse.", ["status_code: simple default; Response classes: full control over type/headers", true], ["status_code is for GET; Response for POST", false], ["Response class is deprecated in FastAPI", false], ["status_code only works with async endpoints", false]),
      ], [
        R("FastAPI Error Handling", "HTTPException and handlers", "https://fastapi.tiangolo.com/tutorial/handling-errors/", "documentation"),
        R("FastAPI Response Model", "Response model guide", "https://fastapi.tiangolo.com/tutorial/response-model/", "documentation"),
      ]),
    ),
    SD("Database & Async Patterns", "SQLAlchemy, Alembic, async endpoints, background tasks, WebSockets", 2,
      C("SQLAlchemy & Alembic", "ORM models, sessions, relationships, migrations with Alembic", 1, [
        Q("How do you define a database model with SQLAlchemy in FastAPI?", 1.0, "Create a class inheriting from Base (declarative_base()), define columns with Column types like Column(Integer, primary_key=True).", ["Class inheriting Base with Column definitions for each field", true], ["Extend the Pydantic BaseModel class", false], ["Define models in a YAML configuration file", false], ["SQLAlchemy models are auto-generated from Pydantic", false]),
        Q("How do you properly manage database sessions in FastAPI?", 1.3, "Use a dependency with Depends(get_db) that yields a session. FastAPI's dependency injection ensures sessions are closed after the request.", ["Use Depends with a generator function that yields the session", true], ["Create a new session in every endpoint manually", false], ["Use a global singleton session", false], ["Sessions are auto-managed by FastAPI", false]),
        Q("What is Alembic used for in FastAPI projects?", 1.2, "Alembic manages database schema migrations. Generate: alembic revision --autogenerate. Apply: alembic upgrade head. It tracks changes to SQLAlchemy models.", ["Database schema version control and migration management", true], ["Load balancing for database queries", false], ["Caching database query results", false], ["A replacement for SQLAlchemy ORM", false]),
        Q("How do you define a foreign key relationship in SQLAlchemy?", 1.1, "Use ForeignKey on the child table column and relationship() on the model class for Python-side navigation.", ["ForeignKey on column + relationship() on the model class", true], ["Use @relation decorator on the field", false], ["Define it in a separate relations.py file", false], ["Foreign keys are auto-detected by column naming", false]),
        Q("What is the N+1 query problem in SQLAlchemy and how to fix it?", 1.5, "N+1: fetching related objects triggers N additional queries. Fix with eager loading: selectinload(), joinedload(), or subqueryload() in the query options.", ["Triggered by lazy loading relations; fix with selectinload/joinedload", true], ["Too many database connections", false], ["Too many indexes on a table", false], ["Auto-increment primary key overflow", false]),
      ], [
        R("SQLAlchemy 2.0 ORM Guide", "Official SQLAlchemy documentation", "https://docs.sqlalchemy.org/en/20/orm/", "documentation"),
        R("Alembic Migration Guide", "Alembic database migrations", "https://alembic.sqlalchemy.org/en/latest/", "documentation"),
        R("FastAPI SQLAlchemy Guide", "SQLAlchemy with FastAPI", "https://fastapi.tiangolo.com/tutorial/sql-databases/", "documentation"),
        R("Very Academy - FastAPI SQLAlchemy", "FastAPI + SQLAlchemy tutorial", "https://www.youtube.com/watch?v=2gNtN5W3XRs", "video"),
      ]),
      C("Async Patterns & Background Tasks", "async/await in FastAPI, BackgroundTasks, async DB sessions", 2, [
        Q("What is the difference between def and async def in FastAPI endpoints?", 1.3, "def runs in a threadpool (for sync I/O). async def runs on the main event loop (for async I/O like async DB). Mix carefully — don't block the event loop.", ["def: threadpool for sync I/O; async def: event loop for async I/O", true], ["async def is always faster than def", false], ["def is deprecated; always use async def", false], ["async def only works with HTTP GET requests", false]),
        Q("How do you schedule a background task in FastAPI? e.g. send email after signup", 1.1, "Use BackgroundTasks parameter in endpoint: async def signup(..., background_tasks: BackgroundTasks). Add tasks with background_tasks.add_task(send_email, ...).", ["Use BackgroundTasks parameter and add_task() method", true], ["Use @background decorator on a function", false], ["Create a separate thread in the endpoint", false], ["Use Python's asyncio.create_task()", false]),
        Q("What does BackgroundTasks guarantee in FastAPI?", 1.4, "Tasks run AFTER the response is sent to the client. They don't block the response. But they're NOT persistent — if the server crashes, tasks are lost.", ["Tasks run after response is sent, but are NOT persistent/crash-safe", true], ["Tasks run before the response is sent", false], ["Tasks are stored in a database", false], ["Tasks are automatically retried on failure", false]),
        Q("Why should you use async database libraries with FastAPI? (e.g. asyncpg, databases)", 1.5, "Async DB libraries don't block the event loop during queries. This allows FastAPI to handle other requests concurrently. Sync DB libs block the thread.", ["Async DB libraries don't block the event loop, enabling concurrent request handling", true], ["Async DB libraries are always faster", false], ["Sync DB libraries don't work with FastAPI", false], ["Async DB libraries require fewer resources", false]),
      ], [
        R("FastAPI Background Tasks", "Background task documentation", "https://fastapi.tiangolo.com/tutorial/background-tasks/", "documentation"),
        R("FastAPI Async Guide", "Async endpoints in FastAPI", "https://fastapi.tiangolo.com/async/", "documentation"),
      ]),
      C("WebSockets & Real-time", "WebSocket endpoints, handling connections, broadcasting, rooms", 3, [
        Q("How do you create a WebSocket endpoint in FastAPI?", 1.2, "Use @app.websocket('/ws') decorator with async def endpoint(websocket: WebSocket). Accept connections with await websocket.accept().", ["@app.websocket() decorator with accept()/receive()/send()", true], ["@app.get() with a special content type", false], ["WebSockets require a separate package", false], ["FastAPI does not support WebSockets natively", false]),
        Q("How do you receive data from a WebSocket connection?", 1.1, "Use await websocket.receive_text() for strings or await websocket.receive_json() for JSON. await websocket.receive() returns a dict with type field.", ["websocket.receive_text() for strings, receive_json() for JSON", true], ["Websockets only support binary data", false], ["Use request.body() to receive WebSocket data", false], ["WebSocket receives are synchronous", false]),
        Q("What is the recommended pattern for managing multiple WebSocket connections? (chat rooms)", 1.5, "Use a class-based connection manager. Track connections in a dict (room -> list[WebSocket]). Broadcast by iterating over all connections in the room.", ["Connection manager class with room-based dict tracking and broadcast method", true], ["Create a separate HTTP endpoint per connection", false], ["Use a global list of all WebSocket objects", false], ["WebSockets can only handle one client", false]),
        Q("What happens when a WebSocket client disconnects unexpectedly?", 1.4, "FastAPI raises WebSocketDisconnect exception. Wrap receive/send in try/except to clean up the connection from the manager when this exception is caught.", ["WebSocketDisconnect exception is raised; clean up in except block", true], ["The connection is automatically cleaned up", false], ["The server sends a keepalive packet", false], ["FastAPI logs the disconnection silently", false]),
      ], [
        R("FastAPI WebSockets", "WebSocket documentation", "https://fastapi.tiangolo.com/advanced/websockets/", "documentation"),
        R("WebSocket Connection Manager", "Handling multiple connections", "https://fastapi.tiangolo.com/advanced/websockets/#handling-multiple-clients", "documentation"),
      ]),
    ),
    SD("Auth, Testing & Deployment", "JWT authentication, OAuth2, pytest, Docker, production deployment", 3,
      C("Authentication & Security", "OAuth2 password flow, JWT tokens, password hashing, CORS middleware", 1, [
        Q("What is the OAuth2PasswordBearer flow in FastAPI? (login flow)", 1.2, "OAuth2PasswordBearer creates a token URL endpoint. Users POST their username/password, get back a JWT access token, then send it in Authorization: Bearer <token> headers.", ["Token URL endpoint that returns JWT; clients send Bearer token in auth header", true], ["A third-party OAuth provider like Google or GitHub", false], ["A password reset mechanism", false], ["Session-based authentication using cookies", false]),
        Q("How do you hash passwords in a FastAPI application?", 1.0, "Use passlib with bcrypt: from passlib.context import CryptContext. pwd_context = CryptContext(schemes=['bcrypt']). Use pwd_context.hash(password) and pwd_context.verify().", ["passlib with bcrypt CryptContext for hash() and verify()", true], ["Use Python's built-in hashlib", false], ["Store passwords in plain text", false], ["Use Django's make_password() function", false]),
        Q("How do you decode and verify a JWT token in FastAPI? (auth middleware)", 1.4, "Create a dependency using Depends() that extracts the Authorization header, decodes the JWT with jwt.decode(token, SECRET_KEY, algorithms=['HS256']), and returns the current user.", ["Dependency that extracts Bearer token, decodes JWT, and returns current user", true], ["Use @jwt_required decorator on each endpoint", false], ["JWT verification is automatic in FastAPI", false], ["Add JWT config to the application settings file", false]),
        Q("What is CORS and how do you enable it in FastAPI?", 1.1, "CORS restricts cross-origin requests. Enable with: app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*']).", ["app.add_middleware(CORSMiddleware) with allowed origins, methods, and headers", true], ["CORS is enabled by default in FastAPI", false], ["CORS requires a third-party package", false], ["CORS middleware only affects GET requests", false]),
      ], [
        R("FastAPI OAuth2 & JWT", "OAuth2 with JWT guide", "https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/", "documentation"),
        R("FastAPI CORS Middleware", "CORS documentation", "https://fastapi.tiangolo.com/tutorial/cors/", "documentation"),
        R("Auth with FastAPI", "Full authentication tutorial", "https://www.youtube.com/watch?v=0sOvCWFmrtA", "video"),
      ]),
      C("Testing with pytest", "TestClient, fixture setup, async tests, database testing", 2, [
        Q("What is TestClient in FastAPI? (for testing)", 1.0, "TestClient from starlette.testclient wraps your FastAPI app for testing. It simulates HTTP requests without a running server. from fastapi.testclient import TestClient.", ["TestClient wraps the FastAPI app for HTTP request simulation without a server", true], ["A testing database for FastAPI", false], ["A monitoring tool for production", false], ["An API documentation generator", false]),
        Q("How do you override dependencies in tests? (e.g. mock the DB)", 1.4, "Use app.dependency_overrides[original_dep] = mock_dep before tests. This replaces the real DB session dependency with a test one. Reset with dependency_overrides = {}.", ["app.dependency_overrides[original] = mock to substitute dependencies in tests", true], ["Create a separate test app instance", false], ["Use @patch decorator from unittest.mock", false], ["Override dependencies are not supported", false]),
        Q("Why use pytest fixtures over setup/teardown in FastAPI tests?", 1.2, "Fixtures provide modular and reusable test setup, auto-cleanup (yield), scoping (function/module/session), and parameterization for DRY test code.", ["Modular, reusable, auto-cleanup via yield, scope control, parameterization", true], ["Fixtures are slower than setup/teardown", false], ["pytest does not support fixtures", false], ["Fixtures can only be used with async tests", false]),
        Q("What is the recommended way to test async endpoints in pytest?", 1.5, "Install httpx and use TestClient with async support. For full async tests, use pytest-asyncio with @pytest.mark.asyncio decorator.", ["pytest-asyncio with @pytest.mark.asyncio and httpx AsyncBackend", true], ["Async endpoints cannot be tested", false], ["Use TestClient without modifications", false], ["Async tests require a separate test server", false]),
      ], [
        R("FastAPI Testing Guide", "Official testing documentation", "https://fastapi.tiangolo.com/tutorial/testing/", "documentation"),
        R("pytest Documentation", "pytest fixtures and features", "https://docs.pytest.org/en/stable/", "documentation"),
        R("FastAPI Async Tests", "Testing async endpoints", "https://fastapi.tiangolo.com/advanced/async-tests/", "documentation"),
      ]),
      C("Deployment & Production", "Docker containerization, Gunicorn/uvicorn, environment management, scaling", 3, [
        Q("What is the recommended production server for FastAPI?", 1.1, "Use Gunicorn with Uvicorn workers: gunicorn -k uvicorn.workers.UvicornWorker main:app. Uvicorn handles ASGI, Gunicorn handles process management.", ["Gunicorn with Uvicorn workers for process management and ASGI handling", true], ["FastAPI's built-in server is production-ready", false], ["Apache HTTP Server with mod_wsgi", false], ["NGINX only (no app server needed)", false]),
        Q("How do you containerize a FastAPI app with Docker? (Dockerfile)", 1.2, "Multi-stage Dockerfile: build stage with Python dependencies, then run stage with: uvicorn main:app --host 0.0.0.0 --port 8000. Add health checks.", ["Multi-stage Dockerfile with Python deps + uvicorn command + health checks", true], ["Copy the entire venv into the image", false], ["Use a Node.js base image", false], ["FastAPI apps can't be Dockerized", false]),
        Q("How do you manage environment-specific settings in FastAPI? (dev/staging/prod)", 1.3, "Use pydantic-settings: class Settings(BaseSettings): database_url: str = Field(validation_alias='DATABASE_URL'). Load from .env files or environment variables.", ["pydantic-settings BaseSettings class with env variable aliases and .env support", true], ["Create separate Python files for each environment", false], ["Store all config in a JSON file", false], ["Use environment variables directly without validation", false]),
        Q("What is the purpose of a health check endpoint in production FastAPI apps?", 1.3, "Health checks (/health) let load balancers and orchestrators verify the app is running. They check DB connectivity, cache status, and return 200 OK or 503.", ["Verifies app liveness for load balancers/orchestrators with DB/cache checks", true], ["Checks the health of client-side code", false], ["Monitors user session expiration", false], ["Validates API request payloads", false]),
      ], [
        R("FastAPI Deployment Guide", "Production deployment documentation", "https://fastapi.tiangolo.com/deployment/", "documentation"),
        R("FastAPI Docker Guide", "Docker deployment guide", "https://fastapi.tiangolo.com/deployment/docker/", "documentation"),
        R("pydantic-settings", "Settings management with BaseSettings", "https://docs.pydantic.dev/latest/concepts/pydantic_settings/", "documentation"),
        R("Sanjeev Thiyagarajan - FastAPI Full Course", "Complete FastAPI production course", "https://www.youtube.com/watch?v=0sOvCWFmrtA", "video"),
      ]),
    ),
  ]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BADGES
  // ═══════════════════════════════════════════════════════════════════════════
  const badgeData = [
    { name: "First Quiz", description: "Complete your first quiz", icon: "🎯", color: "#22c55e", category: "quiz" as const, criteria: "Complete 1 quiz attempt", maxProgress: 1 },
    { name: "Quiz Whiz", description: "Complete 25 quizzes", icon: "🧠", color: "#3b82f6", category: "quiz" as const, criteria: "Complete 25 quiz attempts", maxProgress: 25 },
    { name: "Quiz Master", description: "Complete 100 quizzes", icon: "🏆", color: "#8b5cf6", category: "quiz" as const, criteria: "Complete 100 quiz attempts", maxProgress: 100 },
    { name: "Streak Starter", description: "Maintain a 3-day learning streak", icon: "🔥", color: "#f59e0b", category: "streak" as const, criteria: "3-day streak", maxProgress: 3 },
    { name: "Streak Warrior", description: "Maintain a 7-day learning streak", icon: "⚡", color: "#ef4444", category: "streak" as const, criteria: "7-day streak", maxProgress: 7 },
    { name: "Streak Legend", description: "Maintain a 30-day learning streak", icon: "💎", color: "#ec4899", category: "streak" as const, criteria: "30-day streak", maxProgress: 30 },
    { name: "Perfect Score", description: "Get 100% on any quiz", icon: "⭐", color: "#fbbf24", category: "mastery" as const, criteria: "100% quiz score", maxProgress: 1 },
    { name: "Concept Master", description: "Master 25 concepts (90%+ score)", icon: "📚", color: "#14b8a6", category: "mastery" as const, criteria: "Master 25 concepts", maxProgress: 25 },
    { name: "Polyglot", description: "Achieve 50%+ in 3 different language tracks", icon: "🌍", color: "#6366f1", category: "special" as const, criteria: "50%+ in 3 tracks", maxProgress: 3 },
    { name: "Full Stack", description: "Achieve 70%+ in 5 different tracks", icon: "🏗️", color: "#06b6d4", category: "special" as const, criteria: "70%+ in 5 tracks", maxProgress: 5 },
    { name: "Early Adopter", description: "Join in the first 100 users", icon: "🚀", color: "#a855f7", category: "special" as const, criteria: "Early platform adoption", maxProgress: 1 },
    { name: "Helping Hand", description: "Follow 5 other learners", icon: "🤝", color: "#f97316", category: "social" as const, criteria: "Follow 5 users", maxProgress: 5 },
    { name: "Social Butterfly", description: "Get followed by 10 other learners", icon: "🦋", color: "#ec4899", category: "social" as const, criteria: "10 followers", maxProgress: 10 },
    { name: "Perfect Week", description: "Complete at least 1 quiz every day for a week", icon: "📅", color: "#22c55e", category: "streak" as const, criteria: "7 days of consecutive quiz activity", maxProgress: 7 },
    { name: "Knowledge Seeker", description: "Attempt questions from every track", icon: "🔍", color: "#6366f1", category: "special" as const, criteria: "Quiz in each track", maxProgress: 6 },
    { name: "Century Club", description: "Answer 100 questions total", icon: "💯", color: "#f59e0b", category: "quiz" as const, criteria: "100 total answers", maxProgress: 100 },
    { name: "Challenge Accepted", description: "Complete a code challenge", icon: "⚔️", color: "#06b6d4", category: "quiz" as const, criteria: "Complete 1 code challenge", maxProgress: 1 },
    { name: "Tier Climber", description: "Reach the Specialist tier", icon: "📈", color: "#3b82f6", category: "mastery" as const, criteria: "Reach Specialist tier", maxProgress: 1 },
  ];

  for (const b of badgeData) {
    if (!(await prisma.badge.findUnique({ where: { name: b.name } }))) {
      await prisma.badge.create({ data: b });
      console.log(`  🏅 Created badge: ${b.name}`);
    }
  }
  console.log("✅ Badges seeded");

  console.log("");
  console.log("🎉 Seeding complete!");
  console.log(`   Tracks: Salesforce, Python, JavaScript/TypeScript, Java, Go, Rust, Angular, Django Backend, Full DevOps, FastAPI`);
  console.log(`   Badges: ${badgeData.length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Leaderboard Seasons
  // ═══════════════════════════════════════════════════════════════════════════
  const seasonNow = new Date();
  const seasonStart = new Date(seasonNow);
  seasonStart.setDate(seasonStart.getDate() - 7);
  const seasonEnd = new Date(seasonNow);
  seasonEnd.setDate(seasonEnd.getDate() + 7);

  const existingSeason = await prisma.leaderboardSeason.findFirst({ where: { name: "Spring 2026 Week 1" } });
  if (!existingSeason) {
    await prisma.leaderboardSeason.create({
      data: {
        name: "Spring 2026 Week 1",
        period: "weekly",
        startDate: seasonStart,
        endDate: seasonEnd,
        isActive: true,
      },
    });
    console.log("✅ Created spring season");
  } else console.log("✅ Season exists");
}

main()
