import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { DIGITAL_SOUL_DECISION_STORE_RELATIVE } from "./paths.js";
import { evaluateConstitutionalCompliance } from "./compliance.js";
import type { ConfidenceLevel, ExecutiveDecisionRecord } from "./types.js";

export type RecordDecisionInput = {
  decision: string;
  context: string;
  evidence?: string[];
  assumptions?: string[];
  alternatives?: string[];
  reasoning: string;
  expectedEmpireValue: string;
  expectedRisks?: string[];
  confidence?: ConfidenceLevel;
  approvalAuthority: string;
  futureReviewDate?: string;
  irreversible?: boolean;
  majorCapital?: boolean;
};

function decisionStorePath(repositoryRoot: string): string {
  return path.join(repositoryRoot, DIGITAL_SOUL_DECISION_STORE_RELATIVE);
}

export async function listExecutiveDecisionRecords(
  repositoryRoot: string,
): Promise<ExecutiveDecisionRecord[]> {
  const filePath = decisionStorePath(repositoryRoot);
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ExecutiveDecisionRecord);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw error;
  }
}

/**
 * Persist a major executive decision record (JSONL).
 * Enforces evidence/assumption separation via compliance evaluation.
 */
export async function recordExecutiveDecision(
  repositoryRoot: string,
  input: RecordDecisionInput,
): Promise<ExecutiveDecisionRecord> {
  const compliance = evaluateConstitutionalCompliance({
    recommendation: input.decision,
    evidence: input.evidence,
    assumptions: input.assumptions,
    alternatives: input.alternatives,
    expectedEmpireValue: input.expectedEmpireValue,
    risks: input.expectedRisks,
    confidence: input.confidence,
    irreversible: input.irreversible,
    majorCapital: input.majorCapital,
  });

  const record: ExecutiveDecisionRecord = {
    id: `ds-dec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    recordedAt: new Date().toISOString(),
    decision: input.decision.trim(),
    context: input.context.trim(),
    evidence: compliance.evidenceAssumptionSeparation.knownFacts,
    assumptions: compliance.evidenceAssumptionSeparation.assumptions,
    alternatives: input.alternatives ?? [],
    reasoning: input.reasoning.trim(),
    expectedEmpireValue: input.expectedEmpireValue.trim(),
    expectedRisks: input.expectedRisks ?? [],
    confidence: input.confidence ?? "Moderate",
    approvalAuthority: input.approvalAuthority.trim(),
    recommendedBy: "Pillow",
    futureReviewDate: input.futureReviewDate,
    constitutionalAlignment: compliance.aligned,
  };

  const filePath = decisionStorePath(repositoryRoot);
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}
