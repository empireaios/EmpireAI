import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { DriftFinding, MissionContextPackage, SyncStepResult } from "./types.js";
import { VISION_SYNC_ARTIFACTS } from "./paths.js";

function extractVisionVersion(visionText: string | null): string | null {
  if (!visionText) return null;
  const idMatch = visionText.match(/\*\*Document ID:\*\*\s*(.+)/);
  if (idMatch) return idMatch[1]!.trim();
  const phaseMatch = visionText.match(/P1-01|CON-001/);
  return phaseMatch ? "P1-01 · CON-001" : null;
}

function extractCurrentRoadmapItem(
  doctrineText: string | null,
  bootstrap: EmpireBootstrapContext,
): string {
  if (doctrineText) {
    const inProgress = doctrineText.match(
      /P4-02[^\n]*\|\s*\*\*In progress\*\*|P4-02[^\n]*Complete/i,
    );
    if (inProgress) return "P4-02 — Vision Synchronization (constitutional execution)";
    const p4Line = doctrineText.match(/P4-0\d[^\n|]+\|[^\n]+/g);
    if (p4Line?.length) {
      const incomplete = p4Line.find((l) => !/Complete/i.test(l));
      if (incomplete) return incomplete.split("|")[0]?.trim() ?? incomplete;
    }
  }
  return (
    bootstrap.knownActiveWork.currentMission ??
    bootstrap.currentMission ??
    bootstrap.journeyPosition ??
    "Unscoped — constitutional framework + Grand King directive"
  );
}

function extractWhy(bootstrap: EmpireBootstrapContext, visionExcerpt: string | null): string {
  const briefing = bootstrap.executiveBriefing;
  if (briefing.supremeDirective) return briefing.supremeDirective;
  if (visionExcerpt?.includes("manufacture companies")) {
    return "EmpireAI manufactures companies — commercial probability over technical demonstration.";
  }
  return bootstrap.executiveBriefing.direction.currentObjective;
}

function extractLessons(accumulationText: string | null, memory: RepositoryMemoryState): string[] {
  const lessons: string[] = [];
  if (accumulationText) {
    const lines = accumulationText
      .split("\n")
      .filter((l) => /^[-*]\s/.test(l.trim()) || /lesson|learned|accumulation/i.test(l))
      .slice(0, 5);
    lessons.push(...lines.map((l) => l.trim().replace(/^[-*]\s*/, "")));
  }
  const completed = memory.domains.completedMissions.value.slice(0, 3);
  for (const m of completed) {
    lessons.push(`${m.id}: ${m.label} (${m.status})`);
  }
  if (lessons.length === 0) {
    lessons.push("No prior mission lessons recorded — first sync establishes baseline.");
  }
  return lessons;
}

export function buildMissionContextPackage(input: {
  bootstrap: EmpireBootstrapContext;
  memory: RepositoryMemoryState;
  planner: MissionPlannerEngine;
  steps: SyncStepResult[];
  driftFindings: DriftFinding[];
  artifacts: Record<string, string | null>;
  requestMissionId?: string | null;
  requestMissionTitle?: string | null;
}): MissionContextPackage {
  const { bootstrap, memory, planner, steps, driftFindings, artifacts, requestMissionId } =
    input;

  const visionText = artifacts[VISION_SYNC_ARTIFACTS.vision] ?? null;
  const doctrineText = artifacts[VISION_SYNC_ARTIFACTS.doctrineSystem] ?? null;
  const accumulationText = artifacts[VISION_SYNC_ARTIFACTS.visionAccumulation] ?? null;

  const nextMission = planner.determineNextMission();
  const missionId = requestMissionId ?? nextMission?.id ?? bootstrap.currentMission;

  const currentWhy = extractWhy(bootstrap, visionText);
  const currentRoadmapItem = extractCurrentRoadmapItem(doctrineText, bootstrap);

  const constitutionalArticles = [
    "EMPIREAI_CORE_CONSTITUTION_CTD.md (CTD — commercial bounds)",
    "EMPIREAI_CONSTITUTION.md (Engineering Constitution)",
    "EMPIREAI_CONSTITUTION_HIERARCHY.md (governance map)",
    "EMPIREAI_ENGINEERING_STANDARDS.md (P4-01 practice authority)",
  ];

  const relevantArchitecture = [
    VISION_SYNC_ARTIFACTS.canonicalArchitecture,
    VISION_SYNC_ARTIFACTS.builderArchitecture,
    VISION_SYNC_ARTIFACTS.pillowArchitecture,
  ];

  const relevantRepositoryAreas = [
    "pillow/src/vision-synchronization/",
    "pillow/src/cursor-bridge/",
    "pillow/src/supervisor/",
    "backend/src/orchestration/pillow-host/",
    "empireai-web/components/cockpit/development/",
    "docs/governance/",
  ];

  const relevantProductionComponents = [
    "Railway Brain /health",
    "Vercel BFF /api/pillow/*",
    "Pillow host in-process session",
    "Cockpit Vision Synchronization panel",
  ];

  const knownRisks = driftFindings.map((f) => `[${f.severity}] ${f.signal}`);
  if (knownRisks.length === 0) {
    knownRisks.push("Standard engineering risk — verify acceptance criteria before deploy");
  }

  const knownDependencies = nextMission?.blockedBy.length
    ? nextMission.blockedBy
    : nextMission?.dependencies.filter((d) => !d.satisfied).map((d) => d.id) ?? [];

  const previousLessons = extractLessons(accumulationText, memory);
  const acceptanceCriteria = [
    "Vision Synchronization pipeline completes before implementation",
    "Builder refuses when synchronization fails (unless Grand King override)",
    "Cockpit displays synchronization status and drift",
    "Supervisor validates synchronization health at mission launch",
  ];

  const failedCount = steps.filter((s) => s.status === "failed").length;
  const estimatedCompletionTime =
    failedCount > 0 ? "Blocked — resolve sync failures first" : "2–4 hours (P4-02 scope)";

  const visionSummary =
    visionText?.split("\n").find((l) => l.includes("manufacture companies")) ??
    bootstrap.executiveBriefing.identity.empirePurpose;

  return {
    packageVersion: "P4-02",
    missionId,
    visionSummary,
    currentWhy,
    currentRoadmapItem,
    constitutionalArticles,
    relevantArchitecture,
    relevantRepositoryAreas,
    relevantProductionComponents,
    knownRisks,
    knownDependencies,
    previousLessons,
    acceptanceCriteria,
    estimatedCompletionTime,
    why: currentWhy,
    what: input.requestMissionTitle ?? nextMission?.title ?? currentRoadmapItem,
    how: "Pillow Vision Synchronization → Builder gate → Supervisor validation → Cockpit panel",
    proof: "Tests pass · sync pipeline evidence · Grand King acceptance demo",
  };
}

export function summarizeConstitutionalState(steps: SyncStepResult[]): string {
  const hierarchy = steps.find((s) => s.step === "constitution_hierarchy");
  if (!hierarchy) return "Unknown";
  if (hierarchy.status === "failed") return "Incomplete — hierarchy artifacts missing";
  if (hierarchy.status === "degraded") return "Degraded — partial hierarchy load";
  return "Aligned — CTD · Engineering Constitution · Hierarchy loaded";
}

export function summarizeArchitectureState(steps: SyncStepResult[]): string {
  const arch = steps.find((s) => s.step === "architecture");
  if (!arch) return "Unknown";
  return arch.status === "complete"
    ? "Canonical Architecture · Architecture Law · Builder Architecture synchronized"
    : `${arch.status} — review architecture artifacts`;
}

export function summarizeRepositoryState(
  bootstrap: EmpireBootstrapContext,
  memory: RepositoryMemoryState,
): string {
  const health = bootstrap.repositoryHealth;
  const mem = memory.consistency.synchronized ? "memory synchronized" : "memory drift detected";
  return `${health.mandatoryPresent}/${health.mandatoryTotal} mandatory artifacts · ${mem}`;
}

export function summarizeProductionAlignment(steps: SyncStepResult[]): string {
  const prod = steps.find((s) => s.step === "production_truth");
  const state = steps.find((s) => s.step === "current_production_state");
  if (prod?.status === "failed" || state?.status === "failed") {
    return "Production Truth unavailable — fail closed";
  }
  return "Production Truth loaded · verify live endpoints per mission scope";
}

export function extractVisionVersionFromArtifacts(
  artifacts: Record<string, string | null>,
): string | null {
  return extractVisionVersion(artifacts[VISION_SYNC_ARTIFACTS.vision] ?? null);
}
