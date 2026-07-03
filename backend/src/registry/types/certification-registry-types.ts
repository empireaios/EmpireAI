/**
 * G6-00 — Production certification registry row schemas (REG-CERTIFICATION-*).
 */

import { z } from "zod";

export const CERTIFICATION_REGISTRY_VERSION = "g6-10-v1" as const;

export const CERTIFICATION_REGISTRY_LIFECYCLE = [
  "DRAFT",
  "VALIDATED",
  "PUBLISHED",
  "DEPRECATED",
  "RETIRED",
] as const;

export type CertificationRegistryLifecycle = (typeof CERTIFICATION_REGISTRY_LIFECYCLE)[number];

export const CERTIFICATION_DOMAINS = [
  "platform_integrity",
  "pillow_governance",
  "brain_execution",
  "ekls_memory",
  "registry_compliance",
  "g2_commerce",
  "g3_intelligence",
  "g4_cockpit",
  "g5_automation",
  "g8_identity_authorization",
  "security",
  "infrastructure",
  "production_deployment",
  "operational_readiness",
  "business_operations",
  "performance_scalability_resilience",
  "executive_operations",
  "failure_recovery_incident",
  "production_simulation",
  "grand_king_readiness",
  "final_production_readiness",
] as const;

export type CertificationDomainId = (typeof CERTIFICATION_DOMAINS)[number];

export const CERTIFICATION_SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;

export type CertificationSeverity = (typeof CERTIFICATION_SEVERITIES)[number];

export const CERTIFICATION_PROBE_REFS = [
  "probe:programme_module_contract",
  "probe:registry_resolution",
  "probe:pillow_governance",
  "probe:ekls_governance",
  "probe:executive_audit_artifact",
  "probe:brain_tools_registered",
  "probe:identity_module",
  "probe:platform_integrity",
  "probe:security_redaction",
  "probe:production_eligibility",
  "probe:platform_integrity_scan",
  "probe:security_governance_scan",
  "probe:governance_scan",
  "probe:deployment_scan",
  "probe:deployment_health",
  "probe:operational_scan",
  "probe:operational_readiness",
  "probe:business_operations_scan",
  "probe:business_operations",
  "probe:performance_scan",
  "probe:performance_status",
  "probe:executive_operations_scan",
  "probe:executive_operations_status",
  "probe:failure_recovery_scan",
  "probe:failure_recovery_status",
  "probe:production_simulation_scan",
  "probe:production_simulation_status",
  "probe:final_certification_scan",
  "probe:final_certification_status",
] as const;

export type CertificationProbeRef = (typeof CERTIFICATION_PROBE_REFS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const certificationRegistryRowBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(CERTIFICATION_REGISTRY_LIFECYCLE),
  version: z.string().regex(semverPattern),
  owner: z.string().min(1),
  dependencies: z.array(z.string()),
  capabilities: z.array(z.string()),
  configuration: z.record(z.unknown()),
  supportedRegions: z.array(z.string()).default([]),
  supportedCountries: z.array(z.string()).default([]),
  validation: z.object({
    schemaVersion: z.string().min(1),
    rules: z.array(z.string()).optional(),
  }),
  pluginSupport: z.object({
    allowPluginRegistration: z.boolean(),
  }),
  workspaceScope: z.object({
    scope: z.enum(["global", "workspace", "deployment"]),
    workspaceId: z.string().optional(),
    deploymentProfileId: z.string().optional(),
  }),
  futureCompatibility: z.object({
    notes: z.string().optional(),
  }),
});

export type CertificationRegistryRowBase = z.infer<typeof certificationRegistryRowBaseSchema>;

export const certificationDomainConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  domainId: z.enum(CERTIFICATION_DOMAINS),
  displayName: z.string().min(1),
  programmeRef: z.string().optional(),
  order: z.number().int().min(0),
});

export const certificationCheckConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  domainId: z.enum(CERTIFICATION_DOMAINS),
  probeRef: z.enum(CERTIFICATION_PROBE_REFS),
  severityDefault: z.enum(CERTIFICATION_SEVERITIES),
  blockerOnFail: z.boolean(),
  programmeRef: z.string().optional(),
  artifactRef: z.string().optional(),
  registryRef: z.string().optional(),
  toolNames: z.array(z.string()).optional(),
});

export const certificationGateConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  domainId: z.enum(CERTIFICATION_DOMAINS),
  checkIds: z.array(z.string()).min(1),
  requiredForProduction: z.boolean(),
  gateOrder: z.number().int().min(0),
});

export const PLATFORM_INTEGRITY_RULE_KINDS = [
  "ownership",
  "dependency",
  "programme",
  "module",
  "subsystem",
  "drift",
] as const;

export type PlatformIntegrityRuleKind = (typeof PLATFORM_INTEGRITY_RULE_KINDS)[number];

export const platformIntegrityRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(PLATFORM_INTEGRITY_RULE_KINDS),
  subsystemId: z.string().min(1),
  canonicalOwner: z.string().min(1),
  forbiddenOwners: z.array(z.string()).default([]),
  allowedDependencies: z.array(z.string()).default([]),
  forbiddenDependencies: z.array(z.string()).default([]),
  programmeRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
  expectedProgrammeStatus: z.string().optional(),
  registryRef: z.string().optional(),
});

export const SECURITY_GOVERNANCE_RULE_KINDS = [
  "secret_handling",
  "credential_protection",
  "vault_integration",
  "workspace_isolation",
  "cross_workspace",
  "plugin_trust",
  "registry_integrity",
  "brain_boundary",
  "pillow_governance",
  "ekls_boundary",
  "cockpit_boundary",
  "automation_boundary",
  "commerce_boundary",
  "identity_boundary",
  "governance",
] as const;

export type SecurityGovernanceRuleKind = (typeof SECURITY_GOVERNANCE_RULE_KINDS)[number];

export const securityGovernanceRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(SECURITY_GOVERNANCE_RULE_KINDS),
  securityDomain: z.string().min(1),
  boundaryId: z.string().min(1),
  requiredGovernance: z.array(z.string()).default([]),
  forbiddenBypasses: z.array(z.string()).default([]),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
  workspaceScoped: z.boolean().default(true),
  pluginTrustRequired: z.boolean().default(false),
});

export const INFRASTRUCTURE_DEPLOYMENT_RULE_KINDS = [
  "hosting",
  "backend",
  "frontend",
  "database",
  "queue",
  "cache",
  "storage",
  "monitoring",
  "backup",
  "disaster_recovery",
  "deployment_topology",
  "scalability",
  "ssl",
  "dns",
  "email",
  "worker",
  "scheduler",
  "plugin_host",
  "secrets_management",
  "logging",
  "alerting",
  "api_layer",
] as const;

export type InfrastructureDeploymentRuleKind = (typeof INFRASTRUCTURE_DEPLOYMENT_RULE_KINDS)[number];

export const infrastructureDeploymentRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(INFRASTRUCTURE_DEPLOYMENT_RULE_KINDS),
  infrastructureDomain: z.string().min(1),
  serviceId: z.string().min(1),
  readinessSignals: z.array(z.string()).default([]),
  forbiddenConditions: z.array(z.string()).default([]),
  deploymentProfileRef: z.string().optional(),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
  healthCheckKind: z.enum(["wired", "configured", "available"]).optional(),
});

export const OPERATIONAL_READINESS_RULE_KINDS = [
  "automation",
  "commerce",
  "marketplace_connection",
  "supplier_connection",
  "storefront_connection",
  "payment_connection",
  "identity_authorization",
  "monitoring",
  "alerting",
  "recovery",
  "observability",
  "queue_processing",
  "plugin_framework",
  "brain_availability",
  "pillow_governance",
  "ekls_availability",
  "registry_availability",
  "external_dependency",
  "provider",
] as const;

export type OperationalReadinessRuleKind = (typeof OPERATIONAL_READINESS_RULE_KINDS)[number];

export const operationalReadinessRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(OPERATIONAL_READINESS_RULE_KINDS),
  readinessDomain: z.string().min(1),
  serviceId: z.string().min(1),
  readinessSignals: z.array(z.string()).default([]),
  blockerConditions: z.array(z.string()).default([]),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
  providerRef: z.string().optional(),
});

export const BUSINESS_OPERATIONS_RULE_KINDS = [
  "marketplace",
  "supplier",
  "storefront",
  "payment",
  "logistics",
  "analytics",
  "workflow",
  "automation",
  "commerce",
  "customer_journey",
  "order_flow",
  "refund_flow",
  "inventory_flow",
  "executive_reporting",
  "business_engine_coordination",
] as const;

export type BusinessOperationsRuleKind = (typeof BUSINESS_OPERATIONS_RULE_KINDS)[number];

export const businessOperationsRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(BUSINESS_OPERATIONS_RULE_KINDS),
  businessDomain: z.string().min(1),
  serviceId: z.string().min(1),
  businessSignals: z.array(z.string()).default([]),
  blockerConditions: z.array(z.string()).default([]),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
  providerRef: z.string().optional(),
});

export const PERFORMANCE_CERTIFICATION_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
] as const;

export type PerformanceCertificationResultState = (typeof PERFORMANCE_CERTIFICATION_RESULT_STATES)[number];

export const PERFORMANCE_CERTIFICATION_RULE_KINDS = [
  "api_performance",
  "brain_performance",
  "database_performance",
  "queue_throughput",
  "registry_lookup",
  "plugin_performance",
  "cockpit_performance",
  "workflow_throughput",
  "memory_usage",
  "cpu_utilisation",
  "horizontal_scalability",
  "recovery_speed",
  "recovery_success",
  "failover_readiness",
  "resilience",
] as const;

export type PerformanceCertificationRuleKind = (typeof PERFORMANCE_CERTIFICATION_RULE_KINDS)[number];

export const performanceCertificationRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(PERFORMANCE_CERTIFICATION_RULE_KINDS),
  performanceDomain: z.string().min(1),
  serviceId: z.string().min(1),
  benchmarkSignals: z.array(z.string()).default([]),
  failureConditions: z.array(z.string()).default([]),
  targetLatencyMs: z.number().positive().optional(),
  targetThroughput: z.number().positive().optional(),
  targetUtilisationPercent: z.number().min(0).max(100).optional(),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
});

export const EXECUTIVE_OPERATIONS_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
] as const;

export type ExecutiveOperationsResultState = (typeof EXECUTIVE_OPERATIONS_RESULT_STATES)[number];

export const EXECUTIVE_OPERATIONS_RULE_KINDS = [
  "cockpit_operations",
  "executive_home",
  "command_centre",
  "automation_centre",
  "authorization_centre",
  "relationship_graph",
  "global_ai_assistant",
  "approval_flow",
  "executive_reporting",
  "decision_visibility",
  "readiness_visibility",
  "automation_visibility",
  "commerce_visibility",
  "risk_visibility",
  "executive_action_safety",
] as const;

export type ExecutiveOperationsRuleKind = (typeof EXECUTIVE_OPERATIONS_RULE_KINDS)[number];

export const executiveOperationsRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(EXECUTIVE_OPERATIONS_RULE_KINDS),
  executiveDomain: z.string().min(1),
  serviceId: z.string().min(1),
  executiveSignals: z.array(z.string()).default([]),
  failureConditions: z.array(z.string()).default([]),
  cockpitRouteRef: z.string().optional(),
  expectedScreenId: z.string().optional(),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
});

export const FAILURE_RECOVERY_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
] as const;

export type FailureRecoveryResultState = (typeof FAILURE_RECOVERY_RESULT_STATES)[number];

export const FAILURE_RECOVERY_RULE_KINDS = [
  "failure_detection",
  "failure_classification",
  "incident_classification",
  "recovery_path",
  "rollback_path",
  "retry_behaviour",
  "escalation_behaviour",
  "guardian_event_capture",
  "pillow_governance",
  "ekls_evidence_capture",
  "automation_recovery",
  "commerce_recovery",
  "infrastructure_recovery",
  "plugin_recovery",
  "executive_visibility",
] as const;

export type FailureRecoveryRuleKind = (typeof FAILURE_RECOVERY_RULE_KINDS)[number];

export const failureRecoveryRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(FAILURE_RECOVERY_RULE_KINDS),
  certificationDomain: z.string().min(1),
  serviceId: z.string().min(1),
  recoverySignals: z.array(z.string()).default([]),
  failureConditions: z.array(z.string()).default([]),
  recoveryPathRef: z.string().optional(),
  rollbackPathRef: z.string().optional(),
  escalationRouteRef: z.string().optional(),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
});

export const PRODUCTION_SIMULATION_TYPES = [
  "dry_run",
  "sandbox",
  "mocked",
  "replay",
  "synthetic",
  "safe_live_check",
  "future_simulation_type",
] as const;

export type ProductionSimulationType = (typeof PRODUCTION_SIMULATION_TYPES)[number];

export const PRODUCTION_SIMULATION_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
  "not_applicable",
  "unknown",
] as const;

export type ProductionSimulationResultState = (typeof PRODUCTION_SIMULATION_RESULT_STATES)[number];

export const PRODUCTION_SIMULATION_SCENARIO_KINDS = [
  "grand_king_login",
  "cockpit_access",
  "executive_dashboard",
  "authorization_readiness",
  "commerce_readiness",
  "marketplace_operation",
  "supplier_operation",
  "storefront_operation",
  "payment_flow",
  "logistics_flow",
  "analytics_flow",
  "automation_workflow",
  "approval_flow",
  "recovery_flow",
  "incident_flow",
  "executive_reporting",
] as const;

export type ProductionSimulationScenarioKind = (typeof PRODUCTION_SIMULATION_SCENARIO_KINDS)[number];

export const productionSimulationScenarioConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  scenarioKind: z.enum(PRODUCTION_SIMULATION_SCENARIO_KINDS),
  simulationDomain: z.string().min(1),
  serviceId: z.string().min(1),
  defaultSimulationType: z.enum(PRODUCTION_SIMULATION_TYPES),
  simulationStepRefs: z.array(z.string()).default([]),
  safetySignals: z.array(z.string()).default([]),
  blockerConditions: z.array(z.string()).default([]),
  registryRef: z.string().optional(),
  moduleResolverRef: z.string().optional(),
  cockpitRouteRef: z.string().optional(),
});

export const FINAL_READINESS_RULE_KINDS = [
  "platform_integrity",
  "security_governance",
  "infrastructure_deployment",
  "operational_readiness",
  "business_operations",
  "performance_scalability",
  "executive_operations",
  "failure_recovery",
  "production_simulation",
  "evidence_completeness",
  "risk_register",
  "blocker_register",
  "production_eligibility",
  "grand_king_readiness",
] as const;

export type FinalReadinessRuleKind = (typeof FINAL_READINESS_RULE_KINDS)[number];

export const finalReadinessRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(CERTIFICATION_REGISTRY_VERSION),
  ruleKind: z.enum(FINAL_READINESS_RULE_KINDS),
  certificationDomain: z.string().min(1),
  missionRef: z.string().min(1),
  scanResolverRef: z.string().min(1),
  artifactRef: z.string().optional(),
  auditMissionRefs: z.array(z.string()).default([]),
});
