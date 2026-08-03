import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  evaluateConstitutionalCompliance,
  type ComplianceInput,
} from "./compliance.js";
import {
  listExecutiveDecisionRecords,
  recordExecutiveDecision,
  type RecordDecisionInput,
} from "./decision-record.js";
import {
  describeOperatingRhythmDoctrine,
  runOperatingRhythmReview,
} from "./operating-rhythm.js";
import { DIGITAL_SOUL_CONSTITUTION_PATH } from "./paths.js";
import { DIGITAL_SOUL_PRINCIPLES, DIGITAL_SOUL_SECTIONS } from "./principles.js";
import { buildDigitalSoulPromptBlock, buildDigitalSoulReasoningNotes } from "./prompt.js";
import {
  CONSTITUTIONAL_REQUIREMENT_MATRIX,
  summarizeRequirementMatrix,
} from "./requirement-matrix.js";
import type {
  DigitalSoulRuntimeSnapshot,
  OperatingRhythmCadence,
} from "./types.js";
import {
  DIGITAL_SOUL_DOCUMENT_ID,
  DIGITAL_SOUL_VERSION,
  FINAL_EXECUTIVE_QUESTION,
  LONG_TERM_EMPIRE_VALUE,
  PERMANENT_DUTY,
  PERMANENT_EXECUTIVE_QUESTION,
} from "./version.js";

async function fileExists(absolutePath: string): Promise<boolean> {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export class DigitalSoulRuntime {
  private readonly repositoryRoot: string;
  private constitutionPresent = false;
  private constitutionExcerpt: string | null = null;
  private loadedAt: string | null = null;
  private limitations: string[] = [];

  constructor(repositoryRoot: string) {
    this.repositoryRoot = repositoryRoot;
  }

  async initialize(): Promise<DigitalSoulRuntimeSnapshot> {
    const constitutionAbs = path.join(
      this.repositoryRoot,
      DIGITAL_SOUL_CONSTITUTION_PATH,
    );
    this.constitutionPresent = await fileExists(constitutionAbs);
    this.limitations = [];

    if (!this.constitutionPresent) {
      this.limitations.push(
        `Canonical constitution missing at ${DIGITAL_SOUL_CONSTITUTION_PATH} — runtime principles remain active; document must be restored.`,
      );
      this.constitutionExcerpt = null;
    } else {
      const text = await readFile(constitutionAbs, "utf8");
      this.constitutionExcerpt = text.slice(0, 4000);
      const requiredMarkers = [
        "EMPIREAI CONSTITUTIONAL PURPOSE MISSION",
        "DIGITAL SOUL OF PILLOW",
        "SECTION 0",
        "SECTION 1",
        "SECTION 2",
        "SECTION 3",
        "SECTION 4",
        "SECTION 5",
        "SECTION 6",
        "SECTION 7",
        "SECTION 8",
        "SECTION 9",
        "SECTION 10",
        "SECTION 11",
        "SECTION 12",
        "SECTION 13",
        "SECTION 14",
        "SECTION 15",
        "SECTION 16",
        "SECTION 17",
        "SECTION 18",
        "SECTION 19",
        "SECTION 20",
        "SECTION 21",
        "SECTION 22",
        "SECTION 23",
        "APPENDIX A",
        "END OF APPENDIX A",
        "END OF CONSTITUTION",
        "CANONICAL MASTER EDITION",
        "Long-Term Empire Value",
      ] as const;
      const missingMarkers = requiredMarkers.filter((marker) => !text.includes(marker));
      if (missingMarkers.length > 0) {
        this.limitations.push(
          `Constitution file present but missing required Digital Soul V2 verbatim markers: ${missingMarkers.join(", ")}`,
        );
      }
      // Condensed/summary editions are non-governing; require substantial Master Edition body.
      if (text.length < 100_000) {
        this.limitations.push(
          `Constitution file is only ${text.length} characters — expected full Canonical Master Edition (verbatim Sections 0–23 + Appendix A), not a condensed summary.`,
        );
      }
    }

    this.loadedAt = new Date().toISOString();
    return this.snapshot();
  }

  snapshot(): DigitalSoulRuntimeSnapshot {
    const decisionsPromiseSkipped = 0;
    return {
      version: DIGITAL_SOUL_VERSION,
      documentId: DIGITAL_SOUL_DOCUMENT_ID,
      constitutionPresent: this.constitutionPresent,
      constitutionPath: DIGITAL_SOUL_CONSTITUTION_PATH,
      principleCount: DIGITAL_SOUL_PRINCIPLES.length,
      sectionCount: DIGITAL_SOUL_SECTIONS.length,
      matrixRequirementCount: CONSTITUTIONAL_REQUIREMENT_MATRIX.length,
      decisionRecordCount: decisionsPromiseSkipped,
      loadedAt: this.loadedAt ?? new Date().toISOString(),
      productionSafe: this.limitations.length === 0 || this.constitutionPresent,
      limitations: [...this.limitations],
    };
  }

  async getSnapshotWithDecisionCount(): Promise<DigitalSoulRuntimeSnapshot> {
    const base = this.snapshot();
    const records = await listExecutiveDecisionRecords(this.repositoryRoot);
    return { ...base, decisionRecordCount: records.length };
  }

  getPromptBlock(): string {
    return buildDigitalSoulPromptBlock();
  }

  getReasoningNotes(): string[] {
    return buildDigitalSoulReasoningNotes();
  }

  getIdentityNarrative(): string {
    return [
      "EmpireAI is a persistent, owner-governed, continuously learning enterprise that creates legitimate real-world prosperity.",
      "Pillow is the Executive Mind, Founder Mind, Operating Intelligence, and Digital Soul of EmpireAI.",
      PERMANENT_DUTY,
    ].join(" ");
  }

  getSupremeDirective(): string {
    return `Maximize Long-Term Empire Value under Grand King constitutional authority while protecting legitimacy, truth, and resilience. (${LONG_TERM_EMPIRE_VALUE})`;
  }

  getPermanentQuestions(): {
    permanent: string;
    final: string;
  } {
    return {
      permanent: PERMANENT_EXECUTIVE_QUESTION,
      final: FINAL_EXECUTIVE_QUESTION,
    };
  }

  getPrinciples() {
    return DIGITAL_SOUL_PRINCIPLES;
  }

  getSections() {
    return DIGITAL_SOUL_SECTIONS;
  }

  getRequirementMatrix() {
    return CONSTITUTIONAL_REQUIREMENT_MATRIX;
  }

  getMatrixSummary() {
    return summarizeRequirementMatrix();
  }

  evaluate(input?: ComplianceInput) {
    return evaluateConstitutionalCompliance(input);
  }

  runRhythm(cadence: OperatingRhythmCadence, options?: Parameters<typeof runOperatingRhythmReview>[1]) {
    return runOperatingRhythmReview(cadence, options);
  }

  describeRhythm() {
    return describeOperatingRhythmDoctrine();
  }

  async recordDecision(input: RecordDecisionInput) {
    return recordExecutiveDecision(this.repositoryRoot, input);
  }

  async listDecisions() {
    return listExecutiveDecisionRecords(this.repositoryRoot);
  }

  getConstitutionExcerpt(): string | null {
    return this.constitutionExcerpt;
  }
}

export async function createDigitalSoulRuntime(
  repositoryRoot: string,
): Promise<DigitalSoulRuntime> {
  const runtime = new DigitalSoulRuntime(repositoryRoot);
  await runtime.initialize();
  return runtime;
}
