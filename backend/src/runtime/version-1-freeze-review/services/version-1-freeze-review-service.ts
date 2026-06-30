import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildVersion1GoldMaster } from "../../version-1-gold-master/services/version-1-gold-master-service.js";
import { buildVersion1Lockdown } from "../../version-1-lockdown/services/version-1-lockdown-service.js";
import type { Version1FreezeReview } from "../models/version-1-freeze-review.js";

type ReviewItem = Version1FreezeReview["items"][number];

/** REAL-097 — Version 1 freeze review (lockdown + gold master + MCL blockers). */
export function buildVersion1FreezeReview(
  workspaceId: string,
  companyId: string,
): Version1FreezeReview {
  const lockdown = buildVersion1Lockdown(workspaceId, companyId);
  const goldMaster = buildVersion1GoldMaster(workspaceId, companyId);
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  const items: ReviewItem[] = [];

  items.push({
    itemId: "lockdown-baseline",
    label: "Version 1 lockdown baseline (REAL-025)",
    score: lockdown.baseline.architectureSnapshot.readinessScore,
    status: lockdown.baseline.versionLock.locked ? "READY" : "BLOCKED",
    recommendation: "Preserve baseline hash — all post-freeze changes require Version 2+ designation",
    evidence: `baselineHash=${lockdown.baseline.versionLock.baselineHash} · ${lockdown.baseline.moduleInventory.length} modules · ${lockdown.baseline.databaseInventory.length} tables`,
    why: "Freeze requires immutable Version 1 baseline before release candidate",
  });

  items.push({
    itemId: "gold-master-certificate",
    label: "Version 1 gold master certificate (REAL-050)",
    score: goldMaster.acceptanceScore,
    status: goldMaster.version1Certificate.goldMaster ? "READY" : "PENDING",
    recommendation: goldMaster.acceptanceScore >= 80
      ? "Gold master threshold met — include in freeze package"
      : "Raise acceptance score to ≥80 before gold master sign-off",
    evidence: `acceptance=${goldMaster.acceptanceScore}% · version=${goldMaster.version} · missions=${goldMaster.missionInventory.length}`,
    why: "Gold master certifies REAL-036→REAL-050 production go-live stack",
  });

  items.push({
    itemId: "freeze-readiness-gate",
    label: "Ready for freeze?",
    score: blockingPrograms.length === 0 && goldMaster.acceptanceScore >= 80 ? 90 : 45,
    status: blockingPrograms.length === 0 ? "PENDING" : "BLOCKED",
    recommendation: blockingPrograms.length === 0
      ? "Proceed to REAL-098 release candidate after final UX/security reviews"
      : `Resolve ${blockingPrograms.length} blocksUsd100k programs before freeze`,
    evidence: `blockingPrograms=${blockingPrograms.length} · lockdown=${lockdown.architectureComplete} · gold=${goldMaster.architectureComplete}`,
    why: "Freeze locks architecture — outstanding USD 100K blockers must be documented not hidden",
  });

  for (const program of blockingPrograms) {
    items.push({
      itemId: `blocker-${program.programId}`,
      label: `Blocker: ${program.name}`,
      score: program.baseCompletionPercent,
      status: "BLOCKED",
      recommendation: program.nextCursorMission,
      evidence: `${program.baseCompletionPercent}% · packages: ${program.remainingPackages.join(", ")}`,
      why: program.realWorldDependencies.join("; ") || "blocksUsd100k=true in PROGRAM_CATALOG",
    });
  }

  items.push({
    itemId: "inventory-parity",
    label: "Lockdown vs gold master inventory parity",
    score: lockdown.baseline.architectureSnapshot.runtimeModuleCount === goldMaster.runtimeModuleCount ? 85 : 60,
    status: lockdown.baseline.architectureSnapshot.runtimeModuleCount === goldMaster.runtimeModuleCount ? "READY" : "PENDING",
    recommendation: "Reconcile module counts if lockdown and gold master diverge",
    evidence: `lockdown=${lockdown.baseline.architectureSnapshot.runtimeModuleCount} · gold=${goldMaster.runtimeModuleCount} · catalog=${PROGRAM_CATALOG.length}`,
    why: "Inventory mismatch indicates baseline drift since REAL-025 lock",
  });

  const avgScore = Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
  const readyForFreeze = blockingPrograms.length <= 3
    && goldMaster.acceptanceScore >= 80
    && lockdown.baseline.versionLock.locked;

  return {
    moduleId: "version-1-freeze-review",
    missionId: "REAL-097",
    workspaceId,
    companyId,
    summary: `REAL-097 — freeze ${readyForFreeze ? "conditionally ready" : "not ready"} · ${blockingPrograms.length} USD 100K blockers · acceptance ${goldMaster.acceptanceScore}%`,
    items,
    reusedModules: ["version-1-lockdown", "version-1-gold-master", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
