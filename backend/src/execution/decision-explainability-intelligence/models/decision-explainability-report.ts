import { z } from "zod";

import {
  decisionAlternativeSchema,
  type DecisionAlternative,
} from "./decision-alternative.js";
import {
  decisionConfidenceSchema,
  type DecisionConfidence,
} from "./decision-confidence.js";
import { decisionEvidenceSchema, type DecisionEvidence } from "./decision-evidence.js";
import {
  decisionReasoningSchema,
  type DecisionReasoning,
} from "./decision-reasoning.js";
import {
  decisionSupportingSignalSchema,
  type DecisionSupportingSignal,
} from "./decision-supporting-signal.js";
import { decisionTradeoffSchema, type DecisionTradeoff } from "./decision-tradeoff.js";

export const DECISION_TYPES = [
  "LAUNCH",
  "PRICING",
  "MARKETING",
  "INVENTORY",
  "SUPPLIER",
  "EXPANSION",
  "OPERATIONS",
] as const;

export type DecisionType = (typeof DECISION_TYPES)[number];

export type DecisionExplainabilityReportId = string;

/** Complete explainability report for an AI decision — intelligence only, no auto-execute. */
export type DecisionExplainabilityReport = {
  reportId: DecisionExplainabilityReportId;
  storeId: string;
  brandId: string;
  decisionType: DecisionType;
  decisionTitle: string;
  chosenOption: string;
  reasoning: DecisionReasoning;
  evidence: DecisionEvidence[];
  confidence: DecisionConfidence;
  alternatives: DecisionAlternative[];
  tradeoffs: DecisionTradeoff[];
  supportingSignals: DecisionSupportingSignal[];
  overallScore: number;
  explainabilityScore: number;
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoExecuteEnabled: false;
};

export type DecisionExplainabilityReportCreateInput = Omit<
  DecisionExplainabilityReport,
  "reportId"
>;

export const decisionExplainabilityReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  decisionType: z.enum(DECISION_TYPES),
  decisionTitle: z.string().min(1),
  chosenOption: z.string().min(1),
  reasoning: decisionReasoningSchema,
  evidence: z.array(decisionEvidenceSchema).min(1),
  confidence: decisionConfidenceSchema,
  alternatives: z.array(decisionAlternativeSchema).min(2),
  tradeoffs: z.array(decisionTradeoffSchema).min(1),
  supportingSignals: z.array(decisionSupportingSignalSchema),
  overallScore: z.number().min(0).max(100),
  explainabilityScore: z.number().min(0).max(100),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoExecuteEnabled: z.literal(false),
});

/** Validates a DecisionExplainabilityReport record shape. */
export function validateDecisionExplainabilityReport(
  value: unknown,
): DecisionExplainabilityReport {
  return decisionExplainabilityReportSchema.parse(value);
}
