import { z } from "zod";
import {
  classifyExecutiveQuery,
  conversationalResponsePolicy,
} from "../../domain/services/executive-conversational-routing.js";

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
  currentBusiness: z.string().nullable().optional(),
  currentMission: z.string().nullable().optional(),
  currentJourney: z.string().nullable().optional(),
  currentRoadmapItem: z.string().nullable().optional(),
  builderStatus: z.string().nullable().optional(),
  supervisorStatus: z.string().nullable().optional(),
  productionStatus: z.string().nullable().optional(),
  guardianStatus: z.string().nullable().optional(),
  repositoryFingerprint: z.string().nullable().optional(),
  recommendations: z.array(z.string()).max(12).optional(),
  risks: z.array(z.string()).max(12).optional(),
});

export type PillowWorkspaceContext = z.infer<typeof pillowWorkspaceContextSchema>;

export function buildScreenAwarenessBrief(
  context: PillowWorkspaceContext,
  query?: string,
): string {
  const lines = [
    `Active screen: ${context.screenTitle}`,
    `Path: ${context.screenPath}`,
    context.module ? `Module: ${context.module}` : null,
    context.purpose ? `Purpose: ${context.purpose}` : null,
    context.workflow ? `Workflow: ${context.workflow}` : null,
    context.kpiLabel
      ? `Visible KPI: ${context.kpiLabel}${context.kpiValue ? ` = ${context.kpiValue}` : ""}`
      : null,
    context.selectedRecords?.length
      ? `Selected items: ${context.selectedRecords.map((r) => `${r.type}:${r.label ?? r.id}`).join(", ")}`
      : null,
    context.navigationHistory?.length
      ? `Recent navigation: ${context.navigationHistory.slice(-5).join(" → ")}`
      : null,
  ].filter(Boolean);

  if (query) {
    lines.unshift(conversationalResponsePolicy(query));
  }

  return lines.join("\n");
}

export function formatPillowWorkspaceContext(
  context: PillowWorkspaceContext,
  query?: string,
): string {
  const queryKind = query ? classifyExecutiveQuery(query) : "general";
  const includeOperationalRisks =
    queryKind === "blocker" || queryKind === "alert" || queryKind === "recommend";
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
    context.currentBusiness ? `Current business: ${context.currentBusiness}` : null,
    context.currentMission ? `Current mission: ${context.currentMission}` : null,
    context.currentJourney ? `Current journey: ${context.currentJourney}` : null,
    context.currentRoadmapItem ? `Current roadmap: ${context.currentRoadmapItem}` : null,
    context.builderStatus ? `Builder status: ${context.builderStatus}` : null,
    context.supervisorStatus ? `Supervisor status: ${context.supervisorStatus}` : null,
    context.productionStatus ? `Production status: ${context.productionStatus}` : null,
    context.guardianStatus ? `Guardian/runtime status: ${context.guardianStatus}` : null,
    context.repositoryFingerprint ? `Repository: ${context.repositoryFingerprint}` : null,
    context.recommendations?.length && includeOperationalRisks
      ? `Pillow recommendations: ${context.recommendations.join("; ")}`
      : null,
    context.risks?.length && includeOperationalRisks
      ? `Current risks: ${context.risks.join("; ")}`
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}
