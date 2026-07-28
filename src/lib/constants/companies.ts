export interface CompanyConfig {
  name: string;
  slug: string;
  description: string;
  website: string;
  order: number;
}

export const COMPANIES: CompanyConfig[] = [
  {
    name: "Amazon",
    slug: "amazon",
    description: "E-commerce, cloud computing, and AI. Known for leadership principles and bar-raising interviews.",
    website: "https://amazon.com",
    order: 1,
  },
  {
    name: "Google",
    slug: "google",
    description: "Search, advertising, cloud, and AI. Known for algorithmic problem-solving and system design.",
    website: "https://google.com",
    order: 2,
  },
  {
    name: "Microsoft",
    slug: "microsoft",
    description: "Operating systems, cloud, productivity software. Known for diverse tech stack interviews.",
    website: "https://microsoft.com",
    order: 3,
  },
  {
    name: "Meta",
    slug: "meta",
    description: "Social media, AR/VR, AI. Known for coding, behavioral, and product sense interviews.",
    website: "https://meta.com",
    order: 4,
  },
  {
    name: "Netflix",
    slug: "netflix",
    description: "Streaming, content delivery, recommendation systems. Known for high-performance engineering culture.",
    website: "https://netflix.com",
    order: 5,
  },
  {
    name: "Apple",
    slug: "apple",
    description: "Consumer electronics, software, services. Known for attention to detail and system-level interviews.",
    website: "https://apple.com",
    order: 6,
  },
  {
    name: "Oracle",
    slug: "oracle",
    description: "Database, cloud infrastructure, enterprise software.",
    website: "https://oracle.com",
    order: 7,
  },
  {
    name: "Adobe",
    slug: "adobe",
    description: "Creative software, document cloud, experience cloud.",
    website: "https://adobe.com",
    order: 8,
  },
  {
    name: "Salesforce",
    slug: "salesforce",
    description: "CRM, cloud enterprise applications, AI. Known for Apex and LWC interviews.",
    website: "https://salesforce.com",
    order: 9,
  },
  {
    name: "Uber",
    slug: "uber",
    description: "Ride-sharing, food delivery, logistics. Known for real-time systems and scalability interviews.",
    website: "https://uber.com",
    order: 10,
  },
  {
    name: "LinkedIn",
    slug: "linkedin",
    description: "Professional networking, recruiting, learning. Known for infrastructure and product interviews.",
    website: "https://linkedin.com",
    order: 11,
  },
  {
    name: "Atlassian",
    slug: "atlassian",
    description: "Developer tools, project management, collaboration software.",
    website: "https://atlassian.com",
    order: 12,
  },
  {
    name: "VMware",
    slug: "vmware",
    description: "Virtualization, cloud infrastructure, networking. Known for systems and low-level interviews.",
    website: "https://vmware.com",
    order: 13,
  },
  {
    name: "Cisco",
    slug: "cisco",
    description: "Networking, security, collaboration technology.",
    website: "https://cisco.com",
    order: 14,
  },
  {
    name: "ServiceNow",
    slug: "servicenow",
    description: "IT service management, workflow automation, AIOps.",
    website: "https://servicenow.com",
    order: 15,
  },
  {
    name: "Intel",
    slug: "intel",
    description: "Semiconductors, processors, AI hardware. Known for systems and low-level programming.",
    website: "https://intel.com",
    order: 16,
  },
  {
    name: "NVIDIA",
    slug: "nvidia",
    description: "GPUs, AI computing, autonomous vehicles. Known for parallel computing and CUDA interviews.",
    website: "https://nvidia.com",
    order: 17,
  },
  {
    name: "OpenAI",
    slug: "openai",
    description: "AI research, language models, deployment infrastructure. Cutting-edge ML engineering interviews.",
    website: "https://openai.com",
    order: 18,
  },
  {
    name: "Others",
    slug: "others",
    description: "General coding problems applicable to any company's interview process.",
    website: "",
    order: 99,
  },
];

export const COMPANY_MAP = new Map(COMPANIES.map((c) => [c.slug, c]));
