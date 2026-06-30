import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import {
  analyzeMissionIntelligence,
  classifyMissionCategory,
  isMissionCompleted,
} from "./analyzer.js";
import {
  COMMERCIAL_BLOCKER_MISSIONS,
  PILLOW_IMPLEMENTATION_SEQUENCE,
  type PillowSequenceEntry,
} from "./catalog.js";
import {
  blockedByList,
  dependenciesSatisfied,
  validateMissionDependencies,
} from "./dependencies.js";
import {
  assignMissionPriority,
  comparePriority,
  readinessFromDependencies,
} from "./priority.js";
import type {
  MissionCandidate,
  MissionEvidence,
  MissionPlan,
} from "./types.js";

function evidence(source: string, detail: string, artifact?: string): MissionEvidence {
  return { source, detail, artifact };
}

function buildPillowCandidate(
  entry: PillowSequenceEntry,
  sequenceOrder: number,
  memory: RepositoryMemoryState,
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  intel: ReturnType<typeof analyzeMissionIntelligence>,
  isNextInSequence: boolean,
): MissionCandidate | null {
  if (isMissionCompleted(entry.id, memory)) return null;

  const deps = validateMissionDependencies(entry, memory, bootstrap, intelligence);
  const satisfied = dependenciesSatisfied(deps);
  const blockedBy = blockedByList(deps);
  const readiness = readinessFromDependencies(satisfied, blockedBy);
  const category = classifyMissionCategory(entry.id);

  const priority = assignMissionPriority({
    missionId: entry.id,
    category,
    readiness,
    isNextInSequence,
    intelligence: intel,
  });

  return {
    id: entry.id,
    title: entry.title,
    category,
    priority,
    readiness,
    sequenceOrder,
    dependencies: deps,
    blockedBy,
    evidence: [
      evidence("PILLOW_ARCHITECTURE_CONTRACT.md", `Part 7 sequence slot ${sequenceOrder}`, entry.id),
      evidence("JOURNEY.md", `Pending Pillow mission ${entry.id}`, "JOURNEY.md"),
    ],
    objective: entry.objective,
    authority: entry.authority,
  };
}

function buildPendingCandidates(
  memory: RepositoryMemoryState,
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  intel: ReturnType<typeof analyzeMissionIntelligence>,
  startOrder: number,
): MissionCandidate[] {
  const candidates: MissionCandidate[] = [];
  let order = startOrder;

  for (const pending of memory.domains.pendingMissions.value) {
    if (PILLOW_IMPLEMENTATION_SEQUENCE.some((e) => e.id === pending.id)) continue;
    if (isMissionCompleted(pending.id, memory)) continue;

    const category = classifyMissionCategory(pending.id);
    const deps: MissionCandidate["dependencies"] = [
      {
        id: "JOURNEY_STATUS",
        label: `${pending.id} listed as pending in Journey`,
        satisfied: true,
        required: true,
        evidence: [evidence("JOURNEY.md", pending.status, "JOURNEY.md")],
      },
    ];

    const readiness = readinessFromDependencies(true, []);
    const priority = assignMissionPriority({
      missionId: pending.id,
      category,
      readiness,
      intelligence: intel,
    });

    candidates.push({
      id: pending.id,
      title: pending.label,
      category,
      priority,
      readiness,
      sequenceOrder: order++,
      dependencies: deps,
      blockedBy: [],
      evidence: [evidence("JOURNEY.md", pending.label, pending.phase)],
      objective: `Complete ${pending.id} per Journey and applicable contract.`,
      authority: "JOURNEY.md · EMPIREAI_STATUS.md",
    });
  }

  for (const blocker of COMMERCIAL_BLOCKER_MISSIONS) {
    if (isMissionCompleted(blocker.id, memory)) continue;
    const journeyPending = memory.domains.pendingMissions.value.some(
      (m) => m.id === blocker.id,
    );
    if (!journeyPending && intel.commercialReady) continue;

    const deps = blocker.prerequisites.map((p) => ({
      id: p,
      label: `${p} prerequisite`,
      satisfied: isMissionCompleted(p, memory),
      required: true,
      evidence: [evidence("JOURNEY.md", `Prerequisite ${p}`, "JOURNEY.md")],
    }));

    const blockedBy = deps.filter((d) => !d.satisfied).map((d) => d.id);
    const readiness = readinessFromDependencies(blockedBy.length === 0, blockedBy);

    candidates.push({
      id: blocker.id,
      title: blocker.title,
      category: blocker.category,
      priority: assignMissionPriority({
        missionId: blocker.id,
        category: blocker.category,
        readiness,
        blocksCommercial: true,
        intelligence: intel,
      }),
      readiness,
      sequenceOrder: order++,
      dependencies: deps,
      blockedBy,
      evidence: [
        evidence("EMPIREAI_STATUS.md", "Commercial gate blocker", "EMPIREAI_STATUS.md"),
        evidence("PROGRAM_CATALOG", blocker.objective),
      ],
      objective: blocker.objective,
      authority: blocker.authority,
    });
  }

  void bootstrap;
  void intelligence;
  return candidates;
}

function buildSyncCandidate(
  intel: ReturnType<typeof analyzeMissionIntelligence>,
  order: number,
  pillowNextReady: boolean,
): MissionCandidate | null {
  if (!intel.syncRequired) return null;

  return {
    id: "REPOSITORY-SYNC",
    title: "Repository Synchronization",
    category: "repository_synchronization",
    priority: pillowNextReady ? "normal" : "high",
    readiness: "ready",
    sequenceOrder: 900 + order,
    dependencies: [
      {
        id: "JOURNEY_AUDIT",
        label: "Journey Audit available for sync log",
        satisfied: true,
        required: true,
        evidence: [evidence("JOURNEY_AUDIT.md", "Audit log present", "JOURNEY_AUDIT.md")],
      },
    ],
    blockedBy: [],
    evidence: intel.driftSignals.map((s) =>
      evidence("memory/consistency", s, "pillow/src/memory/"),
    ),
    objective:
      "Synchronize Journey, Status, and governance artifacts with repository drift signals.",
    authority: "EMPIREAI_JOURNEY_FIRST_DOCTRINE.md · ROUTE 02 / ADR-020",
  };
}

export function buildMissionPlan(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryState,
): MissionPlan {
  const started = performance.now();
  const intel = analyzeMissionIntelligence(bootstrap, intelligence, memory);

  const candidates: MissionCandidate[] = [];
  let nextIncompleteIndex = -1;

  for (let i = 0; i < PILLOW_IMPLEMENTATION_SEQUENCE.length; i++) {
    const entry = PILLOW_IMPLEMENTATION_SEQUENCE[i]!;
    if (!isMissionCompleted(entry.id, memory)) {
      if (nextIncompleteIndex < 0) nextIncompleteIndex = i;
      const candidate = buildPillowCandidate(
        entry,
        i,
        memory,
        bootstrap,
        intelligence,
        intel,
        i === nextIncompleteIndex,
      );
      if (candidate) candidates.push(candidate);
    }
  }

  const pillowCount = PILLOW_IMPLEMENTATION_SEQUENCE.length;
  candidates.push(
    ...buildPendingCandidates(memory, bootstrap, intelligence, intel, pillowCount),
  );

  const nextPillowReady = candidates.some(
    (c) => c.category === "pillow" && c.readiness === "ready" && c.blockedBy.length === 0,
  );

  const syncCandidate = buildSyncCandidate(intel, candidates.length, nextPillowReady);
  if (syncCandidate) candidates.push(syncCandidate);

  candidates.sort((a, b) => {
    const p = comparePriority(a.priority, b.priority);
    if (p !== 0) return p;
    return a.sequenceOrder - b.sequenceOrder;
  });

  const ready = candidates.filter((c) => c.readiness === "ready");
  const blockedMissions = candidates.filter((c) => c.readiness !== "ready");

  const nextMission =
    ready.find((c) => c.readiness === "ready" && c.priority !== "deferred") ??
    ready[0] ??
    null;

  return {
    plannerVersion: "PILLOW-006",
    status: "ready",
    plannedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    repositoryFingerprint: memory.repositoryFingerprint,
    intelligence: intel,
    queue: candidates,
    nextMission,
    blockedMissions,
  };
}

export function findSequenceEntry(missionId: string): PillowSequenceEntry | undefined {
  return PILLOW_IMPLEMENTATION_SEQUENCE.find((e) => e.id === missionId);
}
