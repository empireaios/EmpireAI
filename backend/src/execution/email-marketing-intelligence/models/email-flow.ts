import { z } from "zod";

import { emailCopySchema, type EmailCopy } from "./email-copy.js";
import { emailFlowTypeSchema, type EmailFlowType } from "./email-flow-types.js";
import { emailSubjectLineSchema, type EmailSubjectLine } from "./email-subject-line.js";

export const EMAIL_FLOW_STATUSES = ["READY", "DRAFT"] as const;

export type EmailFlowStatus = (typeof EMAIL_FLOW_STATUSES)[number];

/** Complete email automation flow blueprint. */
export type EmailFlow = {
  flowId: string;
  flowType: EmailFlowType;
  displayName: string;
  description: string;
  trigger: string;
  delayHours: number;
  sequenceLength: number;
  score: number;
  status: EmailFlowStatus;
  subjectLines: EmailSubjectLine[];
  emailCopy: EmailCopy[];
};

export const emailFlowSchema = z.object({
  flowId: z.string().min(1),
  flowType: emailFlowTypeSchema,
  displayName: z.string().min(1),
  description: z.string().min(1),
  trigger: z.string().min(1),
  delayHours: z.number().min(0),
  sequenceLength: z.number().int().min(1),
  score: z.number().min(0).max(100),
  status: z.enum(EMAIL_FLOW_STATUSES),
  subjectLines: z.array(emailSubjectLineSchema).min(1),
  emailCopy: z.array(emailCopySchema).min(1),
});

/** Validates an EmailFlow record shape. */
export function validateEmailFlow(value: unknown): EmailFlow {
  return emailFlowSchema.parse(value);
}
