import type { StrategicMemoryEntry } from "../models/strategic-memory.js";

function memory(
  input: Omit<StrategicMemoryEntry, "createdAt" | "updatedAt" | "recallCount">,
): StrategicMemoryEntry {
  const timestamp = new Date().toISOString();
  return {
    ...input,
    recallCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Default strategic memories — Empire long-term learning from foundation missions. */
export function createDefaultStrategicMemories(workspaceId: string): StrategicMemoryEntry[] {
  return [
    memory({
      memoryId: "memory:governance-before-guardian",
      workspaceId,
      category: "architecture",
      title: "Governance Before Guardian",
      insight:
        "Policy enforcement must run at the orchestrator decision layer — Guardian alone cannot enforce founder approval or env gates.",
      context: "S003 Empire Governance Engine — orchestrator wiring",
      tags: ["governance", "orchestrator", "foundation"],
      source: "foundation-bootstrap",
      importance: 5,
      status: "ACTIVE",
      version: 1,
      metadata: { mission: "S003" },
    }),
    memory({
      memoryId: "memory:revenue-truth-doctrine",
      workspaceId,
      category: "businessLessons",
      title: "Revenue Truth Requires Ledger Backing",
      insight:
        "All revenue claims must trace to financial ledger events — vanity metrics without ledger truth violate Empire doctrine.",
      context: "S005 Doctrine Engine — Revenue Truth doctrine",
      tags: ["revenue", "ledger", "doctrine"],
      source: "doctrine-engine",
      importance: 5,
      status: "ACTIVE",
      version: 1,
      metadata: { mission: "S005" },
    }),
    memory({
      memoryId: "memory:policy-without-code",
      workspaceId,
      category: "successes",
      title: "Configurable Policies Beat Hardcoded Gates",
      insight:
        "Business rules as policy-engine configurations let Grand King change behavior without redeploying core modules.",
      context: "S006 Policy Engine — product selection, ad approval, capital gates",
      tags: ["policy", "configuration", "success"],
      source: "policy-engine",
      importance: 4,
      status: "ACTIVE",
      version: 1,
      metadata: { mission: "S006" },
    }),
    memory({
      memoryId: "memory:live-without-gates-failure",
      workspaceId,
      category: "failures",
      title: "Live Actions Without Env Gates Are Destructive",
      insight:
        "Attempting meta ads launch, production deploy, or live payments without env gates risks unrecoverable live damage.",
      context: "Pre-governance era — env flags scattered across modules",
      tags: ["governance", "env-gates", "failure"],
      source: "empire-governance",
      importance: 5,
      status: "ACTIVE",
      version: 1,
      metadata: { tier: "core" },
    }),
    memory({
      memoryId: "memory:capital-reserved-cash",
      workspaceId,
      category: "capitalLessons",
      title: "Reserved Cash Before Withdrawal",
      insight:
        "Treasury must reserve refunds, supplier costs, ad spend, and royalties before marking cash as withdrawable.",
      context: "Treasury engine bucket computation from ledger",
      tags: ["treasury", "capital", "reserved-cash"],
      source: "treasury-engine",
      importance: 4,
      status: "ACTIVE",
      version: 1,
      metadata: { mission: "foundation" },
    }),
    memory({
      memoryId: "memory:supplier-sandbox-first",
      workspaceId,
      category: "supplierLessons",
      title: "Sandbox Supplier Before Live CJ Submit",
      insight:
        "Live CJ fulfillment requires sandbox validation and governance clearance — never submit live orders without gates.",
      tags: ["supplier", "cj", "sandbox"],
      source: "live-cj-fulfillment",
      importance: 4,
      status: "ACTIVE",
      version: 1,
      metadata: { gate: "LIVE_CJ_FULFILLMENT_ENABLED" },
    }),
    memory({
      memoryId: "memory:marketing-founder-approval",
      workspaceId,
      category: "marketingLessons",
      title: "Ad Launch Requires Founder Approval",
      insight:
        "Meta campaign live launch must pass policy-engine ad approval and governance founder gate — drafts are safe, live is not.",
      tags: ["marketing", "meta-ads", "approval"],
      source: "meta-ads-connector",
      importance: 4,
      status: "ACTIVE",
      version: 1,
      metadata: { policy: "policy:ad-approval" },
    }),
  ];
}
