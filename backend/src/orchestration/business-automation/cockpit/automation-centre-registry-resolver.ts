/**
 * G5-07 — Registry-driven Cockpit display resolution (MONITOR / REPORT / NOTIFICATION).
 */

import type {
  AutomationMonitorRow,
  AutomationNotificationRow,
  AutomationReportRow,
  AutomationWorkflowRow,
} from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_MONITOR,
  REG_AUTOMATION_NOTIFICATION,
  REG_AUTOMATION_REPORT,
  REG_AUTOMATION_WORKFLOW,
} from "../../../registry/types/registry-ids.js";
import type { AutomationRegistryHealthRow, AutomationNotificationRow as CockpitNotificationRow } from "./contracts/automation-centre-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

export function resolveAutomationCentreRegistryHealth(): AutomationRegistryHealthRow[] {
  const workflows = resolveAutomationRegistry({}, REG_AUTOMATION_WORKFLOW)
    .rows as AutomationWorkflowRow[];
  const monitors = resolveAutomationRegistry({}, REG_AUTOMATION_MONITOR)
    .rows as AutomationMonitorRow[];
  const reports = resolveAutomationRegistry({}, REG_AUTOMATION_REPORT)
    .rows as AutomationReportRow[];
  const notifications = resolveAutomationRegistry({}, REG_AUTOMATION_NOTIFICATION)
    .rows as AutomationNotificationRow[];

  const rows: AutomationRegistryHealthRow[] = [];

  for (const workflow of workflows) {
    rows.push({
      registryId: workflow.id,
      registryType: REG_AUTOMATION_WORKFLOW,
      name: workflow.name,
      status: "healthy",
      detail: `${workflow.steps.length} steps · v${workflow.version}`,
    });
  }

  for (const monitor of monitors) {
    rows.push({
      registryId: monitor.id,
      registryType: REG_AUTOMATION_MONITOR,
      name: monitor.name,
      status: "healthy",
      detail: monitor.healthChecks.join(", "),
    });
  }

  for (const report of reports) {
    rows.push({
      registryId: report.id,
      registryType: REG_AUTOMATION_REPORT,
      name: report.name,
      status: "healthy",
      detail: report.reportType,
    });
  }

  for (const notification of notifications) {
    rows.push({
      registryId: notification.id,
      registryType: REG_AUTOMATION_NOTIFICATION,
      name: notification.name,
      status: "healthy",
      detail: `${notification.channel} · ${notification.templateRef}`,
    });
  }

  return rows;
}

export function resolveAutomationCentreNotifications(): CockpitNotificationRow[] {
  const notifications = resolveAutomationRegistry({}, REG_AUTOMATION_NOTIFICATION)
    .rows as AutomationNotificationRow[];

  return notifications.map((row) => ({
    notificationRegistryId: row.id,
    channel: row.channel,
    templateRef: row.templateRef ?? "unknown",
    status: "configured",
  }));
}
