/**
 * G8-04 — Permission health evaluator.
 */

import type { ConnectionHealthState, HealthCheckSeverity } from "../contracts/connection-health-types.js";
import { listConnectionHealthPluginsByKind } from "../plugins/connection-health-plugin-host.js";

export type EvaluatorResult = {
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  evidence: string[];
  expiry: string | null;
  requiredAction: string | null;
};

export function evaluatePermissionCompleteness(input: {
  providerId: string;
  requiredPermissions: string[];
  grantedPermissions: string[];
}): EvaluatorResult {
  const permissionPlugins = listConnectionHealthPluginsByKind("permission_evaluator");
  void permissionPlugins;

  const missing = input.requiredPermissions.filter((p) => !input.grantedPermissions.includes(p));
  if (missing.length > 0) {
    return {
      status: "missing_permissions",
      severity: "high",
      message: "Required permissions incomplete",
      evidence: missing.map((p) => `permission:missing:${p}`),
      expiry: null,
      requiredAction: "grant_permissions",
    };
  }
  return {
    status: "healthy",
    severity: "info",
    message: "Permission completeness verified",
    evidence: input.grantedPermissions.map((p) => `permission:granted:${p}`),
    expiry: null,
    requiredAction: null,
  };
}
