import { z } from "zod";

import { emailFlowTypeSchema, type EmailFlowType } from "./email-flow-types.js";

/** Email body copy blueprint for a flow step. */
export type EmailCopy = {
  copyId: string;
  flowType: EmailFlowType;
  stepOrder: number;
  headline: string;
  bodyPlain: string;
  callToAction: string;
  score: number;
};

export const emailCopySchema = z.object({
  copyId: z.string().min(1),
  flowType: emailFlowTypeSchema,
  stepOrder: z.number().int().min(1),
  headline: z.string().min(1),
  bodyPlain: z.string().min(1),
  callToAction: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates an EmailCopy record shape. */
export function validateEmailCopy(value: unknown): EmailCopy {
  return emailCopySchema.parse(value);
}
