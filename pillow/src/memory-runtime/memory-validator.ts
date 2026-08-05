import { MEMRT_METADATA_VERSION } from "./paths.js";
import type { MemrtInput, MemrtValidationReport } from "./types.js";

const FORBIDDEN_MISSION_ID = /^(Q10-0[6-9]|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

export class MemoryValidator {
  decide(input: MemrtInput): MemrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateMemory === true) return "fail";
    if (input.governanceClassification === "grand_king_only" && input.grandKingApproved !== true) {
      return "fail";
    }
    if (input.highRisk === true && input.grandKingApproved !== true) return "fail";
    return "pass";
  }

  validateInput(input: MemrtInput, started: number): MemrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Memory Runtime requires validated=true");
    if (input.fabricateMemory === true) errors.push("fabricated memory is rejected");
    if (input.governanceClassification === "grand_king_only" && input.grandKingApproved !== true) {
      errors.push("grand_king_only memory requires grandKingApproved=true");
    }
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("High-risk memory operations require grandKingApproved=true");
    }
    if (!input.contentRef && !input.memoryId && !input.query) {
      warnings.push("No contentRef, memoryId, or query provided");
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

  validateStore(input: MemrtInput, started: number): MemrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    if (!input.contentRef) {
      return this.finalize("fail", [...base.errors, "contentRef required for store operations"], base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: MemrtInput): boolean {
    return (
      input.replaceEkls === true ||
      input.replaceApplicationDatabases === true ||
      input.modifyHistoricalRecords === true ||
      input.fabricateMemory === true ||
      input.silentlyOverwriteHistoricalDecisions === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1006OrLater === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.governanceClassification === "grand_king_only" &&
        input.grandKingApproved !== true &&
        input.validated !== false)
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Memory Runtime stops at Q10-05`);
    }
  }

  private pushBoundaryErrors(input: MemrtInput, errors: string[]) {
    if (input.replaceEkls) errors.push("Memory Runtime must never replace EKLS");
    if (input.replaceApplicationDatabases) {
      errors.push("Memory Runtime must never replace application databases");
    }
    if (input.modifyHistoricalRecords) {
      errors.push("Memory Runtime must never modify historical records");
    }
    if (input.fabricateMemory) errors.push("Memory Runtime must never fabricate memory");
    if (input.silentlyOverwriteHistoricalDecisions) {
      errors.push("Memory Runtime must never silently overwrite historical decisions");
    }
    if (input.bypassPillowGovernance) errors.push("Memory Runtime must never bypass Pillow governance");
    if (input.bypassGrandKingApproval) {
      errors.push("Memory Runtime must never bypass Grand King approval");
    }
    if (input.overridePillow) errors.push("Memory Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Memory Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Memory Runtime must never override approved architecture");
    }
    if (input.implementQ1006OrLater) {
      errors.push("Memory Runtime must never implement Q10-06 or later");
    }
    this.rejectMissionId(input.targetMissionId, errors);
  }

  private finalize(
    decision: MemrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MemrtValidationReport {
    return {
      validationReportId: `memrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MEMRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID };
