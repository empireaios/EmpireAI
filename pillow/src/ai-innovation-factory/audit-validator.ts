import { isForbiddenMissionId } from "./mission-guard.js";

import { AIFRT_METADATA_VERSION } from "./paths.js";

import type { AifrtInput, AifrtValidationReport } from "./types.js";



type BoundaryInput = {

  fabricateResearchEvidence?: boolean;

  autoDeployInnovations?: boolean;

  bypassGovernance?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ1301OrLater?: boolean;

  claimQSeriesComplete?: boolean;

  forceApprove?: boolean;

  missionId?: string | null;

  validated?: boolean;

};



export class AifrtValidator {

  hasBoundaryViolation(input: BoundaryInput): boolean {

    return (

      input.fabricateResearchEvidence === true ||

      input.autoDeployInnovations === true ||

      input.bypassGovernance === true ||

      input.overridePillow === true ||

      input.overrideGrandKing === true ||

      input.implementQ1301OrLater === true ||

      input.claimQSeriesComplete === true ||

      input.forceApprove === true ||

      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))

    );

  }



  collectBoundaryErrors(input: BoundaryInput): string[] {

    const errors: string[] = [];

    this.pushBoundaryErrors(input, errors);

    return errors;

  }



  validateInput(input: AifrtInput, started: number): AifrtValidationReport {

    const errors: string[] = [];

    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);

    if (input.validated === false) {

      errors.push("AI Innovation Factory requires validated=true when explicitly set");

    }

    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);

  }



  finalize(

    decision: "pass" | "partial" | "fail",

    errors: string[],

    warnings: string[],

    started: number,

  ): AifrtValidationReport {

    return {

      validationReportId: `aifrt-val-${Date.now()}`,

      validationTimestamp: new Date().toISOString(),

      decision,

      errors: [...errors],

      warnings: [...warnings],

      durationMs: Math.max(1, Date.now() - started),

      metadataVersion: AIFRT_METADATA_VERSION,

    };

  }



  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {

    if (input.fabricateResearchEvidence) errors.push("neverFabricateResearchEvidence boundary violated");

    if (input.autoDeployInnovations) errors.push("neverAutoDeployInnovations boundary violated");

    if (input.bypassGovernance) errors.push("neverBypassGovernance boundary violated");

    if (input.overridePillow) errors.push("neverOverridePillow boundary violated");

    if (input.overrideGrandKing) errors.push("neverOverrideGrandKing boundary violated");

    if (input.implementQ1301OrLater) errors.push("neverImplementQ1301OrLater boundary violated");

    if (input.claimQSeriesComplete) errors.push("neverClaimQSeriesCompleteWhenIncomplete boundary violated");

    if (input.forceApprove) errors.push("forceApprove forbidden — approval only via explicit grandKingApproved input");

    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {

      errors.push(`forbidden missionId ${input.missionId.trim()} — Q12-01 never implements Q12-02+ or Q13+`);

    }

  }

}



export class HealthMonitor {

  private failureCount = 0;



  recordFailure() {

    this.failureCount += 1;

  }



  getFailureCount() {

    return this.failureCount;

  }



  resetForTesting() {

    this.failureCount = 0;

  }

}



export class GateManager {

  private failures = 0;



  recordFailure() {

    this.failures += 1;

  }



  resetForTesting() {

    this.failures = 0;

  }



  failureCount() {

    return this.failures;

  }

}


