import { z } from "zod";

export const AssistantMessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type AssistantMessageRole = z.infer<typeof AssistantMessageRoleSchema>;

export const AssistantCommandTypeSchema = z.enum([
  "mission_generation",
  "executive_audit_generation",
  "repository_write",
  "runtime_operation",
]);
export type AssistantCommandType = z.infer<typeof AssistantCommandTypeSchema>;

export const AssistantCommandStatusSchema = z.enum(["pending", "approved", "rejected", "executed"]);
export type AssistantCommandStatus = z.infer<typeof AssistantCommandStatusSchema>;

export const EvidenceSourceSchema = z.enum([
  "REAL-031",
  "REAL-032",
  "REAL-033",
  "executive-council",
  "executive-surveillance",
  "pillow",
  "journey",
  "repository",
]);
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;

export const AssistantEvidenceSchema = z.object({
  evidenceId: z.string(),
  source: EvidenceSourceSchema,
  title: z.string(),
  summary: z.string(),
  moduleId: z.string().optional(),
  recordedAt: z.string(),
});
export type AssistantEvidence = z.infer<typeof AssistantEvidenceSchema>;

export const AssistantScreenContextSchema = z.object({
  screenPath: z.string(),
  screenId: z.string(),
  screenTitle: z.string(),
  uxId: z.string().optional(),
  purpose: z.string().optional(),
  boundApis: z.array(z.string()).optional(),
  journeyMarkers: z.array(z.string()).optional(),
});
export type AssistantScreenContext = z.infer<typeof AssistantScreenContextSchema>;

export const AssistantSessionSchema = z.object({
  sessionId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  screenContext: AssistantScreenContextSchema,
  kpiLabel: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AssistantSession = z.infer<typeof AssistantSessionSchema>;

export const AssistantMessageSchema = z.object({
  messageId: z.string(),
  sessionId: z.string(),
  role: AssistantMessageRoleSchema,
  content: z.string(),
  evidence: z.array(AssistantEvidenceSchema).optional(),
  createdAt: z.string(),
});
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

export const AssistantWorkflowSchema = z.object({
  workflowId: z.string(),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
  screenId: z.string(),
});
export type AssistantWorkflow = z.infer<typeof AssistantWorkflowSchema>;

export const AssistantCommandSchema = z.object({
  commandId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  sessionId: z.string(),
  type: AssistantCommandTypeSchema,
  title: z.string(),
  summary: z.string(),
  status: AssistantCommandStatusSchema,
  requiresApproval: z.boolean(),
  approvalId: z.string().nullable(),
  result: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  decidedAt: z.string().nullable(),
});
export type AssistantCommand = z.infer<typeof AssistantCommandSchema>;

export const WhyEvidenceQuerySchema = z.object({
  companyId: z.string().min(1),
  screenPath: z.string().min(1),
  kpiLabel: z.string().min(1),
  kpiValue: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  companyId: z.string().min(1),
  sessionId: z.string().min(1),
  message: z.string().min(1),
  screenPath: z.string().optional(),
  kpiLabel: z.string().optional(),
});
