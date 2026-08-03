import { ECW_METADATA_VERSION } from "./paths.js";

import type {

  EditorialReport,

  EditorInChiefWorkerInput,

  EditorInChiefWorkerValidationReport,

} from "./types.js";



type BoundaryInput = {

  writeScripts?: boolean;

  createThumbnails?: boolean;

  assembleVideos?: boolean;

  publishContent?: boolean;

  bypassPillowGovernance?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ403OrLater?: boolean;

  validated?: boolean;

  pillowGovernanceConfirmed?: boolean;

};



export class EditorialValidator {

  decide(

    input: EditorInChiefWorkerInput,

  ): EditorInChiefWorkerValidationReport["decision"] {

    if (this.hasBoundaryViolation(input)) return "fail";

    if (input.validated === false) return "fail";

    return "pass";

  }



  validateReports(

    reports: EditorialReport[] | null,

    input: EditorInChiefWorkerInput,

    started: number,

  ): EditorInChiefWorkerValidationReport {

    const decision = this.decide(input);

    const errors: string[] = [];

    const warnings: string[] = [];



    this.pushBoundaryErrors(input, errors);

    if (input.validated === false) {

      errors.push("Editor-in-Chief Worker requires validated=true");

    }



    if (!reports || reports.length === 0) {

      if (decision !== "fail") {

        warnings.push("No editorial reports were produced yet");

      }

    } else {

      for (const report of reports) {

        if (!report.editorialReportId) errors.push("Missing editorial report ID");

        if (!report.timestamp) errors.push("Missing timestamp");

        if (!report.mediaBusinessId) errors.push("Missing media business ID");

        if (!report.channelId) errors.push("Missing channel ID");

        if (!report.editorialStrategy) errors.push("Missing editorial strategy");

        if (!report.targetAudience) errors.push("Missing target audience");

        if (!report.editorialTone) errors.push("Missing editorial tone");

        if (!report.qualityStandards?.length) errors.push("Missing quality standards");

        if (!report.contentPriorities?.length) errors.push("Missing content priorities");

        if (!report.reviewOutcome) errors.push("Missing review outcome");

        if (!report.executiveRecommendations?.length) {

          errors.push("Missing executive recommendations");

        }

        if (!report.metadataVersion) errors.push("Missing metadata version");

        if (!report.neverWriteScripts) {

          errors.push("Editor-in-Chief Worker must never write scripts");

        }

        if (!report.neverCreateThumbnails) {

          errors.push("Editor-in-Chief Worker must never create thumbnails");

        }

        if (!report.neverAssembleVideos) {

          errors.push("Editor-in-Chief Worker must never assemble videos");

        }

        if (!report.neverPublishContent) {

          errors.push("Editor-in-Chief Worker must never publish content");

        }

        if (!report.neverBypassPillowGovernance) {

          errors.push("Editor-in-Chief Worker must never bypass Pillow governance");

        }

        if (!report.neverOverridePillow) {

          errors.push("Editor-in-Chief Worker must never override Pillow");

        }

        if (!report.neverOverrideGrandKing) {

          errors.push("Editor-in-Chief Worker must never override Grand King");

        }

        if (!report.neverImplementQ403OrLater) {

          errors.push("Editor-in-Chief Worker must never implement Q4-03 or later");

        }

        if (report.reviewOutcome === "revise") {

          warnings.push(

            `Report ${report.editorialReportId} requires revision — downstream workers should adjust`,

          );

        }

        if (report.brandConsistencyStatus === "inconsistent") {

          warnings.push(

            `Report ${report.editorialReportId} has brand consistency drift — review recommended`,

          );

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



  validateApproval(input: EditorInChiefWorkerInput): string[] {

    const errors: string[] = [];

    if (input.bypassPillowGovernance === true) {

      errors.push("Editor-in-Chief Worker must never bypass Pillow governance");

    }

    if (input.overridePillow === true) {

      errors.push("Editor-in-Chief Worker must never override Pillow");

    }

    if (input.overrideGrandKing === true) {

      errors.push("Editor-in-Chief Worker must never override Grand King");

    }

    if (input.pillowGovernanceConfirmed !== true) {

      errors.push("Editorial approval requires pillowGovernanceConfirmed=true");

    }

    return errors;

  }



  private hasBoundaryViolation(input: BoundaryInput): boolean {

    return (

      input.writeScripts === true ||

      input.createThumbnails === true ||

      input.assembleVideos === true ||

      input.publishContent === true ||

      input.bypassPillowGovernance === true ||

      input.overridePillow === true ||

      input.overrideGrandKing === true ||

      input.implementQ403OrLater === true

    );

  }



  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {

    if (input.writeScripts === true) {

      errors.push("Editor-in-Chief Worker must never write scripts");

    }

    if (input.createThumbnails === true) {

      errors.push("Editor-in-Chief Worker must never create thumbnails");

    }

    if (input.assembleVideos === true) {

      errors.push("Editor-in-Chief Worker must never assemble videos");

    }

    if (input.publishContent === true) {

      errors.push("Editor-in-Chief Worker must never publish content");

    }

    if (input.bypassPillowGovernance === true) {

      errors.push("Editor-in-Chief Worker must never bypass Pillow governance");

    }

    if (input.overridePillow === true) {

      errors.push("Editor-in-Chief Worker must never override Pillow");

    }

    if (input.overrideGrandKing === true) {

      errors.push("Editor-in-Chief Worker must never override Grand King");

    }

    if (input.implementQ403OrLater === true) {

      errors.push("Editor-in-Chief Worker must never implement Q4-03 or later");

    }

  }



  finalize(

    decision: EditorInChiefWorkerValidationReport["decision"],

    errors: string[],

    warnings: string[],

    started: number,

  ): EditorInChiefWorkerValidationReport {

    const finalDecision =

      errors.length || decision === "fail"

        ? "fail"

        : warnings.length || decision === "partial"

          ? "partial"

          : "pass";

    return {

      validationReportId: `ecw-val-${Date.now()}`,

      validationTimestamp: new Date().toISOString(),

      decision: finalDecision,

      errors,

      warnings,

      durationMs: Date.now() - started,

      metadataVersion: ECW_METADATA_VERSION,

    };

  }

}



export class HealthMonitor {

  status(

    decision: EditorInChiefWorkerValidationReport["decision"] | null,

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


