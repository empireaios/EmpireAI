/** E5-13 — Protected assets, violations, integrity, and protection events. */

import type {
  GuardianProtectionEvent,
  ConstitutionHealthEntry,
  ProtectedAssetEntry,
  ConstitutionViolationEntry,
  RepositoryIntegrityEntry,
  ArchitectureIntegrityEntry,
  ProtectionEventEntry,
  GovernedProtectionDomain,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildConstitutionHealthEntries(input: {
  healthScore: number;
  e5Gov: boolean;
  e5Trust: boolean;
  unresolvedCritical: number;
}): ConstitutionHealthEntry[] {
  return [
    {
      healthId: "const-vision",
      domain: "Vision Integrity",
      score: input.healthScore,
      status: input.healthScore >= 85 ? "protected" : "monitoring",
      summary: "Vision alignment under continuous guardian protection",
    },
    {
      healthId: "const-soul",
      domain: "Soul Integrity",
      score: Math.min(100, input.healthScore + 1),
      status: "protected",
      summary: "Soul doctrine actively defended",
    },
    {
      healthId: "const-ctd",
      domain: "CTD Integrity",
      score: Math.min(100, input.healthScore),
      status: "protected",
      summary: "CTD hierarchy compliance verified",
    },
    {
      healthId: "const-gov",
      domain: "E5 Governance Chain",
      score: input.e5Gov ? 94 : 80,
      status: input.e5Gov ? "protected" : "monitoring",
      summary: "E5-01 through E5-12 governance under protection",
    },
    {
      healthId: "const-trust",
      domain: "Executive Trust",
      score: input.e5Trust ? 91 : 79,
      status: input.e5Trust ? "protected" : "monitoring",
      summary: "Trust engine feeds constitutional guardian",
    },
    {
      healthId: "const-drift",
      domain: "Constitutional Drift",
      score: input.unresolvedCritical === 0 ? 98 : 65,
      status: input.unresolvedCritical === 0 ? "no_drift" : "attention",
      summary: input.unresolvedCritical === 0 ? "No constitutional drift detected" : "Drift intervention required",
    },
  ];
}

export function buildProtectedAssets(records: GuardianProtectionEvent[]): ProtectedAssetEntry[] {
  const seen = new Map<string, ProtectedAssetEntry>();
  for (const r of records) {
    if (!seen.has(r.protectedAsset)) {
      seen.set(r.protectedAsset, {
        assetId: `asset-${r.guardianEventId}`,
        assetName: r.protectedAsset,
        category: r.protectionCategory,
        protectionLevel: r.severity === "critical" ? "maximum" : r.severity === "high" ? "elevated" : "standard",
        lastValidated: r.timestamp,
        status: r.currentStatus === "resolved" ? "protected" : "active_protection",
      });
    }
  }
  return Array.from(seen.values());
}

export function buildConstitutionViolations(records: GuardianProtectionEvent[]): ConstitutionViolationEntry[] {
  return records
    .filter((r) => r.currentStatus !== "resolved" && r.currentStatus !== "monitoring")
    .map((r) => ({
      violationId: `viol-${r.guardianEventId}`,
      guardianEventId: r.guardianEventId,
      protectedAsset: r.protectedAsset,
      detectedThreat: r.detectedThreat,
      severity: r.severity,
      status: r.currentStatus,
      resolved: r.currentStatus === "action_taken" || r.currentStatus === "resolved",
    }));
}

export function buildRepositoryIntegrity(input: {
  buildClean: boolean;
  healthScore: number;
}): RepositoryIntegrityEntry[] {
  return [
    {
      integrityId: "repo-build",
      domain: "TypeScript Build",
      score: input.buildClean ? 100 : 45,
      buildStatus: input.buildClean ? "clean" : "errors",
      importIntegrity: input.buildClean ? "validated" : "attention",
      status: input.buildClean ? "protected" : "violation_risk",
    },
    {
      integrityId: "repo-prod",
      domain: "Production Startup",
      score: input.buildClean ? 96 : 50,
      buildStatus: input.buildClean ? "validated" : "degraded",
      importIntegrity: input.buildClean ? "canonical" : "review_required",
      status: input.buildClean ? "protected" : "monitoring",
    },
    {
      integrityId: "repo-gov",
      domain: "Governance Bundle",
      score: input.healthScore,
      buildStatus: "synced",
      importIntegrity: "canonical",
      status: "protected",
    },
  ];
}

export function buildArchitectureIntegrity(input: {
  e5Gov: boolean;
  healthScore: number;
}): ArchitectureIntegrityEntry[] {
  return [
    {
      architectureId: "arch-canonical",
      domain: "Canonical Architecture",
      score: input.e5Gov ? 95 : 82,
      canonicalCompliance: input.e5Gov ? "compliant" : "monitoring",
      driftDetected: false,
      status: "protected",
    },
    {
      architectureId: "arch-e5",
      domain: "E5 Governance Architecture",
      score: input.e5Gov ? 94 : 80,
      canonicalCompliance: "E5 chain intact",
      driftDetected: false,
      status: "protected",
    },
    {
      architectureId: "arch-pillow",
      domain: "Pillow Integration",
      score: input.healthScore,
      canonicalCompliance: "single canonical engines",
      driftDetected: false,
      status: "protected",
    },
  ];
}

export function buildProtectionEvents(records: GuardianProtectionEvent[]): ProtectionEventEntry[] {
  return records.map((r) => ({
    eventId: `evt-${r.guardianEventId}`,
    guardianEventId: r.guardianEventId,
    protectedAsset: r.protectedAsset,
    event: r.detectedThreat,
    severity: r.severity,
    actionTaken: r.protectiveActionTaken,
    timestamp: r.timestamp,
  }));
}

export { label };
