import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.spacedRepetition.deleteMany();
  await prisma.leaderboardSnapshot.deleteMany();
  await prisma.masteryScore.deleteMany();
  await prisma.answerLog.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.choice.deleteMany();
  await prisma.question.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.subDomain.deleteMany();
  await prisma.track.deleteMany();
  await prisma.tierDefinition.deleteMany();
  await prisma.user.deleteMany();

  // Create Tiers
  const tiers = await Promise.all([
    prisma.tierDefinition.create({
      data: { name: "Spark", minScore: 0, color: "#94a3b8", icon: "✨" },
    }),
    prisma.tierDefinition.create({
      data: { name: "Apprentice", minScore: 20, color: "#22c55e", icon: "🔥" },
    }),
    prisma.tierDefinition.create({
      data: { name: "Specialist", minScore: 40, color: "#3b82f6", icon: "💎" },
    }),
    prisma.tierDefinition.create({
      data: { name: "Expert", minScore: 60, color: "#8b5cf6", icon: "🏆" },
    }),
    prisma.tierDefinition.create({
      data: { name: "Architect", minScore: 80, color: "#f59e0b", icon: "👑" },
    }),
    prisma.tierDefinition.create({
      data: { name: "Elite", minScore: 95, color: "#ef4444", icon: "🌟" },
    }),
  ]);
  console.log(`✅ Created ${tiers.length} tiers`);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@chaduvkondi.com",
      password: "$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmEGvFx0F5YL.GxG6KqO", // Admin@123
      name: "Platform Admin",
      role: "admin",
      tierId: tiers[5].id, // Elite
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create Salesforce Track
  const salesforceTrack = await prisma.track.create({
    data: {
      name: "Salesforce Developer",
      description: "Master Salesforce development from zero to expert — covering Apex, LWC, Flow, Data Modeling, Security, Integration, and DevOps fundamentals.",
      icon: "☁️",
      color: "#00a1e0",
    },
  });
  console.log(`✅ Created track: ${salesforceTrack.name}`);

  // Create Sub-Domains with Concepts and Questions
  const subDomainsData = [
    {
      name: "Admin & Configuration",
      description: "Salesforce administration, setup, and platform configuration",
      order: 1,
      concepts: [
        {
          name: "Salesforce Setup & Organization",
          description: "Org setup, company information, fiscal year, and organization-wide defaults",
          order: 1,
          questions: [
            {
              text: "What is the maximum number of active users allowed in a Developer Edition org?",
              difficultyWeight: 1.0,
              explanation: "Developer Edition orgs support up to 5 active users. This is a significant limitation compared to Enterprise Edition which supports unlimited users.",
              choices: [
                { text: "5", isCorrect: true },
                { text: "10", isCorrect: false },
                { text: "25", isCorrect: false },
                { text: "Unlimited", isCorrect: false },
              ],
            },
            {
              text: "Which statement about Salesforce org types is correct?",
              difficultyWeight: 1.2,
              explanation: "Sandbox orgs are copies of your production org used for development and testing. They are not separate organizations — they are isolated environments within your production instance.",
              choices: [
                { text: "Sandbox is a complete copy of your production org for development and testing", isCorrect: true },
                { text: "Developer Sandbox includes all production data", isCorrect: false },
                { text: "Full Sandbox can only be refreshed once per year", isCorrect: false },
                { text: "Sandbox orgs can be used as production orgs", isCorrect: false },
              ],
            },
            {
              text: "How many different profiles can you have in a single Salesforce org?",
              difficultyWeight: 1.5,
              explanation: "Salesforce supports up to 1,500 profiles per org. Profiles control object-level and field-level security, and each user is assigned exactly one profile.",
              choices: [
                { text: "Up to 1,500 profiles", isCorrect: true },
                { text: "Up to 100 profiles", isCorrect: false },
                { text: "Up to 500 profiles", isCorrect: false },
                { text: "Unlimited profiles", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Object & Field Management",
          description: "Creating and managing custom objects, fields, and relationships",
          order: 2,
          questions: [
            {
              text: "Which relationship type creates a lookup field on the child object that can be blank (optional)?",
              difficultyWeight: 1.0,
              explanation: "A Lookup relationship creates a field on the child object, and the lookup can be optional (not required). Unlike Master-Detail, it doesn't cascade delete or enforce parent existence.",
              choices: [
                { text: "Lookup Relationship", isCorrect: true },
                { text: "Master-Detail Relationship", isCorrect: false },
                { text: "Many-to-Many Relationship", isCorrect: false },
                { text: "Self Relationship", isCorrect: false },
              ],
            },
            {
              text: "What is the maximum number of custom objects you can create in Enterprise Edition?",
              difficultyWeight: 1.3,
              explanation: "Enterprise Edition allows up to 200 custom objects. Different editions have different limits: Developer Edition (200), Professional (50), Unlimited (2,000).",
              choices: [
                { text: "200", isCorrect: true },
                { text: "50", isCorrect: false },
                { text: "500", isCorrect: false },
                { text: "Unlimited", isCorrect: false },
              ],
            },
            {
              text: "A Master-Detail relationship has which of the following characteristics?",
              difficultyWeight: 1.5,
              explanation: "Master-Detail relationships have cascade delete (when master is deleted, details are deleted), the detail inherits the master's sharing/security, and the detail record's owner is always the master's owner.",
              choices: [
                { text: "Cascade delete, inherited security, and owner from master", isCorrect: true },
                { text: "Independent delete, separate ownership, optional parent", isCorrect: false },
                { text: "Cross-object formula fields not supported", isCorrect: false },
                { text: "Children can have different owners than parent", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Security & Sharing",
          description: "Profiles, permission sets, sharing rules, OWD, and role hierarchy",
          order: 3,
          questions: [
            {
              text: "What is the correct order of security evaluation in Salesforce?",
              difficultyWeight: 1.5,
              explanation: "Salesforce evaluates security top-down: Organization level → Object level (Profiles/Permission Sets) → Field level (Profiles/Permission Sets) → Record level (OWD → Role Hierarchy → Sharing Rules → Manual Sharing).",
              choices: [
                { text: "Org → Object → Field → Record", isCorrect: true },
                { text: "Object → Field → Record → Org", isCorrect: false },
                { text: "Record → Field → Object → Org", isCorrect: false },
                { text: "Field → Org → Object → Record", isCorrect: false },
              ],
            },
            {
              text: "What happens when you set Organization-Wide Defaults (OWD) to Private for an object?",
              difficultyWeight: 1.2,
              explanation: "Private OWD means users can only access records they own or records shared with them via sharing rules, role hierarchy, or manual sharing. No other users can see records by default.",
              choices: [
                { text: "Users only see records they own or that are explicitly shared", isCorrect: true },
                { text: "All users can see all records", isCorrect: false },
                { text: "Only admins can see all records", isCorrect: false },
                { text: "Records are automatically shared up the role hierarchy", isCorrect: false },
              ],
            },
            {
              text: "Which feature allows granting access to records based on field values?",
              difficultyWeight: 1.8,
              explanation: "Criteria-Based Sharing Rules automatically share records to users/groups when specified criteria (field values) are met. This is different from Owner-Based Sharing Rules which share records based on the record owner.",
              choices: [
                { text: "Criteria-Based Sharing Rules", isCorrect: true },
                { text: "Role Hierarchy", isCorrect: false },
                { text: "Manual Sharing", isCorrect: false },
                { text: "Permission Sets", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Apex Programming",
      description: "Apex language fundamentals, governor limits, triggers, and best practices",
      order: 2,
      concepts: [
        {
          name: "Apex Basics & Syntax",
          description: "Apex language fundamentals, data types, collections, and control flow",
          order: 1,
          questions: [
            {
              text: "Which of the following is NOT a valid Apex primitive data type?",
              difficultyWeight: 1.0,
              explanation: "'char' is not a valid Apex primitive. Apex primitives include Integer, Long, Double, Decimal, String, Boolean, Date, Datetime, Time, ID, and Blob.",
              choices: [
                { text: "char", isCorrect: true },
                { text: "Integer", isCorrect: false },
                { text: "Decimal", isCorrect: false },
                { text: "Boolean", isCorrect: false },
              ],
            },
            {
              text: "What is the maximum number of SOQL queries that can be executed in a single Apex transaction?",
              difficultyWeight: 1.3,
              explanation: "The synchronous SOQL query limit is 100 queries per transaction. There's a separate limit of 200 queries for asynchronous transactions (Batch Apex, Queueable, Scheduled).",
              choices: [
                { text: "100", isCorrect: true },
                { text: "50", isCorrect: false },
                { text: "200", isCorrect: false },
                { text: "150", isCorrect: false },
              ],
            },
            {
              text: "Which Apex collection type maintains insertion order and allows duplicate values?",
              difficultyWeight: 1.2,
              explanation: "A List maintains insertion order and allows duplicates. A Set has no guaranteed order and no duplicates. A Map has key-value pairs where keys are unique.",
              choices: [
                { text: "List", isCorrect: true },
                { text: "Set", isCorrect: false },
                { text: "Map", isCorrect: false },
                { text: "Array", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Apex Governor Limits",
          description: "Understanding and working within Salesforce governor limits",
          order: 2,
          questions: [
            {
              text: "What is the maximum CPU time allowed for a synchronous Apex transaction?",
              difficultyWeight: 1.5,
              explanation: "Synchronous Apex transactions have a 10-second CPU time limit. Asynchronous transactions have a 60-second CPU time limit. Exceeding this throws a LimitException.",
              choices: [
                { text: "10,000 milliseconds (10 seconds)", isCorrect: true },
                { text: "30,000 milliseconds (30 seconds)", isCorrect: false },
                { text: "60,000 milliseconds (60 seconds)", isCorrect: false },
                { text: "5,000 milliseconds (5 seconds)", isCorrect: false },
              ],
            },
            {
              text: "How many records can be processed in a single DML operation?",
              difficultyWeight: 1.3,
              explanation: "The DML limit is 10,000 records per transaction, regardless of whether you use one DML call with many records or many DML calls with fewer records. That means you can update a maximum of 10,000 records total in one transaction.",
              choices: [
                { text: "10,000 records total per transaction", isCorrect: true },
                { text: "10,000 records per DML statement", isCorrect: false },
                { text: "50,000 records per transaction", isCorrect: false },
                { text: "Unlimited record operations", isCorrect: false },
              ],
            },
            {
              text: "What is the heap size limit for synchronous Apex?",
              difficultyWeight: 1.2,
              explanation: "The heap size limit is 6 MB for synchronous Apex and 12 MB for asynchronous Apex. This includes all class variables, collections, and objects in memory at any point during execution.",
              choices: [
                { text: "6 MB", isCorrect: true },
                { text: "12 MB", isCorrect: false },
                { text: "3 MB", isCorrect: false },
                { text: "10 MB", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "Apex Triggers",
          description: "Trigger events, best practices, and trigger frameworks",
          order: 3,
          questions: [
            {
              text: "Which trigger events are supported in Salesforce?",
              difficultyWeight: 1.0,
              explanation: "Triggers support both before/after events for insert, update, delete, and undelete operations. Before triggers are used for validation and field updates, after triggers for related record changes.",
              choices: [
                { text: "before/after insert, update, delete, undelete", isCorrect: true },
                { text: "before/after insert, update, delete only", isCorrect: false },
                { text: "before/after insert only", isCorrect: false },
                { text: "before/after insert, update, delete, upsert, undelete", isCorrect: false },
              ],
            },
            {
              text: "What is a best practice for writing Apex triggers?",
              difficultyWeight: 1.5,
              explanation: "The best practice is to keep triggers as logic-free entry points that delegate all processing to a handler class. This follows the single-responsibility principle and makes code testable and maintainable.",
              choices: [
                { text: "Delegate all logic to a handler class, keep triggers logic-free", isCorrect: true },
                { text: "Write all business logic directly in the trigger body", isCorrect: false },
                { text: "Use multiple triggers per object for different operations", isCorrect: false },
                { text: "Avoid using Trigger.old and Trigger.new maps", isCorrect: false },
              ],
            },
            {
              text: "What does Trigger.old contain in an after update trigger?",
              difficultyWeight: 1.3,
              explanation: "Trigger.old contains the old versions of records (before the update) as a Map. Trigger.new contains the new versions. You can compare them to detect field value changes.",
              choices: [
                { text: "The old field values of records before the update", isCorrect: true },
                { text: "The new field values of records after the update", isCorrect: false },
                { text: "Only the IDs of the records being updated", isCorrect: false },
                { text: "All records in the database of that object", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Lightning Web Components",
      description: "LWC framework, components, data binding, and lifecycle",
      order: 3,
      concepts: [
        {
          name: "LWC Component Basics",
          description: "Component structure, templates, decorators, and lifecycle hooks",
          order: 1,
          questions: [
            {
              text: "Which file is required for every Lightning Web Component?",
              difficultyWeight: 1.0,
              explanation: "Every LWC must have an HTML template file (.html) and a JavaScript file (.js). The CSS file (.css), SVG icon, and test files are optional. The component folder can also include an XML configuration file.",
              choices: [
                { text: ".html template and .js file", isCorrect: true },
                { text: ".html, .js, and .css files", isCorrect: false },
                { text: "Only the .js file", isCorrect: false },
                { text: ".html, .js, .css, and .svg files", isCorrect: false },
              ],
            },
            {
              text: "Which decorator is used to make a class property reactive in LWC?",
              difficultyWeight: 1.2,
              explanation: "@track is used to make a private property reactive — when its value changes, the component re-renders. @api is for public properties/methods (accessible from parent components).",
              choices: [
                { text: "@track", isCorrect: true },
                { text: "@api", isCorrect: false },
                { text: "@wire", isCorrect: false },
                { text: "@reactive", isCorrect: false },
              ],
            },
            {
              text: "How do you pass data from a parent component to a child component in LWC?",
              difficultyWeight: 1.3,
              explanation: "Use @api decorator on the child property and pass it via HTML attribute in the parent template. Example: <c-child item={record}></c-child> with @api item in the child component.",
              choices: [
                { text: "Using @api decorator on the child property and passing via HTML attribute", isCorrect: true },
                { text: "Using window.sessionStorage to share data", isCorrect: false },
                { text: "Using the @track decorator on the parent property", isCorrect: false },
                { text: "Using global variables in JavaScript", isCorrect: false },
              ],
            },
          ],
        },
        {
          name: "LWC Data Services",
          description: "Wire adapters, imperative Apex calls, and data handling",
          order: 2,
          questions: [
            {
              text: "Which wire adapter is used to retrieve a single record by ID in LWC?",
              difficultyWeight: 1.5,
              explanation: "getRecord is the wire adapter to retrieve a single record with specified fields. getRecords for multiple records, getRecordCreateDefaults for default field values on create.",
              choices: [
                { text: "getRecord", isCorrect: true },
                { text: "getRecords", isCorrect: false },
                { text: "getRecordById", isCorrect: false },
                { text: "fetchRecord", isCorrect: false },
              ],
            },
            {
              text: "What happens when an @wire method returns an error?",
              difficultyWeight: 1.3,
              explanation: "When an @wire service returns an error, the data property is undefined and the error property contains the error object. You should always check for errors in the wired property before using data.",
              choices: [
                { text: "The data property is undefined and error property contains details", isCorrect: true },
                { text: "The component crashes and shows an error overlay", isCorrect: false },
                { text: "The wire method retries automatically", isCorrect: false },
                { text: "The error is silently ignored and data is empty", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Flow & Automation",
      description: "Flow Builder, Process Builder (legacy), and approval processes",
      order: 4,
      concepts: [
        {
          name: "Flow Builder Basics",
          description: "Screen flows, auto-launched flows, record-triggered flows",
          order: 1,
          questions: [
            {
              text: "Which flow type can be triggered before a record is saved to the database?",
              difficultyWeight: 1.2,
              explanation: "Record-Triggered Flows can be configured to run 'Before the record is saved' (before-save). This is useful for updating field values or validating data before commit. After-save triggers run after commit.",
              choices: [
                { text: "Record-Triggered Flow (before-save)", isCorrect: true },
                { text: "Auto-Launched Flow", isCorrect: false },
                { text: "Screen Flow", isCorrect: false },
                { text: "Platform Event-Triggered Flow", isCorrect: false },
              ],
            },
            {
              text: "What is the maximum number of flow interviews that can run concurrently per org?",
              difficultyWeight: 1.5,
              explanation: "The limit is 200,000 active flow interviews per org per 24-hour period for production orgs. For paused interviews (wait elements), there's a separate limit of 10,000 paused interviews per org.",
              choices: [
                { text: "200,000 per 24-hour period", isCorrect: true },
                { text: "50,000 per hour", isCorrect: false },
                { text: "1,000,000 per 24-hour period", isCorrect: false },
                { text: "Unlimited", isCorrect: false },
              ],
            },
            {
              text: "Which element type pauses the flow interview until a specified condition is met?",
              difficultyWeight: 1.3,
              explanation: "The Wait element pauses a flow interview until a specific time, date, or platform event occurs. It's commonly used in record-triggered flows to wait for related records or time-based conditions.",
              choices: [
                { text: "Wait Element", isCorrect: true },
                { text: "Pause Element", isCorrect: false },
                { text: "Scheduled Path", isCorrect: false },
                { text: "Sleep Element", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Data Modeling",
      description: "Data modeling best practices, schema builder, and data management",
      order: 5,
      concepts: [
        {
          name: "Schema Design",
          description: "Entity relationships, data model optimization, and naming conventions",
          order: 1,
          questions: [
            {
              text: "What is a Junction Object used for in Salesforce?",
              difficultyWeight: 1.0,
              explanation: "A Junction Object creates a many-to-many relationship between two objects. It contains two Master-Detail relationships pointing to each object. Example: OpportunityLineItem connects Opportunity and Product.",
              choices: [
                { text: "Creating a many-to-many relationship between two objects", isCorrect: true },
                { text: "Storing temporary data during calculations", isCorrect: false },
                { text: "Joining two fields on the same object", isCorrect: false },
                { text: "Connecting external databases to Salesforce", isCorrect: false },
              ],
            },
            {
              text: "What is the maximum number of custom fields per object in Salesforce?",
              difficultyWeight: 1.3,
              explanation: "The standard limit is 800 custom fields per object. However, this can vary based on the number of other custom components (formula fields, validation rules, etc.) consuming field capacity.",
              choices: [
                { text: "800", isCorrect: true },
                { text: "500", isCorrect: false },
                { text: "1,000", isCorrect: false },
                { text: "300", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Integration & APIs",
      description: "REST API, SOAP API, connected apps, and external services",
      order: 6,
      concepts: [
        {
          name: "REST & SOAP APIs",
          description: "Salesforce Web services API fundamentals",
          order: 1,
          questions: [
            {
              text: "Which HTTP method is used to update an existing record via the Salesforce REST API?",
              difficultyWeight: 1.0,
              explanation: "PATCH is used to update existing records via REST API. POST is for creating records (or upsert), GET is for retrieving, and DELETE is for deleting records.",
              choices: [
                { text: "PATCH", isCorrect: true },
                { text: "POST", isCorrect: false },
                { text: "PUT", isCorrect: false },
                { text: "UPDATE", isCorrect: false },
              ],
            },
            {
              text: "What is the daily API request limit for Enterprise Edition?",
              difficultyWeight: 1.5,
              explanation: "Enterprise Edition has a limit of 100,000 API requests per license type per 24-hour period. Different editions have different limits: Developer (15,000), Professional (50,000), Unlimited (200,000+).",
              choices: [
                { text: "100,000 per license type per 24 hours", isCorrect: true },
                { text: "50,000 per day total", isCorrect: false },
                { text: "Unlimited API requests", isCorrect: false },
                { text: "500,000 per 24 hours", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Deployment & DevOps",
      description: "Change sets, Salesforce CLI, CI/CD, and version control",
      order: 7,
      concepts: [
        {
          name: "Change Sets & Deployment",
          description: "Outbound/inbound change sets, deployment connections, and metadata API",
          order: 1,
          questions: [
            {
              text: "What is the direction of an Outbound Change Set?",
              difficultyWeight: 1.0,
              explanation: "Outbound Change Sets move components FROM the source org TO another org. Inbound Change Sets receive components FROM another org. Deployment connections must be established between the two orgs first.",
              choices: [
                { text: "Moves components from source org to target org", isCorrect: true },
                { text: "Moves components from target org to source org", isCorrect: false },
                { text: "Uploads components to AppExchange", isCorrect: false },
                { text: "Deletes components from the source org", isCorrect: false },
              ],
            },
            {
              text: "Which Salesforce CLI command is used to retrieve metadata from an org?",
              difficultyWeight: 1.3,
              explanation: "'sf project retrieve start' is the modern CLI command to retrieve source from an org. The older 'sfdx force:source:retrieve' syntax is being deprecated in favor of the new 'sf' CLI commands.",
              choices: [
                { text: "sf project retrieve start", isCorrect: true },
                { text: "sfdx force:source:pull", isCorrect: false },
                { text: "sf org:open", isCorrect: false },
                { text: "sf project deploy start", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Apex Testing",
      description: "Test classes, code coverage, test methodologies, and mocking",
      order: 8,
      concepts: [
        {
          name: "Test Classes & Best Practices",
          description: "Creating test classes, understanding code coverage, and testing patterns",
          order: 1,
          questions: [
            {
              text: "Which annotation is used to define a class as a test class in Apex?",
              difficultyWeight: 1.0,
              explanation: "The @isTest annotation marks a class as a test class. All methods within an @isTest class are considered test methods. Test classes don't count against your org's code size limit.",
              choices: [
                { text: "@isTest", isCorrect: true },
                { text: "@testMethod", isCorrect: false },
                { text: "@TestVisible", isCorrect: false },
                { text: "@AuraEnabled", isCorrect: false },
              ],
            },
            {
              text: "What is the minimum code coverage required to deploy Apex to production?",
              difficultyWeight: 1.3,
              explanation: "You need at least 75% code coverage overall, and each class must have at least 75% coverage. In addition, every trigger must have some coverage. These requirements apply to production deployments only.",
              choices: [
                { text: "75% overall, 75% per class, every trigger tested", isCorrect: true },
                { text: "90% overall coverage", isCorrect: false },
                { text: "50% per class, 75% overall", isCorrect: false },
                { text: "100% coverage for all classes", isCorrect: false },
              ],
            },
            {
              text: "What is the purpose of Test.startTest() and Test.stopTest() in Apex tests?",
              difficultyWeight: 1.5,
              explanation: "Test.startTest() resets governor limits for the code that follows, allowing you to test that your code runs within limits. Test.stopTest() forces any asynchronous code started after startTest() to execute synchronously.",
              choices: [
                { text: "Resets governor limits and forces async code to run synchronously", isCorrect: true },
                { text: "Creates test data and rolls it back", isCorrect: false },
                { text: "Enables debugging output for the test method", isCorrect: false },
                { text: "Marks the beginning and end of a test suite", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Asynchronous Apex",
      description: "Batch Apex, Queueable, Scheduled Apex, and Future methods",
      order: 9,
      concepts: [
        {
          name: "Batch, Queueable & Future Methods",
          description: "Understanding asynchronous processing options in Salesforce",
          order: 1,
          questions: [
            {
              text: "Which interface must a class implement to be used as Batch Apex?",
              difficultyWeight: 1.3,
              explanation: "Database.Batchable<sObject> is the interface for Batch Apex. It requires three methods: start() (returns records to process), execute() (processes each batch), and finish() (post-processing). Each batch can process up to 200 records.",
              choices: [
                { text: "Database.Batchable<sObject>", isCorrect: true },
                { text: "Queueable", isCorrect: false },
                { text: "Schedulable", isCorrect: false },
                { text: "BatchableInterface", isCorrect: false },
              ],
            },
            {
              text: "What is the maximum number of Queueable Apex jobs that can be chained in a single transaction?",
              difficultyWeight: 1.5,
              explanation: "You can chain up to 2 Queueable jobs in a single transaction (one parent, one child). With the latest updates, this has been expanded, but the safe limit is 2 chained jobs. Each job runs in its own transaction with fresh limits.",
              choices: [
                { text: "2 chained jobs (parent + 1 child)", isCorrect: true },
                { text: "5 chained jobs", isCorrect: false },
                { text: "Unlimited chaining", isCorrect: false },
                { text: "Only 1 job at a time", isCorrect: false },
              ],
            },
            {
              text: "When should you use a @future annotation instead of a Queueable class?",
              difficultyWeight: 1.2,
              explanation: "Use @future methods for simple, fire-and-forget asynchronous operations like callouts. Queueable is preferred for more complex scenarios because it supports chaining, has a job ID you can track, and can contain complex types as parameters.",
              choices: [
                { text: "For simple fire-and-forget operations like callouts where you don't need tracking", isCorrect: true },
                { text: "When you need to process more than 10 million records", isCorrect: false },
                { text: "When you need to chain multiple jobs together", isCorrect: false },
                { text: "For Scheduled Apex jobs that run daily", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "SOQL & SOSL",
      description: "Salesforce Object Query Language, relationship queries, and search",
      order: 10,
      concepts: [
        {
          name: "SOQL Queries & Relationships",
          description: "Writing efficient SOQL queries, traversing relationships, and SOSL search",
          order: 1,
          questions: [
            {
              text: "How do you query child records from a parent object using a relationship query in SOQL?",
              difficultyWeight: 1.3,
              explanation: "Use a subquery in the SELECT clause: SELECT Id, Name, (SELECT Id, Name FROM Contacts) FROM Account. The child relationship name (e.g., Contacts) is the plural of the child object's relationship name.",
              choices: [
                { text: "Using a subquery with the child relationship name in parentheses", isCorrect: true },
                { text: "Using a JOIN clause similar to SQL", isCorrect: false },
                { text: "Querying the child object with a WHERE parentId filter", isCorrect: false },
                { text: "Using the __r relationship suffix in a WHERE clause", isCorrect: false },
              ],
            },
            {
              text: "What is the key difference between SOQL and SOSL?",
              difficultyWeight: 1.0,
              explanation: "SOQL (Salesforce Object Query Language) queries a single object at a time and returns record fields. SOSL (Salesforce Object Search Language) searches across multiple objects simultaneously and returns a list of sObjects grouped by object type.",
              choices: [
                { text: "SOQL queries one object, SOSL searches multiple objects", isCorrect: true },
                { text: "SOQL is for inserts, SOSL is for queries", isCorrect: false },
                { text: "SOSL can only be used in Apex, not in the REST API", isCorrect: false },
                { text: "SOQL returns grouped results, SOSL returns flat results", isCorrect: false },
              ],
            },
            {
              text: "Which SOQL clause is used to group records and apply aggregate functions like COUNT()?",
              difficultyWeight: 1.5,
              explanation: "GROUP BY is used to group records for aggregation. Use HAVING to filter grouped results. Common aggregate functions: COUNT(), SUM(), AVG(), MIN(), MAX(). Example: SELECT AccountId, COUNT(Id) FROM Contact GROUP BY AccountId HAVING COUNT(Id) > 5.",
              choices: [
                { text: "GROUP BY", isCorrect: true },
                { text: "ORDER BY", isCorrect: false },
                { text: "HAVING", isCorrect: false },
                { text: "LIMIT", isCorrect: false },
              ],
            },
          ],
        },
      ],
    },
  ];

  for (const subDomainData of subDomainsData) {
    const subDomain = await prisma.subDomain.create({
      data: {
        name: subDomainData.name,
        description: subDomainData.description,
        order: subDomainData.order,
        trackId: salesforceTrack.id,
      },
    });

    for (const conceptData of subDomainData.concepts) {
      const concept = await prisma.concept.create({
        data: {
          name: conceptData.name,
          description: conceptData.description,
          order: conceptData.order,
          subDomainId: subDomain.id,
        },
      });

      // Add resources for each concept
      const resourceTypes = ["video", "article", "documentation"] as const;
      const resourcesByConcept: Record<string, { title: string; description: string; url: string; type: typeof resourceTypes[number] }[]> = {
        "Salesforce Setup & Organization": [
          { title: "Salesforce Hulk - Getting Started with Salesforce", description: "Overview of Salesforce org types, setup, and developer edition", url: "https://www.youtube.com/watch?v=wYULDOJ7U0A", type: "video" },
          { title: "Salesforce Setup Guide", description: "Official guide for setting up your Salesforce organization", url: "https://help.salesforce.com/s/articleView?id=sf.admin_setup.htm", type: "documentation" },
        ],
        "Object & Field Management": [
          { title: "Custom Objects & Fields Best Practices", description: "Salesforce guide to creating custom objects, fields, and relationships", url: "https://help.salesforce.com/s/articleView?id=sf.custom_object_create.htm", type: "documentation" },
          { title: "Relationship Types Overview", description: "Understanding Lookup vs Master-Detail relationships", url: "https://help.salesforce.com/s/articleView?id=sf.relationships_considerations.htm", type: "documentation" },
        ],
        "Security & Sharing": [
          { title: "Salesforce Hulk - Sharing Rules Tutorial", description: "Complete overview of sharing rules, OWD, and role hierarchy", url: "https://www.youtube.com/watch?v=HuQu9CPOcSc", type: "video" },
          { title: "Salesforce Security Guide", description: "Official security architecture documentation", url: "https://help.salesforce.com/s/articleView?id=sf.security_sharing_architecture.htm", type: "documentation" },
        ],
        "Apex Basics & Syntax": [
          { title: "Salesforce Hulk - Apex Programming Basics", description: "Introduction to Apex programming language, data types, and collections", url: "https://www.youtube.com/watch?v=wYULDOJ7U0A", type: "video" },
          { title: "Apex Developer Guide", description: "Official Apex developer documentation", url: "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_dev_guide.htm", type: "documentation" },
        ],
        "Apex Governor Limits": [
          { title: "Salesforce Hulk - Governor Limits Explained", description: "Understanding and working within Salesforce governor limits", url: "https://www.youtube.com/watch?v=x7Ij5BJ1jCE", type: "video" },
          { title: "Execution Governors and Limits", description: "Official documentation on Apex limits", url: "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm", type: "documentation" },
        ],
        "Apex Triggers": [
          { title: "Salesforce Hulk - Apex Triggers Tutorial", description: "Complete guide to writing Apex triggers", url: "https://www.youtube.com/watch?v=tCjBMPsrFio", type: "video" },
          { title: "Apex Triggers Documentation", description: "Official guide for trigger development", url: "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm", type: "documentation" },
        ],
        "LWC Component Basics": [
          { title: "Salesforce Troop - LWC Crash Course", description: "Complete Lightning Web Components crash course", url: "https://www.youtube.com/watch?v=IHezETiVWPo", type: "video" },
          { title: "LWC Developer Guide", description: "Official Lightning Web Components documentation", url: "https://developer.salesforce.com/docs/platform/lwc/guide/get-started.html", type: "documentation" },
        ],
        "LWC Data Services": [
          { title: "LWC Data & Wire Service Documentation", description: "Official guide for the LWC wire service and data fetching patterns", url: "https://developer.salesforce.com/docs/platform/lwc/guide/data-wire-service-about.html", type: "documentation" },
          { title: "Lightning Data Service Basics", description: "Understanding imperative Apex calls vs wire adapters in LWC", url: "https://developer.salesforce.com/docs/platform/lwc/guide/data-apex.html", type: "documentation" },
        ],
        "Flow Builder Basics": [
          { title: "Flow Builder Documentation", description: "Official Flow Builder user guide covering screen flows, auto-launched flows, and record-triggered flows", url: "https://help.salesforce.com/s/articleView?id=platform.automate_flow_about.htm", type: "documentation" },
          { title: "Flow Builder Trailhead Module", description: "Interactive learning path for Flow Builder", url: "https://trailhead.salesforce.com/content/learn/modules/flow_builder", type: "documentation" },
        ],
        "Schema Design": [
          { title: "Coding With The Force - Data Modeling Best Practices", description: "Best practices for data modeling in Salesforce", url: "https://www.youtube.com/watch?v=V1m5tiMFYlM", type: "video" },
          { title: "Data Modeling on Trailhead", description: "Salesforce data modeling learning path", url: "https://trailhead.salesforce.com/content/learn/modules/data_modeling", type: "documentation" },
        ],
        "REST & SOAP APIs": [
          { title: "Salesforce Troop - REST API Integration Tutorial", description: "Working with REST API in Salesforce", url: "https://www.youtube.com/watch?v=EeBL-8D3AQk", type: "video" },
          { title: "REST API Developer Guide", description: "Official REST API documentation", url: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm", type: "documentation" },
        ],
        "Change Sets & Deployment": [
          { title: "Salesforce CLI & Source of Truth Guide", description: "Best practices for Salesforce deployment using CLI and version control", url: "https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm", type: "documentation" },
          { title: "Change Sets Documentation", description: "Official change sets deployment guide", url: "https://help.salesforce.com/s/articleView?id=sf.changesets_about.htm", type: "documentation" },
        ],
        "Test Classes & Best Practices": [
          { title: "Coding With The Force - Apex Testing Tutorial", description: "Complete guide to writing effective Apex tests", url: "https://www.youtube.com/watch?v=mLnUyxwkVGU", type: "video" },
          { title: "Apex Testing Documentation", description: "Official guide for Apex testing and code coverage", url: "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_testing.htm", type: "documentation" },
          { title: "Test.startTest() and Test.stopTest()", description: "Understanding governor limit reset in tests", url: "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_testing_utility_methods.htm", type: "documentation" },
        ],
        "Batch, Queueable & Future Methods": [
          { title: "Coding With The Force - Batch Apex Deep Dive", description: "Deep dive into Batch, Queueable, Future, and Scheduled Apex", url: "https://www.youtube.com/watch?v=2BloKlbxY8U", type: "video" },
          { title: "Asynchronous Apex Documentation", description: "Official guide for asynchronous Apex processing", url: "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_async_overview.htm", type: "documentation" },
        ],
        "SOQL Queries & Relationships": [
          { title: "Coding With The Force - The Complete Guide to SOQL", description: "Learn Salesforce query language fundamentals including relationships", url: "https://www.youtube.com/watch?v=V1m5tiMFYlM", type: "video" },
          { title: "SOQL and SOSL Reference", description: "Official SOQL and SOSL reference guide", url: "https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_sosl_intro.htm", type: "documentation" },
        ],
      };

      const resources = resourcesByConcept[conceptData.name] || [];
      for (const resource of resources) {
        await prisma.resource.create({
          data: {
            ...resource,
            conceptId: concept.id,
          },
        });
      }

      // Create Questions for the concept
      for (const questionData of conceptData.questions) {
        const question = await prisma.question.create({
          data: {
            text: questionData.text,
            difficultyWeight: questionData.difficultyWeight,
            explanation: questionData.explanation,
            conceptId: concept.id,
            choices: {
              create: questionData.choices.map((c) => ({
                text: c.text,
                isCorrect: c.isCorrect,
              })),
            },
          },
        });
      }
    }
  }

  // Count results
  const counts = {
    concepts: await prisma.concept.count(),
    questions: await prisma.question.count(),
    choices: await prisma.choice.count(),
    resources: await prisma.resource.count(),
  };

  console.log(`✅ Seed complete!`);
  console.log(`   Tracks: 1 (Salesforce Developer)`);
  console.log(`   Sub-Domains: ${subDomainsData.length}`);
  console.log(`   Concepts: ${counts.concepts}`);
  console.log(`   Questions: ${counts.questions}`);
  console.log(`   Choices: ${counts.choices}`);
  console.log(`   Resources: ${counts.resources}`);
  console.log(`   Admin user: admin@chaduvkondi.com / Admin@123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
