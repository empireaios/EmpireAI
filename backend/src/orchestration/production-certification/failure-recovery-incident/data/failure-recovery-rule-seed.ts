/**
 * G6-08 — Failure recovery certification rule seed (REG-CERTIFICATION-FAILURE-RECOVERY).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";
import type { FailureRecoveryRuleKind } from "../../../../registry/types/certification-registry-types.js";

function failureRecoveryRow(input: {
  id: string;
  name: string;
  ruleKind: FailureRecoveryRuleKind;
  certificationDomain: string;
  serviceId: string;
  recoverySignals?: string[];
  failureConditions?: string[];
  recoveryPathRef?: string;
  rollbackPathRef?: string;
  escalationRouteRef?: string;
  registryRef?: string;
  moduleResolverRef?: string;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Failure recovery certification ${input.ruleKind} rule for ${input.certificationDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.recoverySignals ?? [],
    capabilities: ["failure-recovery-validate"],
    configuration: {
      failureRecoveryRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        certificationDomain: input.certificationDomain,
        serviceId: input.serviceId,
        recoverySignals: input.recoverySignals ?? [],
        failureConditions: input.failureConditions ?? [],
        recoveryPathRef: input.recoveryPathRef,
        rollbackPathRef: input.rollbackPathRef,
        escalationRouteRef: input.escalationRouteRef,
        registryRef: input.registryRef,
        moduleResolverRef: input.moduleResolverRef,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-FAILURE-RECOVERY rows" },
  };
}

export const FAILURE_RECOVERY_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  failureRecoveryRow({
    id: "fri-rule-failure-detection",
    name: "Failure detection certification",
    ruleKind: "failure_detection",
    certificationDomain: "failure_detection",
    serviceId: "platform-monitoring",
    recoverySignals: ["signal:failure-detection-ready"],
    failureConditions: ["silent_failure", "unreported_failure"],
  }),
  failureRecoveryRow({
    id: "fri-rule-failure-classification",
    name: "Failure classification certification",
    ruleKind: "failure_classification",
    certificationDomain: "failure_classification",
    serviceId: "incident-classifier",
    recoverySignals: ["signal:incident-classification-ready"],
    failureConditions: ["missing_incident_classification"],
  }),
  failureRecoveryRow({
    id: "fri-rule-incident-classification",
    name: "Incident classification certification",
    ruleKind: "incident_classification",
    certificationDomain: "incident_classification",
    serviceId: "incident-classifier",
    recoverySignals: ["signal:incident-classification-ready", "signal:ekls-evidence-ready"],
    failureConditions: ["missing_incident_classification", "missing_ekls_evidence"],
  }),
  failureRecoveryRow({
    id: "fri-rule-recovery-path",
    name: "Recovery path certification",
    ruleKind: "recovery_path",
    certificationDomain: "recovery_paths",
    serviceId: "operational-recovery",
    recoverySignals: ["signal:recovery-path-ready"],
    failureConditions: ["missing_recovery_path"],
    recoveryPathRef: "recovery:operational-default",
    registryRef: "REG-AUTOMATION-RECOVERY",
  }),
  failureRecoveryRow({
    id: "fri-rule-rollback-path",
    name: "Rollback path certification",
    ruleKind: "rollback_path",
    certificationDomain: "rollback_paths",
    serviceId: "deployment-rollback",
    recoverySignals: ["signal:rollback-path-ready", "signal:rollback-safe"],
    failureConditions: ["missing_rollback_path", "unsafe_rollback"],
    rollbackPathRef: "rollback:deployment-default",
    registryRef: "REG-DEPLOYMENT-PROFILE",
  }),
  failureRecoveryRow({
    id: "fri-rule-retry-behaviour",
    name: "Retry behaviour certification",
    ruleKind: "retry_behaviour",
    certificationDomain: "retry_behaviour",
    serviceId: "job-queue",
    recoverySignals: ["signal:retry-safe"],
    failureConditions: ["unsafe_retry"],
  }),
  failureRecoveryRow({
    id: "fri-rule-escalation",
    name: "Escalation behaviour certification",
    ruleKind: "escalation_behaviour",
    certificationDomain: "escalation_behaviour",
    serviceId: "pillow-governance",
    recoverySignals: ["signal:escalation-route-ready", "signal:guardian-escalation-event"],
    failureConditions: ["missing_escalation_route", "unrecoverable_without_escalation", "manual_intervention_required"],
    escalationRouteRef: "escalation:pillow-supervisor",
  }),
  failureRecoveryRow({
    id: "fri-rule-guardian-events",
    name: "Guardian event capture certification",
    ruleKind: "guardian_event_capture",
    certificationDomain: "guardian_event_capture",
    serviceId: "guardian",
    recoverySignals: [
      "signal:guardian-failure-event",
      "signal:guardian-recovery-event",
      "signal:guardian-rollback-event",
      "signal:guardian-incident-event",
      "signal:guardian-escalation-event",
    ],
    failureConditions: ["missing_guardian_event"],
    moduleResolverRef: "resolve:guardian-recovery-bridge",
  }),
  failureRecoveryRow({
    id: "fri-rule-pillow-governance",
    name: "Pillow governance certification",
    ruleKind: "pillow_governance",
    certificationDomain: "pillow_governance",
    serviceId: "pillow-governance",
    recoverySignals: ["signal:ekls-evidence-ready"],
    failureConditions: ["missing_ekls_evidence"],
  }),
  failureRecoveryRow({
    id: "fri-rule-ekls-evidence",
    name: "EKLS evidence capture certification",
    ruleKind: "ekls_evidence_capture",
    certificationDomain: "ekls_evidence_capture",
    serviceId: "ekls",
    recoverySignals: ["signal:ekls-evidence-ready"],
    failureConditions: ["missing_ekls_evidence"],
  }),
  failureRecoveryRow({
    id: "fri-rule-automation-recovery",
    name: "Automation recovery certification",
    ruleKind: "automation_recovery",
    certificationDomain: "automation_recovery",
    serviceId: "business-automation",
    recoverySignals: ["signal:recovery-path-ready", "signal:automation-recovery-registry"],
    failureConditions: ["missing_recovery_path"],
    recoveryPathRef: "recovery:automation-workflow",
    registryRef: "REG-AUTOMATION-RECOVERY",
    moduleResolverRef: "resolve:business-automation-module",
  }),
  failureRecoveryRow({
    id: "fri-rule-commerce-recovery",
    name: "Commerce recovery certification",
    ruleKind: "commerce_recovery",
    certificationDomain: "commerce_recovery",
    serviceId: "infrastructure-commerce",
    recoverySignals: ["signal:recovery-path-ready", "signal:commerce-module"],
    failureConditions: ["missing_recovery_path"],
    recoveryPathRef: "recovery:commerce-order-flow",
    registryRef: "REG-PAYMENT",
    moduleResolverRef: "resolve:infrastructure-commerce-module",
  }),
  failureRecoveryRow({
    id: "fri-rule-infrastructure-recovery",
    name: "Infrastructure recovery certification",
    ruleKind: "infrastructure_recovery",
    certificationDomain: "infrastructure_recovery",
    serviceId: "deployment-scaler",
    recoverySignals: ["signal:recovery-path-ready", "signal:rollback-path-ready"],
    failureConditions: ["missing_recovery_path", "missing_rollback_path"],
    recoveryPathRef: "recovery:infrastructure-failover",
    rollbackPathRef: "rollback:infrastructure-deploy",
    registryRef: "REG-DEPLOYMENT-PROFILE",
  }),
  failureRecoveryRow({
    id: "fri-rule-plugin-recovery",
    name: "Plugin recovery certification",
    ruleKind: "plugin_recovery",
    certificationDomain: "plugin_recovery",
    serviceId: "plugin-runtime",
    recoverySignals: ["signal:recovery-path-ready", "signal:retry-safe"],
    failureConditions: ["missing_recovery_path", "unsafe_retry"],
    recoveryPathRef: "recovery:plugin-reload",
  }),
  failureRecoveryRow({
    id: "fri-rule-executive-visibility",
    name: "Executive incident visibility certification",
    ruleKind: "executive_visibility",
    certificationDomain: "executive_visibility",
    serviceId: "cockpit",
    recoverySignals: ["signal:executive-visibility-ready", "signal:incident-classification-ready"],
    failureConditions: ["unreported_failure", "silent_failure"],
  }),
];
