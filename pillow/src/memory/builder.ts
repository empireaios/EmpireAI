import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type {
  ClassifiedEntity,
  RepositoryIntelligenceContext,
} from "../intelligence/types.js";
import { buildRepositoryFingerprint } from "../context/cache.js";
import type {
  AuditMemoryEntry,
  EnhancementMemoryEntry,
  MemoryItem,
  MemoryProvenance,
  MissionMemoryEntry,
  OwnerMemoryEntry,
  RepositoryMemoryDomains,
  RepositoryMemoryState,
  SyncStateMemory,
} from "./types.js";

function prov(
  sources: string[],
  derivedFrom: MemoryProvenance["derivedFrom"],
): MemoryProvenance {
  return { sources, derivedFrom };
}

function item<T>(
  domain: MemoryItem<T>["domain"],
  value: T,
  provenance: MemoryProvenance,
): MemoryItem<T> {
  return { domain, value, provenance };
}

function isCompletedStatus(status?: string): boolean {
  if (!status) return false;
  return status.includes("✅") || /complete/i.test(status);
}

function isPendingStatus(status?: string): boolean {
  if (!status) return false;
  return (
    status.includes("🔵") ||
    /not started|scheduled|proposed|observed/i.test(status)
  );
}

function missionEntities(entities: ClassifiedEntity[]): ClassifiedEntity[] {
  return entities.filter(
    (e) =>
      /^PILLOW-\d{3}$/.test(e.id) ||
      /^UX-\d{3}$/.test(e.id) ||
      e.classification === "pillow" ||
      e.classification === "ux",
  );
}

function toMissionEntry(e: ClassifiedEntity): MissionMemoryEntry {
  return {
    id: e.id,
    label: e.label,
    status: e.status ?? "unknown",
    phase: e.phase,
  };
}

function toOwnerEntry(e: ClassifiedEntity): OwnerMemoryEntry {
  return { id: e.id, label: e.label, path: e.path };
}

export function buildRepositoryMemory(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
): RepositoryMemoryState {
  const started = performance.now();
  const fingerprint = buildMemoryFingerprint(bootstrap, intelligence);
  const now = new Date().toISOString();

  const missions = missionEntities(intelligence.entities);
  const completed = missions.filter((m) => isCompletedStatus(m.status));
  const pending = missions.filter((m) => isPendingStatus(m.status));

  const doctrineEntities = intelligence.entities.filter(
    (e) => e.classification === "doctrine",
  );
  const contractEntities = intelligence.entities.filter(
    (e) => e.classification === "contract",
  );
  const gcEntities = intelligence.entities.filter(
    (e) => e.classification === "global_component",
  );
  const execCompEntities = intelligence.entities.filter(
    (e) => e.classification === "executive_component",
  );
  const realEntities = intelligence.entities.filter(
    (e) => e.classification === "reality_owner",
  );
  const adrEntities = intelligence.entities.filter(
    (e) => e.classification === "decision" || e.id.startsWith("ADR-"),
  );
  const blEntities = intelligence.entities.filter(
    (e) => e.classification === "backlog" || /^BL-[A-C]$/.test(e.id),
  );
  const archEntities = intelligence.entities.filter(
    (e) =>
      e.classification === "architecture" ||
      e.id.includes("ARCHITECTURE") ||
      e.path?.includes("PILLOW_ARCHITECTURE"),
  );

  const audits: AuditMemoryEntry[] = bootstrap.knownExecutiveAudits.map((a) => ({
    id: a.id,
    path: a.relativePath,
    modifiedAt: a.modifiedAt,
  }));

  const uxEnhancements: EnhancementMemoryEntry[] =
    bootstrap.knownEnhancements.items.map((e) => ({
      id: e.id,
      label: e.label,
      source: bootstrap.knownEnhancements.source,
    }));

  const governanceOwners: OwnerMemoryEntry[] = bootstrap.knownOwners
    .filter((a) => a.present)
    .map((a) => ({
      id: a.descriptor.id,
      label: a.descriptor.description,
      path: a.descriptor.relativePath,
    }));

  const syncState: SyncStateMemory = {
    repositoryFingerprint: fingerprint,
    repositoryVersion: bootstrap.repositoryVersion,
    bootstrapCompletedAt: bootstrap.completedAt,
    intelligenceCompletedAt: intelligence.completedAt,
    journeyAuditPath: "JOURNEY_AUDIT.md",
    activeBacklogRelease: bootstrap.knownBacklog.activeRelease,
    closedBacklogReleases: bootstrap.knownBacklog.closedReleases,
  };

  const domains: RepositoryMemoryDomains = {
    journeyPosition: item(
      "journey_position",
      bootstrap.journeyPosition,
      prov(["JOURNEY.md", "EMPIREAI_STATUS.md"], "bootstrap"),
    ),
    currentMission: item(
      "current_mission",
      bootstrap.currentMission,
      prov(["JOURNEY.md", "EMPIREAI_STATUS.md"], "bootstrap"),
    ),
    completedMissions: item(
      "completed_missions",
      completed.map(toMissionEntry),
      prov(["JOURNEY.md"], "intelligence"),
    ),
    pendingMissions: item(
      "pending_missions",
      pending.map(toMissionEntry),
      prov(["JOURNEY.md", "EMPIREAI_STATUS.md"], "intelligence"),
    ),
    architecture: item(
      "architecture",
      archEntities.map(toOwnerEntry),
      prov(["PILLOW_ARCHITECTURE_CONTRACT.md"], "bootstrap+intelligence"),
    ),
    repositoryHealth: item(
      "repository_health",
      {
        score: intelligence.health.score,
        mandatoryPresent: bootstrap.repositoryHealth.mandatoryPresent,
        mandatoryTotal: bootstrap.repositoryHealth.mandatoryTotal,
        issueCount: intelligence.health.issues.length,
      },
      prov(
        ["pillow/src/intelligence/", "pillow/src/bootstrap/"],
        "bootstrap+intelligence",
      ),
    ),
    repositoryOwners: item(
      "repository_owners",
      governanceOwners,
      prov(["repository reconstruction"], "bootstrap"),
    ),
    doctrines: item(
      "doctrines",
      doctrineEntities.map(toOwnerEntry),
      prov(["EMPIREAI_*_DOCTRINE.md"], "intelligence"),
    ),
    contracts: item(
      "contracts",
      contractEntities.map(toOwnerEntry),
      prov(
        ["UX_IMPLEMENTATION_CONTRACT.md", "PILLOW_ARCHITECTURE_CONTRACT.md"],
        "bootstrap+intelligence",
      ),
    ),
    executiveAudits: item(
      "executive_audits",
      audits,
      prov(["*_VALIDATION_REPORT.md", "*_EXECUTIVE_AUDIT*"], "bootstrap"),
    ),
    decisions: item(
      "decisions",
      {
        adrCount: bootstrap.knownDecisions.adrCount,
        entries: adrEntities.map(toOwnerEntry),
      },
      prov(["EMPIREAI_DECISIONS.md"], "bootstrap+intelligence"),
    ),
    uxEnhancements: item(
      "ux_enhancements",
      uxEnhancements,
      prov(
        ["docs/governance/UX_ENHANCEMENT_REGISTER.md", "JOURNEY.md"],
        "bootstrap+intelligence",
      ),
    ),
    globalComponents: item(
      "global_components",
      gcEntities.map(toOwnerEntry),
      prov(["UX_IMPLEMENTATION_CONTRACT.md#part-2"], "intelligence"),
    ),
    executiveComponents: item(
      "executive_components",
      execCompEntities.map(toOwnerEntry),
      prov(["frontend/src/components/system/"], "intelligence"),
    ),
    realOwners: item(
      "real_owners",
      realEntities.slice(0, 250).map(toOwnerEntry),
      prov(["JOURNEY.md", "backend/src/runtime/"], "bootstrap+intelligence"),
    ),
    blDocuments: item(
      "bl_documents",
      blEntities.map(toOwnerEntry),
      prov(["BL-A.md", "BL-B.md", "BL-C.md"], "bootstrap+intelligence"),
    ),
    architectureDecisions: item(
      "architecture_decisions",
      adrEntities.map(toOwnerEntry),
      prov(["EMPIREAI_DECISIONS.md"], "bootstrap+intelligence"),
    ),
    syncState: item(
      "sync_state",
      syncState,
      prov(["JOURNEY_AUDIT.md"], "bootstrap+intelligence"),
    ),
  };

  return {
    memoryVersion: "PILLOW-005",
    status: "ready",
    initializedAt: now,
    refreshedAt: now,
    durationMs: Math.round(performance.now() - started),
    repositoryFingerprint: fingerprint,
    domains,
    consistency: evaluateConsistency(bootstrap, intelligence),
  };
}

export function buildMemoryFingerprint(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
): string {
  return [
    buildRepositoryFingerprint(bootstrap),
    intelligence.completedAt,
    String(intelligence.entities.length),
    String(intelligence.health.score),
  ].join("::");
}

export function evaluateConsistency(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
): RepositoryMemoryState["consistency"] {
  const driftSignals: string[] = [];
  const issues: string[] = [];

  if (!bootstrap.repositoryHealth.healthy) {
    driftSignals.push("bootstrap_mandatory_artifacts_incomplete");
  }
  if (intelligence.health.score < 50) {
    driftSignals.push("repository_health_score_low");
  }
  if (intelligence.health.indicators.brokenDependencyChains > 0) {
    driftSignals.push("broken_dependency_chains");
  }
  if (intelligence.health.indicators.duplicateOwnership > 0) {
    driftSignals.push("duplicate_ownership");
  }

  return {
    synchronized: driftSignals.length === 0 && issues.length === 0,
    stale: false,
    fingerprintMatch: true,
    incompleteRefresh: false,
    driftSignals,
    issues,
  };
}

export function verifyMemoryProvenance(state: RepositoryMemoryState): string[] {
  const violations: string[] = [];
  const domains = Object.values(state.domains) as MemoryItem<unknown>[];

  for (const entry of domains) {
    if (!entry.provenance.sources.length) {
      violations.push(`Missing provenance sources for domain ${entry.domain}`);
    }
  }

  return violations;
}
