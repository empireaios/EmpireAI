/**
 * G8-09 — Identity plugin health monitoring.
 */

import type {
  IdentityPluginHealthStatus,
  IdentityPluginRecord,
} from "../contracts/identity-plugin-types.js";

export type IdentityPluginHealthReport = {
  pluginId: string;
  healthStatus: IdentityPluginHealthStatus;
  lastCheckedAt: string;
  checksPassed: number;
  checksFailed: number;
  message: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateIdentityPluginHealth(record: IdentityPluginRecord): IdentityPluginHealthReport {
  const timestamp = nowIso();
  let healthStatus: IdentityPluginHealthStatus = "healthy";
  let message = "Plugin health check passed";

  if (record.status === "failed" || record.status === "retired") {
    healthStatus = "unhealthy";
    message = `Plugin lifecycle state is ${record.status}`;
  } else if (record.status === "disabled" || record.status === "deprecated") {
    healthStatus = "degraded";
    message = `Plugin lifecycle state is ${record.status}`;
  } else if (record.errors.length > 0) {
    healthStatus = "degraded";
    message = record.errors[0] ?? "Plugin reported errors";
  } else if (record.failureCount > 0) {
    healthStatus = "degraded";
    message = `Plugin failure count: ${record.failureCount}`;
  } else if (record.status === "unknown" || record.status === "discovered") {
    healthStatus = "unknown";
    message = `Plugin lifecycle state is ${record.status}`;
  }

  return {
    pluginId: record.pluginId,
    healthStatus,
    lastCheckedAt: timestamp,
    checksPassed: healthStatus === "healthy" ? 1 : 0,
    checksFailed: healthStatus === "healthy" ? 0 : 1,
    message,
  };
}

export function applyIdentityPluginHealthReport(
  record: IdentityPluginRecord,
  report: IdentityPluginHealthReport,
): IdentityPluginRecord {
  return {
    ...record,
    healthStatus: report.healthStatus,
    lastHealthCheckedAt: report.lastCheckedAt,
    updatedAt: report.lastCheckedAt,
  };
}
