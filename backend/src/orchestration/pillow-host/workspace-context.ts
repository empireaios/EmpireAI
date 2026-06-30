import { z } from "zod";

/** PILLOW-019 — Structured workspace context from Executive Companion (session-scoped). */
export const pillowWorkspaceContextSchema = z.object({
  screenPath: z.string(),
  screenId: z.string(),
  screenTitle: z.string(),
  module: z.string().optional(),
  workflow: z.string().optional(),
  uxId: z.string().optional(),
  purpose: z.string().optional(),
  kpiLabel: z.string().nullable().optional(),
  kpiValue: z.string().nullable().optional(),
  pendingApprovals: z.number().int().nonnegative().optional(),
  unreadNotifications: z.number().int().nonnegative().optional(),
  navigationHistory: z.array(z.string()).max(20).optional(),
  selectedRecords: z
    .array(
      z.object({
        type: z.string(),
        id: z.string(),
        label: z.string().optional(),
      }),
    )
    .max(20)
    .optional(),
  businessEntity: z.record(z.unknown()).optional(),
  extensionId: z.string().optional(),
});

export type PillowWorkspaceContext = z.infer<typeof pillowWorkspaceContextSchema>;

export function formatPillowWorkspaceContext(context: PillowWorkspaceContext): string {
  const lines = [
    "[Executive Companion — active workspace]",
    `Screen: ${context.screenTitle} (${context.screenPath})`,
    `Module: ${context.screenId}`,
    context.module ? `Domain module: ${context.module}` : null,
    context.workflow ? `Workflow: ${context.workflow}` : null,
    context.uxId ? `UX: ${context.uxId}` : null,
    context.purpose ? `Purpose: ${context.purpose}` : null,
    context.extensionId ? `Extension: ${context.extensionId}` : null,
    context.kpiLabel
      ? `KPI focus: ${context.kpiLabel}${context.kpiValue ? ` = ${context.kpiValue}` : ""}`
      : null,
    context.pendingApprovals !== undefined
      ? `Pending approvals: ${context.pendingApprovals}`
      : null,
    context.unreadNotifications !== undefined
      ? `Unread notifications: ${context.unreadNotifications}`
      : null,
    context.navigationHistory?.length
      ? `Session navigation: ${context.navigationHistory.join(" → ")}`
      : null,
    context.selectedRecords?.length
      ? `Selected records: ${context.selectedRecords.map((r) => `${r.type}:${r.id}${r.label ? ` (${r.label})` : ""}`).join(", ")}`
      : null,
    context.businessEntity && Object.keys(context.businessEntity).length > 0
      ? `Business entity: ${JSON.stringify(context.businessEntity)}`
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}
