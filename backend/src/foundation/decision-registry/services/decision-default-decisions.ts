import type { EmpireDecision } from "../models/empire-decision.js";
import { CANONICAL_DECISION_IDS } from "../models/empire-decision.js";

function empireDecision(
  input: Omit<EmpireDecision, "createdAt" | "updatedAt">,
): EmpireDecision {
  const timestamp = new Date().toISOString();
  return {
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Default architectural and strategic decisions — Empire foundation record. */
export function createDefaultDecisions(workspaceId: string): EmpireDecision[] {
  return [
    empireDecision({
      decisionId: CANONICAL_DECISION_IDS.SOUL_FILE_FOUNDATION,
      workspaceId,
      title: "Soul File as Living Identity",
      category: "architectural",
      decision:
        "The Soul File is the permanent living identity document — not a backup, config dump, or static export.",
      reason:
        "Grand King requires continuity of identity, operational memory, and mission history across all Empire operations.",
      alternatives: [
        {
          name: "Static config files",
          description: "Store identity in JSON/YAML config checked into repo",
          rejectedReason: "No runtime evolution, no audit trail, no living memory",
        },
        {
          name: "Database-only identity",
          description: "Identity scattered across module tables",
          rejectedReason: "No single source of truth for Empire continuity",
        },
      ],
      tradeoffs: [
        { benefit: "Living continuity and audit trail", cost: "Additional foundation module complexity" },
        { benefit: "Checksum integrity and versioning", cost: "Storage and sync overhead" },
      ],
      approver: "Grand King Founder",
      approvedAt: "2026-01-01T00:00:00.000Z",
      status: "APPROVED",
      version: 1,
      metadata: { mission: "S001", tier: "foundation" },
    }),
    empireDecision({
      decisionId: CANONICAL_DECISION_IDS.GOVERNANCE_BEFORE_GUARDIAN,
      workspaceId,
      title: "Governance Before Guardian",
      category: "architectural",
      decision:
        "Every orchestrator dispatch passes through Empire Governance before Guardian and execution.",
      reason:
        "Protect The Empire doctrine requires policy enforcement at the decision layer, not just execution layer.",
      alternatives: [
        {
          name: "Guardian-only enforcement",
          description: "Rely on Guardian architecture validator alone",
          rejectedReason: "Guardian validates architecture, not business policy and founder approval",
        },
        {
          name: "Module-level gates only",
          description: "Each module checks env flags independently",
          rejectedReason: "Inconsistent enforcement, hardcoded logic, no central audit",
        },
      ],
      tradeoffs: [
        { benefit: "Centralized policy enforcement and audit", cost: "Latency on every dispatch" },
        { benefit: "Founder approval gates unified", cost: "Modules must route through orchestrator" },
      ],
      approver: "Grand King Founder",
      approvedAt: "2026-01-15T00:00:00.000Z",
      status: "APPROVED",
      version: 1,
      metadata: { mission: "S003", tier: "core" },
    }),
    empireDecision({
      decisionId: CANONICAL_DECISION_IDS.DOCTRINE_AS_POLICY,
      workspaceId,
      title: "Doctrines as Executable Policies",
      category: "strategic",
      decision:
        "Empire doctrines compile into governance policies — law becomes enforcement, not documentation.",
      reason:
        "Doctrines must be executable, not shelf-ware. Protect The Empire requires runtime enforcement.",
      alternatives: [
        {
          name: "Doctrines as documentation only",
          description: "Markdown docs referenced by modules manually",
          rejectedReason: "No enforcement, drift between law and behavior",
        },
      ],
      tradeoffs: [
        { benefit: "Law and enforcement stay aligned", cost: "Doctrine compiler maintenance" },
        { benefit: "Lifecycle tracking with references", cost: "Priority resolution complexity" },
      ],
      approver: "Grand King Founder",
      approvedAt: "2026-02-01T00:00:00.000Z",
      status: "APPROVED",
      version: 1,
      metadata: { mission: "S005", tier: "core" },
    }),
    empireDecision({
      decisionId: CANONICAL_DECISION_IDS.POLICY_WITHOUT_CODE_CHANGE,
      workspaceId,
      title: "Business Policy Without Code Changes",
      category: "strategic",
      decision:
        "Business decisions (product selection, ad approval, capital gates) are configurable policies — modules resolve, never hardcode.",
      reason:
        "Grand King must change business rules without redeploying core modules or modifying orchestrator logic.",
      alternatives: [
        {
          name: "Hardcoded env flags per module",
          description: "Each module reads process.env directly",
          rejectedReason: "Scattered configuration, no audit, requires code deploy to change",
        },
        {
          name: "Feature flags SaaS",
          description: "External feature flag service",
          rejectedReason: "External dependency, no Empire sovereignty, no governance integration",
        },
      ],
      tradeoffs: [
        { benefit: "Runtime configurability with audit", cost: "Policy engine as new foundation layer" },
        { benefit: "Compiles to governance enforcement", cost: "Policy/governance priority ordering" },
      ],
      approver: "Grand King Founder",
      approvedAt: "2026-02-15T00:00:00.000Z",
      status: "APPROVED",
      version: 1,
      metadata: { mission: "S006", tier: "operational" },
    }),
  ];
}
