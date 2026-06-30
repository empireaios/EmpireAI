import { z } from "zod";

import { CANONICAL_DOCTRINE_IDS } from "../../../foundation/doctrine-engine/models/doctrine.js";

/** EA Execution Doctrine — applies to LIVE-010 and all subsequent execution missions. */
export const EA_EXECUTION_DOCTRINE_ID = CANONICAL_DOCTRINE_IDS.EA_EXECUTION;

export const EA_EXECUTION_PRINCIPLES = [
  "GRAND_KING_ACCOUNT_FIRST",
  "PACKAGE_BASED_ARCHITECTURE",
  "HUMAN_APPROVAL_GATES",
  "EXPLAINABILITY",
  "TRACEABILITY",
  "CAPITAL_PROTECTION",
  "NO_LOGIC_DUPLICATION",
  "ECOMMERCE_OS_INTEGRATION",
] as const;

export type EaExecutionPrinciple = (typeof EA_EXECUTION_PRINCIPLES)[number];

export const GRAND_KING_ACCOUNT_TYPE = "grand_king" as const;
export const FOUNDER_ACCOUNT_TYPE = "founder" as const;

export const executionTraceInputPackageSchema = z.object({
  engineId: z.string().min(1),
  packageId: z.string().min(1),
  packageType: z.string().min(1),
});

export const executionTraceOutputPackageSchema = z.object({
  engineId: z.string().min(1),
  packageId: z.string().min(1),
  packageType: z.string().min(1),
});

export const executionTraceSchema = z.object({
  doctrineReference: z.string().min(1),
  inputPackages: z.array(executionTraceInputPackageSchema).min(1),
  outputPackage: executionTraceOutputPackageSchema,
  decisionSource: z.string().min(1),
  responsibleEngine: z.string().min(1),
  confidence: z.number().int().min(0).max(100),
  accountType: z.enum([GRAND_KING_ACCOUNT_TYPE, FOUNDER_ACCOUNT_TYPE]).default(GRAND_KING_ACCOUNT_TYPE),
  recordedAt: z.string().datetime({ offset: true }),
});

export type ExecutionTrace = z.infer<typeof executionTraceSchema>;

export const explainableRecommendationSchema = z.object({
  why: z.string().min(1),
  intelligenceSources: z.array(z.string()).min(1),
  confidence: z.number().int().min(0).max(100),
  risks: z.array(z.string()),
  alternatives: z.array(z.string()),
});

export type ExplainableRecommendation = z.infer<typeof explainableRecommendationSchema>;

export const executionDoctrineComplianceSchema = z.object({
  doctrineId: z.literal(EA_EXECUTION_DOCTRINE_ID),
  appliesFromMission: z.string().min(1),
  principles: z.array(z.enum(EA_EXECUTION_PRINCIPLES)),
  irreversibleActionsBlocked: z.literal(true),
});

export type ExecutionDoctrineCompliance = z.infer<typeof executionDoctrineComplianceSchema>;

/** Builds traceability record required by EA Execution Doctrine principle 5. */
export function buildExecutionTrace(input: {
  inputPackages: ExecutionTrace["inputPackages"];
  outputPackage: ExecutionTrace["outputPackage"];
  decisionSource: string;
  responsibleEngine: string;
  confidence: number;
  accountType?: typeof GRAND_KING_ACCOUNT_TYPE | typeof FOUNDER_ACCOUNT_TYPE;
}): ExecutionTrace {
  return {
    doctrineReference: EA_EXECUTION_DOCTRINE_ID,
    inputPackages: input.inputPackages,
    outputPackage: input.outputPackage,
    decisionSource: input.decisionSource,
    responsibleEngine: input.responsibleEngine,
    confidence: Math.round(input.confidence),
    accountType: input.accountType ?? GRAND_KING_ACCOUNT_TYPE,
    recordedAt: new Date().toISOString(),
  };
}

/** Builds explainable recommendation block required by EA Execution Doctrine principle 4. */
export function buildExplainableRecommendation(input: {
  why: string;
  intelligenceSources: string[];
  confidence: number;
  risks: string[];
  alternatives: string[];
}): ExplainableRecommendation {
  return {
    why: input.why,
    intelligenceSources: input.intelligenceSources,
    confidence: Math.round(input.confidence),
    risks: input.risks,
    alternatives: input.alternatives,
  };
}

/** Standard execution doctrine compliance declaration for LIVE-010+ module contracts. */
export function createExecutionDoctrineCompliance(missionId: string): ExecutionDoctrineCompliance {
  return {
    doctrineId: EA_EXECUTION_DOCTRINE_ID,
    appliesFromMission: missionId,
    principles: [...EA_EXECUTION_PRINCIPLES],
    irreversibleActionsBlocked: true,
  };
}

/** When a design decision must choose between account types, Grand King's Account wins. */
export function prioritizeGrandKingAccount<T>(grandKingValue: T, _founderValue: T): T {
  return grandKingValue;
}
