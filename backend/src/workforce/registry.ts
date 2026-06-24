import type { WorkforceOrgChart, WorkforceRoleDefinition, WorkforceRoleId } from "./types.js";

const ROLES: WorkforceRoleDefinition[] = [
  {
    id: "ai-ceo",
    title: "AI CEO",
    module: "ai-ceo",
    agentId: "ai-ceo",
    authorityLevel: "L3",
    status: "active",
    responsibilities: ["Portfolio strategy", "Daily priorities", "Cross-module orchestration"],
  },
  {
    id: "ai-cfo",
    title: "AI CFO",
    module: "finance",
    agentId: "finance-analyst",
    authorityLevel: "L2",
    status: "active",
    reportsTo: "ai-ceo",
    responsibilities: ["P&L reporting", "Margin analysis", "Financial risk signals"],
  },
  {
    id: "ai-product-intelligence",
    title: "AI Product Intelligence",
    module: "intelligence",
    agentId: "product-intelligence",
    authorityLevel: "L1",
    status: "active",
    reportsTo: "ai-ceo",
    responsibilities: ["Market scanning", "Product scoring", "Opportunity ranking"],
  },
  {
    id: "ai-product-scout",
    title: "AI Product Scout",
    module: "product-scout",
    agentId: "product-scout",
    authorityLevel: "L1",
    status: "active",
    reportsTo: "ai-product-intelligence",
    responsibilities: [
      "Product opportunity evaluation",
      "Portfolio scanning",
      "Empire score recommendations",
      "Guardian-gated approvals",
    ],
  },
  {
    id: "ai-marketing-director",
    title: "AI Marketing Director",
    module: "marketing",
    agentId: "marketing-ai",
    authorityLevel: "L2",
    status: "active",
    reportsTo: "ai-ceo",
    responsibilities: ["Campaign strategy", "Content pipeline", "Channel optimization"],
  },
  {
    id: "ai-operations",
    title: "AI Operations",
    module: "orders",
    agentId: "order-ops",
    authorityLevel: "L1",
    status: "active",
    reportsTo: "ai-ceo",
    responsibilities: ["Order fulfillment", "Logistics coordination", "SLA monitoring"],
  },
  {
    id: "ai-supplier-manager",
    title: "AI Supplier Manager",
    module: "suppliers",
    agentId: "supplier-network",
    authorityLevel: "L1",
    status: "active",
    reportsTo: "ai-operations",
    responsibilities: ["Supplier health", "Sourcing recovery", "Catalog validation"],
  },
  {
    id: "ai-supplier-intelligence",
    title: "AI Supplier Intelligence",
    module: "supplier-intelligence",
    agentId: "supplier-intelligence",
    authorityLevel: "L1",
    status: "active",
    reportsTo: "ai-supplier-manager",
    responsibilities: [
      "Supplier discovery",
      "Trust scoring",
      "Fake supplier detection",
      "Supplier comparison",
    ],
  },
  {
    id: "ai-customer-success",
    title: "AI Customer Success",
    module: "support",
    agentId: "support-ai",
    authorityLevel: "L1",
    status: "active",
    reportsTo: "ai-ceo",
    responsibilities: ["Ticket resolution", "Retention signals", "CSAT optimization"],
  },
  {
    id: "ai-treasurer",
    title: "AI Treasurer",
    module: "finance",
    authorityLevel: "L3",
    status: "prepared",
    reportsTo: "ai-cfo",
    responsibilities: ["Cash buckets", "Withdrawal safety", "Royalty calculation"],
  },
  {
    id: "ai-guardian",
    title: "AI Guardian",
    module: "admin",
    authorityLevel: "L4",
    status: "active",
    reportsTo: "ai-ceo",
    responsibilities: ["Architecture validation", "Risk registry", "Recovery planning", "Health monitoring"],
  },
];

export class WorkforceRegistry {
  list(): WorkforceRoleDefinition[] {
    return [...ROLES];
  }

  get(roleId: WorkforceRoleId): WorkforceRoleDefinition | undefined {
    return ROLES.find((r) => r.id === roleId);
  }

  orgChart(): WorkforceOrgChart {
    return { roles: this.list(), checkedAt: new Date().toISOString() };
  }
}

export const workforceRegistry = new WorkforceRegistry();
