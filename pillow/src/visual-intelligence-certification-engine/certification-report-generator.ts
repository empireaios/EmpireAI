/** T5-10 — Certification report generation and persistence. */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { appendCertificationLog } from "./certification-logging.js";
import { CertificationMetadataGenerator, buildCertificationId } from "./certification-metadata-generator.js";
import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import type {
  CertificationDecision,
  CertificationStatus,
  E2eValidationResult,
  GovernanceComplianceResult,
  MissionValidationResult,
  PerformanceSummary,
  ProductionReadinessResult,
  ProgrammeValidationResult,
  RecoveryVerificationResult,
  VisualIntelligenceCertificationReport,
} from "./types.js";

export class CertificationReportGenerator {
  private readonly metadataGenerator = new CertificationMetadataGenerator();

  generate(input: {
    repositoryRoot: string;
    config: VisualIntelligenceCertificationConfiguration;
    programmeResults: ProgrammeValidationResult[];
    t5MissionResults: MissionValidationResult[];
    e2eResult: E2eValidationResult;
    productionReadiness: ProductionReadinessResult;
    governance: GovernanceComplianceResult;
    recoveryResults: RecoveryVerificationResult[];
    status: CertificationStatus;
    decision: CertificationDecision;
  }): VisualIntelligenceCertificationReport {
    const capabilitySummary = this.metadataGenerator.buildCapabilitySummary(
      input.programmeResults,
      input.t5MissionResults,
    );
    const confidenceScore = this.metadataGenerator.buildConfidenceScore(
      capabilitySummary,
      input.governance,
    );

    const detectedWarnings = [
      ...input.programmeResults.flatMap((p) => p.warnings),
      ...input.t5MissionResults.flatMap((m) => m.warnings),
      ...input.productionReadiness.warnings,
      ...input.governance.warnings,
    ];
    const detectedFailures = [
      ...input.programmeResults.flatMap((p) => p.errors),
      ...input.t5MissionResults.flatMap((m) => m.errors),
      ...input.productionReadiness.errors,
      ...input.governance.errors,
      ...(input.e2eResult.passed ? [] : [input.e2eResult.summary]),
    ];

    const evidenceReferences = [
      ...input.programmeResults.flatMap((p) => p.evidenceReferences),
      ...input.t5MissionResults.flatMap((m) => m.evidenceReferences),
    ];

    const totalProgrammeDuration = input.programmeResults.reduce((s, p) => s + p.durationMs, 0);
    const performance: PerformanceSummary = {
      totalDurationMs: totalProgrammeDuration + input.e2eResult.durationMs,
      programmesValidated: input.programmeResults.length,
      programmesPassed: input.programmeResults.filter((p) => p.passed).length,
      t5MissionsValidated: input.t5MissionResults.length,
      t5MissionsPassed: input.t5MissionResults.filter((m) => m.passed).length,
      averageProgrammeDurationMs:
        input.programmeResults.length > 0
          ? Math.round(totalProgrammeDuration / input.programmeResults.length)
          : 0,
      endToEndDurationMs: input.e2eResult.durationMs,
    };

    const report: VisualIntelligenceCertificationReport = {
      certificationId: buildCertificationId(),
      timestamp: new Date().toISOString(),
      certificationVersion: "1.0.0",
      certifiedProgrammes: input.programmeResults.map((p) => p.programmeId),
      certifiedMissions: input.t5MissionResults.map((m) => m.missionId),
      programmeResults: input.programmeResults,
      t5MissionResults: input.t5MissionResults,
      endToEndValidationResult: input.e2eResult,
      productionReadinessResult: input.productionReadiness,
      governanceComplianceResult: input.governance,
      capabilityValidationSummary: capabilitySummary,
      detectedWarnings,
      detectedFailures,
      recoveryVerificationResults: input.recoveryResults,
      overallCertificationStatus: input.status,
      evidenceReferences,
      confidenceScore,
      metadataVersion: this.metadataGenerator.getMetadataVersion(),
      finalCertificationDecision: input.decision,
      reportOutputPath: null,
    };

    if (input.config.reportGenerationRulesEnabled) {
      report.reportOutputPath = this.persist(input.repositoryRoot, input.config, report);
    }

    appendCertificationLog({
      event: "report_generation",
      level: "info",
      details: `Report ${report.certificationId} · decision=${report.finalCertificationDecision} · confidence=${report.confidenceScore}`,
    });

    return report;
  }

  private persist(
    repositoryRoot: string,
    config: VisualIntelligenceCertificationConfiguration,
    report: VisualIntelligenceCertificationReport,
  ): string {
    const dir = join(repositoryRoot, config.reportOutputRoot);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "latest-visual-intelligence-certification-report.json");
    writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
    return path;
  }
}
