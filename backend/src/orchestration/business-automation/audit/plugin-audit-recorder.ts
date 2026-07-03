/**
 * G5-09 — EKLS plugin audit recorder (Pillow-governed).
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { AutomationPluginCategory, AutomationPluginLifecycleState } from "../contracts/automation-plugin-types.js";

export type PluginAuditEventType =
  | "plugin_discovered"
  | "plugin_registered"
  | "plugin_activated"
  | "plugin_execution"
  | "plugin_failure"
  | "plugin_recovery"
  | "plugin_disabled"
  | "plugin_unloaded"
  | "plugin_retired";

export type PluginAuditEvent = {
  eventId: string;
  eventType: PluginAuditEventType;
  pluginId: string;
  category: AutomationPluginCategory;
  lifecycleState: AutomationPluginLifecycleState;
  workspaceId: string;
  actorId: string;
  reason: string;
  pillowGovernance: true;
  recordedAt: string;
  evidence?: Record<string, unknown>;
};

let auditSequence = 0;
const pluginAuditLog: PluginAuditEvent[] = [];

export function recordPluginAuditEvent(input: {
  eventType: PluginAuditEventType;
  pluginId: string;
  category: AutomationPluginCategory;
  lifecycleState: AutomationPluginLifecycleState;
  workspaceId: string;
  actorId: string;
  reason: string;
  evidence?: Record<string, unknown>;
}): PluginAuditEvent {
  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "business-automation",
      operation: "store",
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    throw new Error(`EKLS plugin audit rejected: ${ekls.reason}`);
  }

  const event: PluginAuditEvent = {
    eventId: `plugin-audit-${++auditSequence}`,
    eventType: input.eventType,
    pluginId: input.pluginId,
    category: input.category,
    lifecycleState: input.lifecycleState,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    reason: input.reason,
    pillowGovernance: true,
    recordedAt: new Date().toISOString(),
    evidence: input.evidence,
  };

  pluginAuditLog.push(event);
  return event;
}

export function listPluginAuditEvents(workspaceId?: string): readonly PluginAuditEvent[] {
  if (!workspaceId) return [...pluginAuditLog];
  return pluginAuditLog.filter((event) => event.workspaceId === workspaceId);
}

export function resetPluginAuditLogForTests(): void {
  pluginAuditLog.length = 0;
  auditSequence = 0;
}
