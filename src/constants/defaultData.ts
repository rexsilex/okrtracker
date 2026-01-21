import { Person, Objective } from '../types';

export const DEFAULT_PEOPLE: Person[] = [
    { id: "p1", name: "Colby", initials: "CB", color: "bg-blue-500" },
    { id: "p2", name: "Sarah", initials: "SJ", color: "bg-emerald-500" },
    { id: "p3", name: "Team", initials: "TM", color: "bg-violet-500" },
];

export const DEFAULT_DATA: Objective[] = [
  // Company
  {
    id: "co-1",
    title: "Sell media, not just tools",
    category: "Company",
    description: "Drive $3M in media revenue by shifting focus to value-based selling, securing net new brands, and expanding our SaaS footprint.",
    keyResults: [
        {
            id: "co-1-kr-1",
            title: "Media Revenue",
            type: "standard",
            current: 0,
            target: 3000000,
            unit: "$",
        },
        {
            id: "co-1-kr-2",
            title: "Net New Brands",
            type: "leading",
            current: 0,
            target: 30,
            unit: "brands",
        },
        {
            id: "co-1-kr-3",
            title: "Average Deal Size",
            type: "standard",
            current: 0,
            target: 75000,
            unit: "$",
        },
        {
            id: "co-1-kr-4",
            title: "Renewal Rate",
            type: "lagging",
            current: 0,
            target: 50,
            unit: "%",
        },
        {
            id: "co-1-kr-5",
            title: "SaaS / Ad Serving Revenue Growth",
            type: "standard",
            current: 0,
            target: 20,
            unit: "%",
        },
        {
            id: "co-1-wc-1",
            title: "Make a sale",
            type: "win_condition",
            current: 0,
            target: 40,
            unit: "wins",
            winLog: []
        },
        {
            id: "co-1-wc-2",
            title: "Renew a campaign",
            type: "win_condition",
            current: 0,
            target: 15,
            unit: "renewals",
            winLog: []
        }
    ],
    wins: []
  },
  {
    id: "co-2",
    title: "Become storytellers",
    category: "Company",
    description: "Every touchpoint with the market should tell a compelling story about the future of audio.",
    keyResults: [],
    wins: []
  },
  {
    id: "co-3",
    title: "Turn Frequency into a machine",
    category: "Company",
    description: "Operational excellence. Automate the mundane, focus on the creative.",
    keyResults: [],
    wins: []
  },
  // Engineering
  {
    id: "eng-1",
    title: "Build in Public",
    category: "Engineering",
    description: "Share our learnings, open source our utilities, and build a dev brand.",
    keyResults: [],
    wins: []
  },
  {
    id: "eng-2",
    title: "Strengthen Platform Security, Reliability, and Observability",
    category: "Engineering",
    keyResults: [],
    wins: []
  },
  {
    id: "eng-3",
    title: "Contribution Parity Among All Team members",
    category: "Engineering",
    keyResults: [],
    wins: []
  },
  {
    id: "eng-4",
    title: "Master Rapid Prototyping by Leveraging AI",
    category: "Engineering",
    keyResults: [],
    wins: []
  },
  // Product
  {
    id: "prod-1",
    title: "Build Tools and Automations to Scale Our Marketplace",
    category: "Product",
    description: "Engineering builds what sales needs to sell media. Campaign management, reporting, inventory tools—everything that makes selling easier and running campaigns smoother.",
    initiatives: [
      "Build campaign management workflows that support full deal lifecycle",
      "Ship reporting and analytics that prove value to advertisers",
      "Automate ad ops friction (trafficking, make-goods, reconciliation)"
    ],
    wins: [],
    keyResults: [
        {
            id: "prod-1-kr-1",
            title: "Workflow releases from gap list shipped",
            type: "win_condition",
            current: 0,
            target: 20,
            unit: "releases",
            winLog: []
        },
        {
            id: "prod-1-kr-2",
            title: "Ad ops automation coverage",
            type: "leading",
            current: 0,
            target: 100,
            unit: "%",
        },
         {
            id: "prod-1-kr-3",
            title: "Concurrent campaigns running without incident",
            type: "lagging",
            current: 0,
            target: 30,
            unit: "campaigns",
        }
    ]
  },
  {
    id: "prod-2",
    title: "Ship the v2 Platform and Foundation Systems",
    category: "Product",
    keyResults: [],
    wins: []
  },
  {
    id: "prod-3",
    title: "Build Roadmap Discipline That Earns Trust",
    category: "Product",
    keyResults: [],
    wins: []
  },
  // Marketing
  {
    id: "mkt-1",
    title: "Establish Automated Direct as a recognized buying category",
    category: "Marketing",
    keyResults: [],
    wins: []
  },
  {
    id: "mkt-2",
    title: "Grow Frequency's brand awareness and credibility with agency and brand buyers",
    category: "Marketing",
    keyResults: [],
    wins: []
  },
  {
    id: "mkt-3",
    title: "Build a visible, credible brand voice for Frequency",
    category: "Marketing",
    keyResults: [],
    wins: []
  },
  {
    id: "mkt-4",
    title: "Generate Qualified Leads for Sales",
    category: "Marketing",
    keyResults: [],
    wins: []
  },
  // Sales
  {
    id: "sales-1",
    title: "Make Media Sales the Dominant Source of Revenue",
    category: "Sales",
    keyResults: [],
    wins: []
  },
  {
    id: "sales-2",
    title: "Build a Scalable, Diversified Advertiser Base for PPN",
    category: "Sales",
    keyResults: [],
    wins: []
  },
  {
    id: "sales-3",
    title: "Protect and Expand Recurring License Revenue & Ad Serving",
    category: "Sales",
    keyResults: [],
    wins: []
  },
  // Success
  {
    id: "success-1",
    title: "Improve Customer Intelligence",
    category: "Success",
    keyResults: [],
    wins: []
  },
  {
    id: "success-2",
    title: "Expand Customer Revenue",
    category: "Success",
    keyResults: [],
    wins: []
  },
  {
    id: "success-3",
    title: "Increase Usage of the Product for Direct Sales",
    category: "Success",
    keyResults: [],
    wins: []
  }
];

export const CATEGORIES = ["All", "Company", "Engineering", "Product", "Marketing", "Sales", "Success"];
