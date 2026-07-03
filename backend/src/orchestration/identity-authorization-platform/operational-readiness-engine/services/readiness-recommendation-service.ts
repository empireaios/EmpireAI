/**
 * G8-06 — Readiness recommendations service.
 */

import type { ReadinessRecommendation } from "../contracts/readiness-types.js";
import type { ProviderReadinessState } from "../evaluators/provider-readiness-evaluator.js";
import { listReadinessPluginsByKind } from "../plugins/readiness-plugin-host.js";

export function buildReadinessRecommendations(states: ProviderReadinessState[]): ReadinessRecommendation[] {
  const plugins = listReadinessPluginsByKind("recommendation_generator");
  void plugins;

  const recommendations: ReadinessRecommendation[] = [];

  for (const state of states) {
    if (state.missingCredential) {
      recommendations.push({
        recommendationId: `rec:credential:${state.providerId}`,
        priority: "high",
        action: "submit_credentials",
        message: `Submit credentials for ${state.providerId}`,
        providerId: state.providerId,
      });
    }
    if (state.missingPermissions) {
      recommendations.push({
        recommendationId: `rec:permission:${state.providerId}`,
        priority: "high",
        action: "grant_permissions",
        message: `Grant required permissions for ${state.providerId}`,
        providerId: state.providerId,
      });
    }
    if (state.missingScopes) {
      recommendations.push({
        recommendationId: `rec:scope:${state.providerId}`,
        priority: "medium",
        action: "reauthorize_scopes",
        message: `Reauthorize scopes for ${state.providerId}`,
        providerId: state.providerId,
      });
    }
    if (state.expired) {
      recommendations.push({
        recommendationId: `rec:reconnect:${state.providerId}`,
        priority: "high",
        action: "reconnect",
        message: `Reconnect expired authorization for ${state.providerId}`,
        providerId: state.providerId,
      });
    }
    if (state.degraded) {
      recommendations.push({
        recommendationId: `rec:health:${state.providerId}`,
        priority: "medium",
        action: "run_health_check",
        message: `Run health check for degraded ${state.providerId}`,
        providerId: state.providerId,
      });
    }
  }

  return recommendations;
}
