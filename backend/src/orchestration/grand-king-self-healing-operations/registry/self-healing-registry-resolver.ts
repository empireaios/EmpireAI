/**
 * G7-08 — Self-healing registry resolver.
 */

import type { AutomationRecoveryRow } from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_RECOVERY,
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_MONITOR,
  REG_OPTIMIZATION_POLICY,
  REG_READINESS_POLICY,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import {
  identityMonitorConfigurationSchema,
  optimizationPolicyConfigurationSchema,
  readinessPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";
import type { HealingAction, SelfHealingDomainId } from "../../../registry/types/self-healing-registry-types.js";

export function listSelfHealingRegistryIds(): string[] {
  return [
    REG_AUTOMATION_RECOVERY,
    REG_AUTOMATION_POLICY,
    REG_READINESS_POLICY,
    REG_CONNECTION_PROVIDER,
    REG_IDENTITY_MONITOR,
    REG_OPTIMIZATION_POLICY,
  ];
}

export function resolveSelfHealingDependencies(context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const recoveryRows = loader.resolve(context, REG_AUTOMATION_RECOVERY).rows as AutomationRecoveryRow[];
  const readinessRows = loader.resolve(context, REG_READINESS_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const optimizationRows = loader.resolve(context, REG_OPTIMIZATION_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const identityMonitorRows = loader.resolve(context, REG_IDENTITY_MONITOR).rows as ProductionWorkspaceRegistryRowBase[];

  const readiness = readinessRows.map((r) => readinessPolicyConfigurationSchema.parse(r.configuration.readinessPolicy));
  const optimization = optimizationRows.map((r) => optimizationPolicyConfigurationSchema.parse(r.configuration.optimizationPolicy));
  const identityMonitor = identityMonitorRows.map((r) => identityMonitorConfigurationSchema.parse(r.configuration.identityMonitor));

  return {
    automationRecovery: REG_AUTOMATION_RECOVERY,
    automationPolicy: REG_AUTOMATION_POLICY,
    readinessPolicy: REG_READINESS_POLICY,
    connectionProvider: REG_CONNECTION_PROVIDER,
    identityMonitor: REG_IDENTITY_MONITOR,
    optimizationPolicy: REG_OPTIMIZATION_POLICY,
    recoveryRows: recoveryRows.map((r) => r.id),
    recoveryStrategies: recoveryRows.flatMap((r) => r.strategies.map((s) => s.kind)),
    readinessSignals: readiness[0]?.readinessSignals ?? [],
    blockerConditions: readiness[0]?.blockerConditions ?? [],
    anomalyRuleRefs: optimization[0]?.anomalyRuleRefs ?? [],
    identityDegradationRules: identityMonitor[0]?.degradationRuleRefs ?? [],
    identityRecoveryRules: identityMonitor[0]?.recoveryRuleRefs ?? [],
    approvalChainRef: optimization[0]?.approvalChainRef ?? REG_READINESS_POLICY,
  };
}

export function deriveHealingSignalFromRef(ref: string): number {
  const hash = ref.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (hash % 80 + 20) / 100;
}

const DOMAIN_SUBSYSTEM_MAP: Record<SelfHealingDomainId, string> = {
  commerce: "grand-king-commerce-operations",
  business_automation: "grand-king-business-automation-operations",
  identity: "grand-king-production-workspace",
  production_workspace: "grand-king-production-workspace",
  infrastructure: "production-certification",
  brain: "brain",
  registry: "registry",
  pillow: "pillow",
  ekls: "ekls",
  cockpit: "cockpit",
  business_engines: "grand-king-production-workspace",
  provider_connections: "grand-king-production-workspace",
};

export function mapDomainToSubsystem(domainId: SelfHealingDomainId): string {
  return DOMAIN_SUBSYSTEM_MAP[domainId];
}

export function resolveHealingActionFromRecoveryStrategy(
  strategies: string[],
  domainId: SelfHealingDomainId,
): HealingAction {
  const normalized = strategies.map((s) => s.toLowerCase());
  if (normalized.some((s) => s.includes("rollback"))) return "rollback";
  if (normalized.some((s) => s.includes("retry"))) return "retry";
  if (normalized.some((s) => s.includes("restart"))) return "restart";
  if (domainId === "provider_connections") return "reconnect";
  if (domainId === "identity") return "revalidate";
  if (domainId === "commerce") return "resynchronise";
  return "retry";
}
