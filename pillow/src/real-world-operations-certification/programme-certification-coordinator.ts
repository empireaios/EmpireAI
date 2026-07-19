/** R5-20 — Programme Certification Coordinator. */

import { appendRwocLog } from "./rwoc-logging.js";
import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";
import type {
  ProgrammeCertificationProbe,
  RealWorldOperationsCertificationContext,
} from "./real-world-operations-certification-context.js";
import type { CertificationStatus, ProgrammeValidationResult } from "./types.js";

function safeProbe(engine: ProgrammeCertificationProbe | null): {
  present: boolean;
  status: CertificationStatus;
  evidence: string[];
  errors: string[];
  warnings: string[];
} {
  if (!engine) {
    return {
      present: false,
      status: "failed",
      evidence: [],
      errors: ["Programme certification module missing"],
      warnings: [],
    };
  }

  try {
    const state = engine.getState();
    const report =
      engine.getLatestReport?.() ??
      state.latestReport ??
      null;
    const overall = (report?.overallCertificationStatus ?? "pending") as CertificationStatus;
    const evidence: string[] = [];
    if (report?.certificationId) evidence.push(report.certificationId);
    if (state.missionId) evidence.push(`state:${state.missionId}`);

    const errors: string[] = [];
    const warnings: string[] = [];
    if (state.health?.status === "failed") {
      errors.push("Programme certification health failed");
    } else if (state.health?.status === "degraded") {
      warnings.push("Programme certification health degraded");
    }
    if (overall === "failed" || overall === "pending") {
      if (!report) {
        warnings.push("No prior programme certification report — structural presence accepted");
      } else if (overall === "failed") {
        errors.push("Latest programme certification status is failed");
      }
    }

    // Structural readiness: engine present and state readable counts as pass unless explicitly failed.
    let status: CertificationStatus = "certified";
    if (errors.length > 0) status = "failed";
    else if (warnings.length > 0 || overall === "partial") status = "partial";
    else if (overall === "certified" || !report) status = "certified";

    return { present: true, status, evidence, errors, warnings };
  } catch (error) {
    return {
      present: true,
      status: "failed",
      evidence: [],
      errors: [error instanceof Error ? error.message : "Programme probe failed"],
      warnings: [],
    };
  }
}

function toResult(
  programmeId: string,
  programmeLabel: string,
  probe: ReturnType<typeof safeProbe>,
  durationMs: number,
): ProgrammeValidationResult {
  const status =
    probe.status === "certified" ? "pass" : probe.status === "partial" ? "partial" : "fail";
  return {
    programmeId,
    programmeLabel,
    status,
    certificationStatus: probe.status,
    errors: probe.errors,
    warnings: probe.warnings,
    evidenceReferences: probe.evidence,
    durationMs,
  };
}

export class ProgrammeCertificationCoordinator {
  validateMarketplace(
    ctx: RealWorldOperationsCertificationContext,
    _config: RealWorldOperationsCertificationConfiguration,
  ): ProgrammeValidationResult {
    const started = Date.now();
    const probe = safeProbe(ctx.marketplaceCertification);
    appendRwocLog({
      event: "programme_validation",
      level: probe.status === "failed" ? "warn" : "info",
      details: `Marketplace programme validation · ${probe.status}`,
    });
    return toResult("R1", "Marketplace Integration", probe, Date.now() - started);
  }

  validateSupplier(
    ctx: RealWorldOperationsCertificationContext,
    _config: RealWorldOperationsCertificationConfiguration,
  ): ProgrammeValidationResult {
    const started = Date.now();
    const probe = safeProbe(ctx.supplierOperationsCertification);
    appendRwocLog({
      event: "programme_validation",
      level: probe.status === "failed" ? "warn" : "info",
      details: `Supplier & Fulfilment programme validation · ${probe.status}`,
    });
    return toResult("R2", "Supplier & Fulfilment", probe, Date.now() - started);
  }

  validateFinancial(
    ctx: RealWorldOperationsCertificationContext,
    _config: RealWorldOperationsCertificationConfiguration,
  ): ProgrammeValidationResult {
    const started = Date.now();
    const probe = safeProbe(ctx.financialOperationsCertification);
    appendRwocLog({
      event: "programme_validation",
      level: probe.status === "failed" ? "warn" : "info",
      details: `Financial programme validation · ${probe.status}`,
    });
    return toResult("R3", "Financial Infrastructure", probe, Date.now() - started);
  }

  validateCustomer(
    ctx: RealWorldOperationsCertificationContext,
    _config: RealWorldOperationsCertificationConfiguration,
  ): ProgrammeValidationResult {
    const started = Date.now();
    const probe = safeProbe(ctx.customerOperationsCertification);
    appendRwocLog({
      event: "programme_validation",
      level: probe.status === "failed" ? "warn" : "info",
      details: `Customer programme validation · ${probe.status}`,
    });
    return toResult("R4", "Customer Operations", probe, Date.now() - started);
  }

  validateMarketing(
    ctx: RealWorldOperationsCertificationContext,
    _config: RealWorldOperationsCertificationConfiguration,
  ): ProgrammeValidationResult {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const evidence: string[] = [];

    const engines = [
      ["marketingFramework", ctx.marketingFramework],
      ["campaignManager", ctx.campaignManager],
      ["crossChannelOrchestrator", ctx.crossChannelOrchestrator],
      ["autonomousMarketingEngine", ctx.autonomousMarketingEngine],
    ] as const;

    let present = 0;
    for (const [name, engine] of engines) {
      if (!engine) {
        errors.push(`Marketing dependency missing: ${name}`);
        continue;
      }
      try {
        engine.getState();
        present += 1;
        evidence.push(`marketing:${name}`);
      } catch (error) {
        errors.push(
          `${name}: ${error instanceof Error ? error.message : "state probe failed"}`,
        );
      }
    }

    let certificationStatus: CertificationStatus = "certified";
    if (present === 0) certificationStatus = "failed";
    else if (errors.length > 0) certificationStatus = "partial";

    appendRwocLog({
      event: "programme_validation",
      level: certificationStatus === "failed" ? "warn" : "info",
      details: `Marketing programme validation · ${certificationStatus} · present=${present}`,
    });

    return {
      programmeId: "R5",
      programmeLabel: "Marketing Operations",
      status:
        certificationStatus === "certified"
          ? "pass"
          : certificationStatus === "partial"
            ? "partial"
            : "fail",
      certificationStatus,
      errors,
      warnings,
      evidenceReferences: evidence,
      durationMs: Date.now() - started,
    };
  }
}
