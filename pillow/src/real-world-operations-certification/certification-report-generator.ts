/** R5-20 — Certification Report Generator. */

import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  ProgrammeValidationResult,
  RealWorldOperationsCertificationReport,
} from "./types.js";

function statusFromResult(result: ProgrammeValidationResult | undefined): CertificationStatus {
  if (!result) return "pending";
  return result.certificationStatus;
}

function deriveOverallStatus(
  programmes: ProgrammeValidationResult[],
  endToEnd: "pass" | "partial" | "fail",
  integration: "pass" | "partial" | "fail",
  readinessScore: number,
  config: RealWorldOperationsCertificationConfiguration,
): CertificationStatus {
  if (programmes.length === 0) return "failed";
  const passed = programmes.filter((p) => p.status === "pass").length;
  const passPercent = Math.round((passed / programmes.length) * 100);
  const hasFail = programmes.some((p) => p.status === "fail");
  const hasPartial = programmes.some((p) => p.status === "partial");

  if (hasFail || endToEnd === "fail" || integration === "fail") return "failed";
  if (
    passPercent >= config.passThresholdPercent &&
    readinessScore >= config.operationalReadinessThreshold &&
    endToEnd === "pass" &&
    integration === "pass" &&
    !hasPartial
  ) {
    return "certified";
  }
  if (passPercent >= Math.floor(config.passThresholdPercent * 0.7)) return "partial";
  return "failed";
}

export class CertificationReportGenerator {
  private readonly metadataGenerator = new CertificationMetadataGenerator();

  generate(input: {
    programmeResults: ProgrammeValidationResult[];
    endToEndWorkflowResult: "pass" | "partial" | "fail";
    crossProgrammeIntegrationResult: "pass" | "partial" | "fail";
    operationalReadinessScore: number;
    autonomousOperationalReadiness: boolean;
    validation: CertificationValidationReport;
    recoveryStatus: string;
    config: RealWorldOperationsCertificationConfiguration;
    durationMs: number;
    extraWarnings?: string[];
    extraErrors?: string[];
    extraEvidence?: string[];
  }): RealWorldOperationsCertificationReport {
    const byId = new Map(input.programmeResults.map((r) => [r.programmeId, r]));
    const marketplace = byId.get("R1");
    const supplier = byId.get("R2");
    const financial = byId.get("R3");
    const customer = byId.get("R4");
    const marketing = byId.get("R5");

    const errors = [
      ...input.programmeResults.flatMap((p) => p.errors.map((e) => `${p.programmeId}: ${e}`)),
      ...input.validation.errors,
      ...(input.extraErrors ?? []),
    ];
    const warnings = [
      ...input.programmeResults.flatMap((p) => p.warnings.map((w) => `${p.programmeId}: ${w}`)),
      ...input.validation.warnings,
      ...(input.extraWarnings ?? []),
    ];
    const evidenceReferences = [
      ...input.programmeResults.flatMap((p) => p.evidenceReferences),
      ...(input.extraEvidence ?? []),
    ];

    return this.metadataGenerator.buildCertificationReport({
      marketplaceCertificationStatus: statusFromResult(marketplace),
      supplierCertificationStatus: statusFromResult(supplier),
      fulfilmentCertificationStatus: statusFromResult(supplier),
      financialCertificationStatus: statusFromResult(financial),
      customerCertificationStatus: statusFromResult(customer),
      marketingCertificationStatus: statusFromResult(marketing),
      endToEndWorkflowResult: input.endToEndWorkflowResult,
      crossProgrammeIntegrationResult: input.crossProgrammeIntegrationResult,
      operationalReadinessScore: input.operationalReadinessScore,
      autonomousOperationalReadiness: input.autonomousOperationalReadiness,
      programmeResults: input.programmeResults,
      warnings,
      errors,
      overallCertificationStatus: deriveOverallStatus(
        input.programmeResults,
        input.endToEndWorkflowResult,
        input.crossProgrammeIntegrationResult,
        input.operationalReadinessScore,
        input.config,
      ),
      evidenceReferences,
      recoveryStatus: input.recoveryStatus,
      validation: input.validation,
      durationMs: input.durationMs,
    });
  }
}
