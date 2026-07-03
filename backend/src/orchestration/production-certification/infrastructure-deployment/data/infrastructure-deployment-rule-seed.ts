/**
 * G6-03 — Infrastructure deployment rule seed (REG-CERTIFICATION-DEPLOYMENT).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";

type RuleKind =
  | "hosting"
  | "backend"
  | "frontend"
  | "database"
  | "queue"
  | "cache"
  | "storage"
  | "monitoring"
  | "backup"
  | "disaster_recovery"
  | "deployment_topology"
  | "scalability"
  | "ssl"
  | "dns"
  | "email"
  | "worker"
  | "scheduler"
  | "plugin_host"
  | "secrets_management"
  | "logging"
  | "alerting"
  | "api_layer";

function deploymentRow(input: {
  id: string;
  name: string;
  ruleKind: RuleKind;
  infrastructureDomain: string;
  serviceId: string;
  readinessSignals?: string[];
  forbiddenConditions?: string[];
  deploymentProfileRef?: string;
  registryRef?: string;
  healthCheckKind?: "wired" | "configured" | "available";
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Infrastructure deployment ${input.ruleKind} rule for ${input.infrastructureDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.readinessSignals ?? [],
    capabilities: ["deployment-validate"],
    configuration: {
      infrastructureDeploymentRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        infrastructureDomain: input.infrastructureDomain,
        serviceId: input.serviceId,
        readinessSignals: input.readinessSignals ?? [],
        forbiddenConditions: input.forbiddenConditions ?? [],
        deploymentProfileRef: input.deploymentProfileRef,
        registryRef: input.registryRef,
        healthCheckKind: input.healthCheckKind,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-DEPLOYMENT rows" },
  };
}

export const INFRASTRUCTURE_DEPLOYMENT_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  deploymentRow({
    id: "infrdep-rule-hosting",
    name: "Frontend hosting readiness",
    ruleKind: "hosting",
    infrastructureDomain: "frontend_hosting",
    serviceId: "frontend-host",
    readinessSignals: ["signal:frontend-package", "signal:deployment-profile"],
    deploymentProfileRef: "REG-DEPLOYMENT-PROFILE",
    healthCheckKind: "wired",
  }),
  deploymentRow({
    id: "infrdep-rule-backend",
    name: "Backend service readiness",
    ruleKind: "backend",
    infrastructureDomain: "backend_services",
    serviceId: "backend-api",
    readinessSignals: ["signal:backend-package", "signal:database-configured", "signal:guardian-enabled"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-frontend",
    name: "Frontend build readiness",
    ruleKind: "frontend",
    infrastructureDomain: "frontend_hosting",
    serviceId: "frontend-app",
    readinessSignals: ["signal:frontend-package"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-api",
    name: "API layer readiness",
    ruleKind: "api_layer",
    infrastructureDomain: "api_layer",
    serviceId: "api-gateway",
    readinessSignals: ["signal:backend-package", "signal:guardian-enabled"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-database",
    name: "Database availability",
    ruleKind: "database",
    infrastructureDomain: "database",
    serviceId: "primary-database",
    readinessSignals: ["signal:database-configured"],
    forbiddenConditions: ["database_unavailable"],
    healthCheckKind: "available",
  }),
  deploymentRow({
    id: "infrdep-rule-queue",
    name: "Queue infrastructure",
    ruleKind: "queue",
    infrastructureDomain: "redis_queue",
    serviceId: "job-queue",
    readinessSignals: ["signal:queue-configured"],
    forbiddenConditions: ["queue_unavailable"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-cache",
    name: "Cache infrastructure",
    ruleKind: "cache",
    infrastructureDomain: "redis_cache",
    serviceId: "redis-cache",
    readinessSignals: ["signal:cache-configured"],
    forbiddenConditions: ["cache_unavailable"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-storage",
    name: "Object storage readiness",
    ruleKind: "storage",
    infrastructureDomain: "object_storage",
    serviceId: "object-store",
    readinessSignals: ["signal:storage-configured"],
    forbiddenConditions: ["storage_unavailable"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-secrets",
    name: "Secrets management",
    ruleKind: "secrets_management",
    infrastructureDomain: "secrets_management",
    serviceId: "secrets-vault",
    readinessSignals: ["signal:secrets-vault-configured"],
    forbiddenConditions: ["missing_environment_variables"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-logging",
    name: "Logging infrastructure",
    ruleKind: "logging",
    infrastructureDomain: "logging",
    serviceId: "platform-logging",
    readinessSignals: ["signal:logging-enabled"],
    forbiddenConditions: ["logging_disabled"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-monitoring",
    name: "Monitoring infrastructure",
    ruleKind: "monitoring",
    infrastructureDomain: "monitoring",
    serviceId: "platform-monitoring",
    readinessSignals: ["signal:monitoring-enabled"],
    forbiddenConditions: ["monitoring_disabled"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-alerting",
    name: "Alerting infrastructure",
    ruleKind: "alerting",
    infrastructureDomain: "alerting",
    serviceId: "platform-alerting",
    readinessSignals: ["signal:monitoring-enabled"],
    forbiddenConditions: ["monitoring_disabled"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-backup",
    name: "Backup readiness",
    ruleKind: "backup",
    infrastructureDomain: "backups",
    serviceId: "backup-service",
    readinessSignals: ["signal:database-configured", "signal:backup-policy"],
    forbiddenConditions: ["backup_failures"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-disaster-recovery",
    name: "Disaster recovery readiness",
    ruleKind: "disaster_recovery",
    infrastructureDomain: "disaster_recovery",
    serviceId: "dr-service",
    readinessSignals: ["signal:backup-policy", "signal:deployment-profile"],
    forbiddenConditions: ["recovery_unavailable"],
    deploymentProfileRef: "REG-DEPLOYMENT-PROFILE",
    healthCheckKind: "wired",
  }),
  deploymentRow({
    id: "infrdep-rule-topology",
    name: "Deployment topology",
    ruleKind: "deployment_topology",
    infrastructureDomain: "deployment_topology",
    serviceId: "empire-topology",
    readinessSignals: ["signal:deployment-profile", "signal:backend-package", "signal:frontend-package"],
    deploymentProfileRef: "REG-DEPLOYMENT-PROFILE",
    registryRef: "REG-DEPLOYMENT-PROFILE",
    healthCheckKind: "wired",
  }),
  deploymentRow({
    id: "infrdep-rule-scalability",
    name: "Scalability readiness",
    ruleKind: "scalability",
    infrastructureDomain: "scalability",
    serviceId: "capacity-plane",
    readinessSignals: ["signal:queue-configured", "signal:worker-configured"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-ssl",
    name: "SSL readiness",
    ruleKind: "ssl",
    infrastructureDomain: "ssl",
    serviceId: "tls-termination",
    readinessSignals: ["signal:ssl-configured"],
    forbiddenConditions: ["ssl_problems"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-dns",
    name: "DNS readiness",
    ruleKind: "dns",
    infrastructureDomain: "dns",
    serviceId: "dns-routing",
    readinessSignals: ["signal:dns-configured"],
    forbiddenConditions: ["dns_problems"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-email",
    name: "Email infrastructure",
    ruleKind: "email",
    infrastructureDomain: "email_infrastructure",
    serviceId: "email-delivery",
    readinessSignals: ["signal:email-configured"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-worker",
    name: "Worker services",
    ruleKind: "worker",
    infrastructureDomain: "worker_services",
    serviceId: "background-worker",
    readinessSignals: ["signal:worker-configured", "signal:queue-configured"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-scheduler",
    name: "Scheduler services",
    ruleKind: "scheduler",
    infrastructureDomain: "scheduler",
    serviceId: "job-scheduler",
    readinessSignals: ["signal:scheduler-configured"],
    healthCheckKind: "configured",
  }),
  deploymentRow({
    id: "infrdep-rule-plugin-host",
    name: "Plugin host deployment",
    ruleKind: "plugin_host",
    infrastructureDomain: "plugin_host",
    serviceId: "plugin-runtime",
    readinessSignals: ["signal:backend-package", "signal:registry-wired"],
    registryRef: "REG-DOCTRINE",
    healthCheckKind: "wired",
  }),
];
