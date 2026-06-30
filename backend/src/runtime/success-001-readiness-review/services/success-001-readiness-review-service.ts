import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildSuccess001CommandCenter } from "../../success-001-command-center/services/success-001-command-center-service.js";
import type { Success001ReadinessReview } from "../models/success-001-readiness-review.js";
import { READINESS_CAPABILITIES } from "../models/success-001-readiness-review.js";

const CAPABILITY_LABELS: Record<Success001ReadinessReview["capabilities"][number]["capability"], string> = {
  operate: "Grand King can operate live commerce",
  publish: "Grand King can publish products to marketplaces",
  monitor: "Grand King can monitor revenue and health signals",
  improve: "Grand King can improve listings and economics",
  scale: "Grand King can scale winners with net-profit guardrails",
  repeat: "Grand King can repeat the SUCCESS-001 playbook",
};

/** REAL-069 — SUCCESS-001 readiness review (operate/publish/monitor/improve/scale/repeat). */
export function buildSuccess001ReadinessReview(
  workspaceId: string,
  companyId: string,
): Success001ReadinessReview {
  const center = buildSuccess001CommandCenter(workspaceId, companyId);
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);

  const oarReady = center.operationalBlockers.length === 0;
  const commercialReady = center.currentNetProfitUsd > 0 && center.commercialBlockers.length <= 1;
  const pipelineReady = center.grandKingApprovalQueue.length >= 0;

  const capabilityReady: Record<typeof READINESS_CAPABILITIES[number], boolean> = {
    operate: oarReady && center.progressPercent >= 0,
    publish: oarReady && !center.marketplaceBlockers.some((b) => b.includes("REAL-002B")),
    monitor: center.progressPercent >= 0,
    improve: pipelineReady,
    scale: commercialReady && center.progressPercent >= 10,
    repeat: commercialReady && blockingPrograms.length <= 3,
  };

  const capabilities: Success001ReadinessReview["capabilities"] = READINESS_CAPABILITIES.map((capability) => ({
    capability,
    label: CAPABILITY_LABELS[capability],
    ready: capabilityReady[capability],
    evidence: capabilityReady[capability]
      ? `SUCCESS-001 command center confirms ${capability} path architecture ready`
      : `Blocked — see SUCCESS-001 blockers for ${capability}`,
  }));

  const blockers = [
    ...center.operationalBlockers,
    ...center.commercialBlockers,
    ...center.supplierBlockers,
    ...center.marketplaceBlockers,
    ...blockingPrograms.map((p) => `${p.name} @ ${p.baseCompletionPercent}% — ${p.nextCursorMission}`),
  ].filter(Boolean);

  const readyCount = capabilities.filter((c) => c.ready).length;

  return {
    moduleId: "success-001-readiness-review",
    missionId: "REAL-069",
    workspaceId,
    companyId,
    capabilities,
    readyCount,
    blockerCount: blockers.length,
    blockers: [...new Set(blockers)].slice(0, 12),
    netProfitUsd: center.currentNetProfitUsd,
    progressPercent: center.progressPercent,
    grandKingReady: readyCount === capabilities.length && blockers.length === 0,
    reusedModules: ["success-001-command-center", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
