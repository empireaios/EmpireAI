import { z } from "zod";

/** Granular action within an investigation task. */
export type InvestigationStep = {
  stepId: string;
  order: number;
  title: string;
  description: string;
  connectorId: string | null;
  expectedOutcome: string;
};

export type InvestigationStepInput = Omit<InvestigationStep, "stepId"> & {
  stepId?: string;
};

export const investigationStepSchema = z.object({
  stepId: z.string().min(1),
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  connectorId: z.string().nullable(),
  expectedOutcome: z.string().min(1),
});

/** Validates an InvestigationStep record shape. */
export function validateInvestigationStep(value: unknown): InvestigationStep {
  return investigationStepSchema.parse(value);
}
