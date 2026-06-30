import { z } from "zod";

import { emailFlowTypeSchema, type EmailFlowType } from "./email-flow-types.js";

/** Subject line variant for an email flow. */
export type EmailSubjectLine = {
  subjectLineId: string;
  flowType: EmailFlowType;
  variant: string;
  subject: string;
  previewText: string;
  score: number;
};

export const emailSubjectLineSchema = z.object({
  subjectLineId: z.string().min(1),
  flowType: emailFlowTypeSchema,
  variant: z.string().min(1),
  subject: z.string().min(1),
  previewText: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates an EmailSubjectLine record shape. */
export function validateEmailSubjectLine(value: unknown): EmailSubjectLine {
  return emailSubjectLineSchema.parse(value);
}
