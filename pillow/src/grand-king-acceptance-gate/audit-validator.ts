import { isForbiddenMissionId } from "./mission-guard.js";

import { GKAGT_METADATA_VERSION } from "./paths.js";

import type { GkagtInput, GkagtValidationReport } from "./types.js";



type BoundaryInput = {

  fabricateApprovalEvidence?: boolean;

  bypassGrandKingApproval?: boolean;

  authoriseWithoutApproval?: boolean;

  overrideFailedCertifications?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ1201OrLater?: boolean;

  forceApprove?: boolean;

  forceFail?: boolean;

  missionId?: string | null;

  validated?: boolean;

};



export class GkagtValidator {

  hasBoundaryViolation(input: BoundaryInput): boolean {

    return (

      input.fabricateApprovalEvidence === true ||

      input.bypassGrandKingApproval === true ||

      input.authoriseWithoutApproval === true ||

      input.overrideFailedCertifications === true ||

      input.overridePillow === true ||

      input.overrideGrandKing === true ||

      input.implementQ1201OrLater === true ||

      input.forceApprove === true ||

      input.forceFail === true ||

      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))

    );

  }



  collectBoundaryErrors(input: BoundaryInput): string[] {

    const errors: string[] = [];

    this.pushBoundaryErrors(input, errors);

    return errors;

  }



  validateInput(input: GkagtInput, started: number): GkagtValidationReport {

    const errors: string[] = [];

    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);

    if (input.validated === false) {

      errors.push("Grand King Acceptance Gate requires validated=true when explicitly set");

    }

    if (input.grandKingApproved === false) {

      warnings.push("Grand King approval not confirmed — deployment authorisation will remain blocked");

    }

    if (input.grandKingDecision === "approve" && input.grandKingApproved !== true) {

      warnings.push("Approve decision requires explicit grandKingApproved=true — never auto-approve");

    }

    return this.finalize(

      errors.length ? "fail" : warnings.length ? "partial" : "pass",

      errors,

      warnings,

      started,

    );

  }



  finalize(

    decision: GkagtValidationReport["decision"],

    errors: string[],

    warnings: string[],

    started: number,

  ): GkagtValidationReport {

    return {

      validationReportId: `gkagt-val-${Date.now()}`,

      validationTimestamp: new Date().toISOString(),

      decision,

      errors,

      warnings,

      durationMs: Date.now() - started,

      metadataVersion: GKAGT_METADATA_VERSION,

    };

  }



  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {

    if (input.fabricateApprovalEvidence === true) {

      errors.push("Grand King Acceptance Gate must never fabricate approval evidence");

    }

    if (input.bypassGrandKingApproval === true) {

      errors.push("Grand King Acceptance Gate must never bypass Grand King approval");

    }

    if (input.authoriseWithoutApproval === true) {

      errors.push("Grand King Acceptance Gate must never authorise deployment without approval");

    }

    if (input.overrideFailedCertifications === true) {

      errors.push("Grand King Acceptance Gate must never override failed certifications");

    }

    if (input.overridePillow === true) {

      errors.push("Grand King Acceptance Gate must never override Pillow");

    }

    if (input.overrideGrandKing === true) {

      errors.push("Grand King Acceptance Gate must never override Grand King");

    }

    if (input.implementQ1201OrLater === true) {

      errors.push("Grand King Acceptance Gate must never implement Q12-01 or later");

    }

    if (input.forceApprove === true) {

      errors.push("Grand King Acceptance Gate rejects forceApprove — explicit Grand King decision required");

    }

    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {

      errors.push(`Grand King Acceptance Gate rejects forbidden missionId ${input.missionId}`);

    }

  }

}



export class HealthMonitor {

  status(

    decision: "pass" | "partial" | "fail",

    enabled: boolean,

  ): "healthy" | "degraded" | "failed" | "standby" {

    if (!enabled) return "standby";

    if (decision === "fail") return "failed";

    if (decision === "partial") return "degraded";

    return "healthy";

  }

}



export class GateManager {

  private failures = 0;



  recordFailure() {

    this.failures += 1;

  }



  reset() {

    this.failures = 0;

  }



  failureCount() {

    return this.failures;

  }

}

