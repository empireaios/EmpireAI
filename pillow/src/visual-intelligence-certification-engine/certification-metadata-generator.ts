/** T5-10 — Certification metadata generator. */

import { CERTIFICATION_REPORT_VERSION } from "./paths.js";
import type {
  CapabilityValidationSummary,
  CertificationCategory,
  GovernanceComplianceResult,
  MissionValidationResult,
  ProgrammeValidationResult,
} from "./types.js";

export function buildCertificationId(): string {
  return `vic-report-${Date.now()}`;
}

export class CertificationMetadataGenerator {
  buildCapabilitySummary(
    programmeResults: ProgrammeValidationResult[],
    t5MissionResults: MissionValidationResult[],
  ): CapabilityValidationSummary {
    const programmesPassed = programmeResults.filter((p) => p.passed).length;
    const t5Passed = t5MissionResults.filter((m) => m.passed).length;
    const scores = [
      ...programmeResults.map((p) => p.readinessScore),
      ...t5MissionResults.map((m) => m.readinessScore),
    ];
    const averageReadinessScore =
      scores.length > 0
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : 0;

    const categories: CertificationCategory[] = [
      "visual_foundation_certification",
      "ux_intelligence_certification",
      "autonomous_builder_certification",
      "executive_collaboration_certification",
      "autonomous_evolution_certification",
      "governance_certification",
      "validation_certification",
      "recovery_certification",
      "continuous_learning_certification",
      "end_to_end_visual_intelligence_certification",
    ];

    return {
      programmesValidated: programmeResults.length,
      programmesPassed,
      t5MissionsValidated: t5MissionResults.length,
      t5MissionsPassed: t5Passed,
      categoriesCovered: categories,
      averageReadinessScore,
    };
  }

  buildConfidenceScore(
    summary: CapabilityValidationSummary,
    governance: GovernanceComplianceResult,
  ): number {
    let score = summary.averageReadinessScore;
    if (governance.passed) score = Math.min(100, score + 5);
    if (governance.grandKingAuthorityPreserved) score = Math.min(100, score + 3);
    if (!governance.learnOnlyModeVerified) score = Math.max(0, score - 20);
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  getMetadataVersion(): string {
    return CERTIFICATION_REPORT_VERSION;
  }
}
