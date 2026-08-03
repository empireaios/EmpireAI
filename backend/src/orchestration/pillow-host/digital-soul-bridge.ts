import {
  createDigitalSoulRuntime,
  DIGITAL_SOUL_DOCUMENT_ID,
  DIGITAL_SOUL_VERSION,
  CONSTITUTIONAL_REQUIREMENT_MATRIX,
  DIGITAL_SOUL_PRINCIPLES,
  DIGITAL_SOUL_SECTIONS,
  evaluateConstitutionalCompliance,
  runOperatingRhythmReview,
  summarizeRequirementMatrix,
} from "@empireai/pillow";
import type {
  ComplianceInput,
  OperatingRhythmCadence,
} from "@empireai/pillow";

/** Fallback Digital Soul snapshot when Pillow session is unavailable. */
export async function collectDigitalSoulSnapshot(repositoryRoot?: string) {
  if (repositoryRoot) {
    try {
      const runtime = await createDigitalSoulRuntime(repositoryRoot);
      const snapshot = await runtime.getSnapshotWithDecisionCount();
      return {
        computedAt: new Date().toISOString(),
        missionId: "DS-V2",
        live: false,
        documentId: DIGITAL_SOUL_DOCUMENT_ID,
        version: DIGITAL_SOUL_VERSION,
        snapshot,
        matrixSummary: runtime.getMatrixSummary(),
        principleCount: DIGITAL_SOUL_PRINCIPLES.length,
        sectionCount: DIGITAL_SOUL_SECTIONS.length,
        notes: ["Offline Digital Soul runtime — session not attached"],
      };
    } catch {
      // fall through to structural snapshot
    }
  }

  return {
    computedAt: new Date().toISOString(),
    missionId: "DS-V2",
    live: false,
    documentId: DIGITAL_SOUL_DOCUMENT_ID,
    version: DIGITAL_SOUL_VERSION,
    snapshot: null,
    matrixSummary: summarizeRequirementMatrix(),
    principleCount: DIGITAL_SOUL_PRINCIPLES.length,
    sectionCount: DIGITAL_SOUL_SECTIONS.length,
    matrixRequirementCount: CONSTITUTIONAL_REQUIREMENT_MATRIX.length,
    notes: ["Pillow session unavailable — structural Digital Soul snapshot only"],
  };
}

export function evaluateDigitalSoulCompliance(input: ComplianceInput = {}) {
  return {
    computedAt: new Date().toISOString(),
    missionId: "DS-V2",
    result: evaluateConstitutionalCompliance(input),
  };
}

export function runDigitalSoulRhythm(cadence: OperatingRhythmCadence = "daily") {
  return {
    computedAt: new Date().toISOString(),
    missionId: "DS-V2",
    review: runOperatingRhythmReview(cadence),
  };
}
