import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import { isMissionCompleted } from "./analyzer.js";
import type { PillowSequenceEntry } from "./catalog.js";
import type {
  MissionDependencyCheck,
  MissionEvidence,
} from "./types.js";

function evidence(source: string, detail: string, artifact?: string): MissionEvidence {
  return { source, detail, artifact };
}

export function checkPrerequisite(
  prereqId: string,
  memory: RepositoryMemoryState,
  bootstrap: EmpireBootstrapContext,
): MissionDependencyCheck {
  if (prereqId.startsWith("PILLOW-")) {
    const satisfied = isMissionCompleted(prereqId, memory);
    return {
      id: prereqId,
      label: `Pillow mission ${prereqId} complete`,
      satisfied,
      required: true,
      evidence: [
        evidence(
          "JOURNEY.md",
          satisfied
            ? `${prereqId} marked complete in Journey`
            : `${prereqId} not yet complete`,
          "JOURNEY.md",
        ),
      ],
    };
  }

  if (prereqId.startsWith("REAL-")) {
    const entity = memory.domains.realOwners.value.find((r) => r.id === prereqId);
    const journeyComplete = memory.domains.completedMissions.value.some(
      (m) => m.id === prereqId,
    );
    const satisfied = journeyComplete || Boolean(entity);
    return {
      id: prereqId,
      label: `REAL owner ${prereqId} built`,
      satisfied,
      required: true,
      evidence: [
        evidence(
          entity ? "runtime" : "JOURNEY.md",
          satisfied
            ? `${prereqId} present in repository`
            : `${prereqId} not verified`,
          entity?.path,
        ),
      ],
    };
  }

  void bootstrap;
  return {
    id: prereqId,
    label: prereqId,
    satisfied: false,
    required: true,
    evidence: [evidence("repository", `Dependency ${prereqId} not verified`)],
  };
}

export function validateMissionDependencies(
  entry: PillowSequenceEntry,
  memory: RepositoryMemoryState,
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
): MissionDependencyCheck[] {
  const checks = entry.prerequisites.map((p) =>
    checkPrerequisite(p, memory, bootstrap),
  );

  const contractPresent = bootstrap.knownContracts.some(
    (c) => c.present && c.descriptor.relativePath.includes("PILLOW"),
  );
  checks.push({
    id: "PILLOW_ARCHITECTURE_CONTRACT",
    label: "Pillow Architecture Contract present",
    satisfied: contractPresent,
    required: entry.id.startsWith("PILLOW-"),
    evidence: [
      evidence(
        "bootstrap",
        contractPresent ? "Contract artifact loaded" : "Contract missing",
        "PILLOW_ARCHITECTURE_CONTRACT.md",
      ),
    ],
  });

  if (entry.id.startsWith("PILLOW-")) {
    const bootstrapReady = bootstrap.status === "ready";
    checks.push({
      id: "BOOTSTRAP_READY",
      label: "Bootstrap Engine operational",
      satisfied: bootstrapReady,
      required: true,
      evidence: [
        evidence(
          "pillow/src/bootstrap/",
          bootstrapReady ? "Bootstrap ready" : "Bootstrap not ready",
        ),
      ],
    });
  }

  if (intelligence.health.indicators.brokenDependencyChains > 0) {
    checks.push({
      id: "DEPENDENCY_CHAINS",
      label: "No broken dependency chains blocking mission",
      satisfied: false,
      required: false,
      evidence: [
        evidence(
          "intelligence",
          `${intelligence.health.indicators.brokenDependencyChains} broken chains detected`,
          "pillow/src/intelligence/",
        ),
      ],
    });
  }

  return checks;
}

export function dependenciesSatisfied(checks: MissionDependencyCheck[]): boolean {
  return checks
    .filter((c) => c.required)
    .every((c) => c.satisfied);
}

export function blockedByList(checks: MissionDependencyCheck[]): string[] {
  return checks.filter((c) => c.required && !c.satisfied).map((c) => c.id);
}
