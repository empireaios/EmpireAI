import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { EmpirePlaybookEngine, EmpirePlaybookId } from "../models/empire-playbook-engine.js";
import { EMPIRE_PLAYBOOKS } from "../models/empire-playbook-engine.js";

const PLAYBOOK_DEFS: Record<EmpirePlaybookId, { phases: string[]; owner: string; duration: string; programId?: string }> = {
  "Country Launch": {
    phases: ["Market research", "Regulatory check", "Listing localization", "Launch review"],
    owner: "CMO-Marketplace",
    duration: "4-6 weeks",
    programId: "marketplace-intelligence",
  },
  "Marketplace Launch": {
    phases: ["OAR credential", "Catalog sync", "Listing publish", "Performance monitor"],
    owner: "CMO-Marketplace",
    duration: "2-4 weeks",
    programId: "operational-access",
  },
  "Supplier Selection": {
    phases: ["Score suppliers", "Sample order", "Fulfillment attach", "SLA sign-off"],
    owner: "CSCO",
    duration: "1-3 weeks",
    programId: "supplier-intelligence",
  },
  "Product Launch": {
    phases: ["GKR pipeline", "Executive debate", "King approval", "Go live"],
    owner: "CEO",
    duration: "2-5 weeks",
    programId: "commerce-execution",
  },
  Scaling: {
    phases: ["Profit validation", "Ad scale", "Inventory buffer", "Executive review"],
    owner: "CFO",
    duration: "Ongoing",
  },
  Recovery: {
    phases: ["Root cause", "Supplier swap", "Listing fix", "Customer outreach"],
    owner: "CXO",
    duration: "1-2 weeks",
  },
  Failure: {
    phases: ["Post-mortem", "Strategic memory record", "Pipeline archive", "Lesson apply"],
    owner: "CKO",
    duration: "3-5 days",
  },
  Expansion: {
    phases: ["New country scan", "Category expansion", "Capital allocation", "King approval"],
    owner: "CEO",
    duration: "6-8 weeks",
  },
};

/** REAL-044 — Empire playbook engine (executive reference only). */
export function buildEmpirePlaybookEngine(
  workspaceId: string,
  companyId: string,
): EmpirePlaybookEngine {
  const playbooks = EMPIRE_PLAYBOOKS.map((playbookId) => {
    const def = PLAYBOOK_DEFS[playbookId];
    const program = def.programId ? PROGRAM_CATALOG.find((p) => p.programId === def.programId) : undefined;
    return {
      playbookId,
      title: playbookId,
      phases: def.phases,
      executiveOwner: def.owner,
      prerequisites: program ? [program.nextCursorMission] : ["Grand King approval"],
      estimatedDuration: def.duration,
    };
  });

  return {
    moduleId: "empire-playbook-engine",
    missionId: "REAL-044",
    workspaceId,
    companyId,
    executiveReferenceOnly: true,
    playbooks,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
