import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildFounderPlatformPreparation } from "../../founder-platform-preparation/services/founder-platform-preparation-service.js";
import type { FounderPlatformReadiness } from "../models/founder-platform-readiness.js";

/** REAL-046 — Founder platform readiness (extends REAL-021). */
export function buildFounderPlatformReadiness(
  workspaceId: string,
  companyId: string,
): FounderPlatformReadiness {
  const founderPrep = buildFounderPlatformPreparation(workspaceId, companyId);
  const founderProgram = PROGRAM_CATALOG.find((p) => p.programId === "version-1-completion");

  const checklistItems = [
    { itemId: "auth-scope", label: "Founder auth scope separated from Grand King", pass: founderPrep.grandKingRemainsUnique },
    { itemId: "surfaces-ready", label: "Founder surfaces architecture ready", pass: founderPrep.surfaces.some((s) => s.status === "ARCHITECTURE_READY") },
    { itemId: "tenant-model", label: "Multi-tenant founder model defined", pass: true },
    { itemId: "approval-gates", label: "Founder approval gates distinct from King", pass: founderPrep.surfaces.some((s) => s.surfaceId === "FOUNDER_APPROVALS") },
    { itemId: "mcl-tracked", label: "Founder platform tracked in MCL", pass: !!founderProgram },
    { itemId: "no-merge", label: "Grand King never merged with Founder", pass: founderPrep.neverMergeWithGrandKing },
  ];

  const onboardingChecklist = checklistItems.map((item) => ({
    itemId: item.itemId,
    label: item.label,
    status: item.pass ? "PASS" as const : "PENDING" as const,
    blocker: item.pass ? null : (founderProgram?.nextCursorMission ?? "Complete REAL-021 founder platform preparation"),
  }));

  const passCount = onboardingChecklist.filter((i) => i.status === "PASS").length;
  const readinessScore = Math.round((passCount / onboardingChecklist.length) * 100);

  return {
    moduleId: "founder-platform-readiness",
    missionId: "REAL-046",
    workspaceId,
    companyId,
    grandKingRemainsPlatformOwner: true,
    foundersAreTenants: true,
    extendsMission: "REAL-021",
    onboardingChecklist,
    readinessScore,
    founderPlatformPreparation: founderPrep as unknown as Record<string, unknown>,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
