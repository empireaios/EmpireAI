import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { GoLiveChecklistCategory, GrandKingGoLiveChecklist } from "../models/grand-king-go-live-checklist.js";
import { GO_LIVE_CHECKLIST_CATEGORIES } from "../models/grand-king-go-live-checklist.js";

const CATEGORY_PROGRAM_MAP: Record<GoLiveChecklistCategory, string> = {
  operational: "operational-access",
  commercial: "commerce-execution",
  marketplace: "marketplace-intelligence",
  supplier: "supplier-intelligence",
  security: "foundation",
  deployment: "foundation",
  executive: "executive-intelligence",
  revenue: "proof-of-money",
};

const CATEGORY_LABELS: Record<GoLiveChecklistCategory, string> = {
  operational: "Operational readiness (OAR credentials live)",
  commercial: "Commercial execution (publish path active)",
  marketplace: "Marketplace connections verified",
  supplier: "Supplier fulfillment attached",
  security: "Security and governance policies active",
  deployment: "Production deployment configured",
  executive: "Executive Council operational",
  revenue: "Revenue target path clear (SUCCESS-001)",
};

/** REAL-049 — Grand King go-live checklist with PROGRAM_CATALOG blockers. */
export function buildGrandKingGoLiveChecklist(
  workspaceId: string,
  companyId: string,
): GrandKingGoLiveChecklist {
  const checklists = GO_LIVE_CHECKLIST_CATEGORIES.map((category) => {
    const programId = CATEGORY_PROGRAM_MAP[category];
    const program = PROGRAM_CATALOG.find((p) => p.programId === programId);
    const ready = program ? program.baseCompletionPercent >= 85 && !program.blocksUsd100k : false;
    const blocked = program?.blocksUsd100k ?? false;

    let status: "READY" | "BLOCKED" | "PENDING";
    if (ready) status = "READY";
    else if (blocked) status = "BLOCKED";
    else status = "PENDING";

    const blockerExplanation = blocked || status === "PENDING"
      ? program?.nextCursorMission ?? program?.realWorldDependencies?.join("; ") ?? "Complete program prerequisites"
      : null;

    return {
      itemId: `go-live-${category}`,
      category,
      label: CATEGORY_LABELS[category],
      status,
      blockerExplanation,
      programId: program?.programId ?? null,
    };
  });

  const readyCount = checklists.filter((c) => c.status === "READY").length;
  const blockedCount = checklists.filter((c) => c.status === "BLOCKED").length;

  return {
    moduleId: "grand-king-go-live-checklist",
    missionId: "REAL-049",
    workspaceId,
    companyId,
    checklists,
    readyCount,
    blockedCount,
    totalCount: checklists.length,
    goLiveReady: blockedCount === 0 && readyCount === checklists.length,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
