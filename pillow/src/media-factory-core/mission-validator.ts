import { MFC_METADATA_VERSION } from "./paths.js";
import type {
  MediaBusinessMission,
  MediaFactoryCoreInput,
  MediaFactoryCoreValidationReport,
  MediaFactoryReport,
} from "./types.js";

type BoundaryInput = {
  writeScripts?: boolean;
  generateImages?: boolean;
  generateVideos?: boolean;
  publishDirectly?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ402OrLater?: boolean;
  validated?: boolean;
};

export class MissionValidator {
  decide(input: MediaFactoryCoreInput): MediaFactoryCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateMissions(
    missions: MediaBusinessMission[] | null,
    input: MediaFactoryCoreInput,
    started: number,
    options: { requireActiveMission?: boolean } = {},
  ): MediaFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Media Factory Core requires validated=true");
    }

    if (!missions || missions.length === 0) {
      if (decision !== "fail") {
        warnings.push("No media business missions were produced yet");
      }
    } else {
      for (const mission of missions) {
        if (!mission.mediaMissionId) errors.push("Missing media mission ID");
        if (!mission.timestamp) errors.push("Missing timestamp");
        if (!mission.mediaBusinessId) errors.push("Missing media business ID");
        if (!mission.missionObjective?.trim()) errors.push("Missing mission objective");
        if (!mission.metadataVersion) errors.push("Missing metadata version");

        if (mission.currentStatus === "rejected" && options.requireActiveMission) {
          errors.push(`Media mission ${mission.mediaMissionId} is rejected`);
        }
        if (!mission.neverPublishDirectly) {
          errors.push("Media Factory Core must never publish directly");
        }
        if (!mission.neverWriteScripts) {
          errors.push("Media Factory Core must never write scripts");
        }
        if (!mission.neverImplementQ402OrLater) {
          errors.push("Media Factory Core must never implement Q4-02 or later");
        }
        if (!mission.traceabilityRefs.some((r) => r.includes("q4-01"))) {
          warnings.push(`Mission ${mission.mediaMissionId} missing Q4-01 traceability`);
        }
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  validateReport(
    report: MediaFactoryReport | null,
    input: MediaFactoryCoreInput,
    started: number,
  ): MediaFactoryCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Media Factory Core requires validated=true");
    }

    if (!report) {
      errors.push("No Media Factory Report was produced");
    } else {
      const required: Array<keyof MediaFactoryReport> = [
        "mediaMissionId",
        "timestamp",
        "mediaBusinessId",
        "channelType",
        "contentPipeline",
        "currentStage",
        "assignedWorkers",
        "approvalStatus",
        "publishingStatus",
        "learningStatus",
        "executiveSummary",
        "metadataVersion",
        "productionStatus",
        "assignedWorkerRoles",
        "traceabilityRefs",
        "preservedDecisions",
        "workerId",
      ];
      for (const field of required) {
        const value = report[field];
        if (value === undefined || value === null || value === "") {
          errors.push(`Media Factory Report missing required field: ${String(field)}`);
        }
      }
      if (!report.neverPublishDirectly) {
        errors.push("Media Factory Report must enforce neverPublishDirectly boundary");
      }
      if (!report.neverBypassApproval) {
        errors.push("Media Factory Report must enforce neverBypassApproval boundary");
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.writeScripts === true ||
      input.generateImages === true ||
      input.generateVideos === true ||
      input.publishDirectly === true ||
      input.bypassApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ402OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.writeScripts === true) {
      errors.push("Media Factory Core must never write scripts");
    }
    if (input.generateImages === true) {
      errors.push("Media Factory Core must never generate images");
    }
    if (input.generateVideos === true) {
      errors.push("Media Factory Core must never generate videos");
    }
    if (input.publishDirectly === true) {
      errors.push("Media Factory Core must never publish directly");
    }
    if (input.bypassApproval === true) {
      errors.push("Media Factory Core must never bypass approval");
    }
    if (input.overridePillow === true) {
      errors.push("Media Factory Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Media Factory Core must never override Grand King");
    }
    if (input.implementQ402OrLater === true) {
      errors.push("Media Factory Core must never implement Q4-02 or later");
    }
  }

  finalize(
    decision: MediaFactoryCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MediaFactoryCoreValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `mfc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MFC_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(
    decision: MediaFactoryCoreValidationReport["decision"] | null,
    enabled: boolean,
  ) {
    if (!enabled) return "standby" as const;
    if (decision === "fail" || decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
