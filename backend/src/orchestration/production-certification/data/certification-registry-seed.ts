/**
 * G6-00 — Production certification registry seed (registry-driven — no hardcoded gates).
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  CERTIFICATION_DOMAINS,
  type CertificationDomainId,
  type CertificationRegistryRowBase,
} from "../../../registry/types/certification-registry-types.js";

export { PLATFORM_INTEGRITY_RULE_SEED_ROWS } from "../platform-integrity/data/platform-integrity-rule-seed.js";
export { SECURITY_GOVERNANCE_RULE_SEED_ROWS } from "../security-governance/data/security-governance-rule-seed.js";
export { INFRASTRUCTURE_DEPLOYMENT_RULE_SEED_ROWS } from "../infrastructure-deployment/data/infrastructure-deployment-rule-seed.js";
export { OPERATIONAL_READINESS_RULE_SEED_ROWS } from "../operational-readiness/data/operational-readiness-rule-seed.js";
export { BUSINESS_OPERATIONS_RULE_SEED_ROWS } from "../business-operations/data/business-operations-rule-seed.js";
export { PERFORMANCE_CERTIFICATION_RULE_SEED_ROWS } from "../performance-scalability-resilience/data/performance-certification-rule-seed.js";
export { EXECUTIVE_OPERATIONS_RULE_SEED_ROWS } from "../executive-operations/data/executive-operations-rule-seed.js";
export { FAILURE_RECOVERY_RULE_SEED_ROWS } from "../failure-recovery-incident/data/failure-recovery-rule-seed.js";
export { PRODUCTION_SIMULATION_SCENARIO_SEED_ROWS } from "../production-simulation/data/production-simulation-scenario-seed.js";
export { FINAL_READINESS_DOMAIN_SEED_ROWS } from "../final-production-readiness/data/final-readiness-domain-seed.js";

function baseRow(input: {
  id: string;
  name: string;
  description: string;
  configuration: Record<string, unknown>;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: [],
    capabilities: ["certify"],
    configuration: input.configuration,
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: false },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via registry rows — no core changes required" },
  };
}

const DOMAIN_LABELS: Record<CertificationDomainId, string> = {
  platform_integrity: "Platform Integrity",
  pillow_governance: "Pillow Governance",
  brain_execution: "Brain Execution",
  ekls_memory: "EKLS Memory",
  registry_compliance: "Registry Compliance",
  g2_commerce: "G2 Commerce",
  g3_intelligence: "G3 Intelligence",
  g4_cockpit: "G4 Cockpit",
  g5_automation: "G5 Automation",
  g8_identity_authorization: "G8 Identity & Authorization",
  security: "Security",
  infrastructure: "Infrastructure",
  production_deployment: "Production Deployment",
  operational_readiness: "Operational Readiness",
  business_operations: "Business Operations",
  performance_scalability_resilience: "Performance, Scalability & Resilience",
  executive_operations: "Executive Operations",
  failure_recovery_incident: "Failure, Recovery & Incident",
  production_simulation: "Production Simulation",
  grand_king_readiness: "Grand King Readiness",
  final_production_readiness: "Final Production Readiness",
};

export const CERTIFICATION_DOMAIN_SEED_ROWS: CertificationRegistryRowBase[] =
  CERTIFICATION_DOMAINS.map((domainId, index) =>
    baseRow({
      id: `cert-domain-${domainId}`,
      name: DOMAIN_LABELS[domainId],
      description: `Production certification domain: ${DOMAIN_LABELS[domainId]}`,
      configuration: {
        certificationDomain: {
          schemaVersion: CERTIFICATION_REGISTRY_VERSION,
          domainId,
          displayName: DOMAIN_LABELS[domainId],
          programmeRef: domainId.startsWith("g") ? domainId.split("_")[0]!.toUpperCase() : undefined,
          order: index,
        },
      },
    }),
  );

type CheckSeed = {
  id: string;
  domainId: CertificationDomainId;
  name: string;
  probeRef: string;
  severityDefault: "info" | "low" | "medium" | "high" | "critical";
  blockerOnFail: boolean;
  programmeRef?: string;
  artifactRef?: string;
  registryRef?: string;
  toolNames?: string[];
};

const CHECK_SEEDS: CheckSeed[] = [
  {
    id: "cert-check-platform-module-contracts",
    domainId: "platform_integrity",
    name: "Platform module contracts wired",
    probeRef: "probe:platform_integrity",
    severityDefault: "critical",
    blockerOnFail: true,
  },
  {
    id: "cert-check-platform-integrity-scan",
    domainId: "platform_integrity",
    name: "Platform integrity certification scan",
    probeRef: "probe:platform_integrity_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "platform_integrity_overview",
      "platform_integrity_scan",
      "ownership_matrix",
      "dependency_matrix",
      "architecture_drift_report",
      "platform_integrity_status",
    ],
  },
  {
    id: "cert-check-pillow-governance",
    domainId: "pillow_governance",
    name: "Pillow governance gateway operational",
    probeRef: "probe:pillow_governance",
    severityDefault: "critical",
    blockerOnFail: true,
  },
  {
    id: "cert-check-brain-tools",
    domainId: "brain_execution",
    name: "Production certification Brain tools registered",
    probeRef: "probe:brain_tools_registered",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "certification_overview",
      "run_certification_check",
      "run_certification_domain",
      "run_full_certification",
      "certification_status",
      "certification_blockers",
      "certification_risk_register",
      "certification_evidence",
    ],
  },
  {
    id: "cert-check-ekls-governance",
    domainId: "ekls_memory",
    name: "EKLS Pillow governance channel",
    probeRef: "probe:ekls_governance",
    severityDefault: "high",
    blockerOnFail: true,
  },
  {
    id: "cert-check-registry-resolution",
    domainId: "registry_compliance",
    name: "Certification registries resolve dynamically",
    probeRef: "probe:registry_resolution",
    severityDefault: "critical",
    blockerOnFail: true,
    registryRef: "REG-CERTIFICATION-CHECK",
  },
  {
    id: "cert-check-g2-programme",
    domainId: "g2_commerce",
    name: "G2 Infrastructure & Commerce production certified",
    probeRef: "probe:programme_module_contract",
    severityDefault: "critical",
    blockerOnFail: true,
    programmeRef: "G2",
    artifactRef: "g2-10-infrastructure-commerce-production-readiness-executive-audit.md",
  },
  {
    id: "cert-check-g3-programme",
    domainId: "g3_intelligence",
    name: "G3 Executive AI Engines architecture complete",
    probeRef: "probe:executive_audit_artifact",
    severityDefault: "high",
    blockerOnFail: false,
    programmeRef: "G3",
    artifactRef: "g3-10-executive-intelligence-orchestrator-executive-audit.md",
  },
  {
    id: "cert-check-g4-programme",
    domainId: "g4_cockpit",
    name: "G4 Grand King Cockpit production readiness",
    probeRef: "probe:executive_audit_artifact",
    severityDefault: "high",
    blockerOnFail: false,
    programmeRef: "G4",
    artifactRef: "g4-10-cockpit-production-readiness-executive-audit.md",
  },
  {
    id: "cert-check-g5-programme",
    domainId: "g5_automation",
    name: "G5 Business Automation programme certified",
    probeRef: "probe:programme_module_contract",
    severityDefault: "critical",
    blockerOnFail: true,
    programmeRef: "G5",
    artifactRef: "g5-10-business-automation-production-readiness-executive-audit.md",
  },
  {
    id: "cert-check-g8-identity",
    domainId: "g8_identity_authorization",
    name: "Identity registry module operational",
    probeRef: "probe:identity_module",
    severityDefault: "critical",
    blockerOnFail: true,
  },
  {
    id: "cert-check-security-redaction",
    domainId: "security",
    name: "Evidence secret redaction enforced",
    probeRef: "probe:security_redaction",
    severityDefault: "critical",
    blockerOnFail: true,
  },
  {
    id: "cert-check-security-governance-scan",
    domainId: "security",
    name: "Security & governance certification scan",
    probeRef: "probe:security_governance_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "security_overview",
      "security_scan",
      "governance_scan",
      "workspace_security",
      "plugin_security",
      "security_risk_register",
      "security_status",
    ],
  },
  {
    id: "cert-check-governance-scan",
    domainId: "pillow_governance",
    name: "Governance certification scan",
    probeRef: "probe:governance_scan",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-infrastructure-typecheck",
    domainId: "infrastructure",
    name: "Backend infrastructure type safety",
    probeRef: "probe:platform_integrity",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-infrastructure-deployment-scan",
    domainId: "infrastructure",
    name: "Infrastructure & deployment certification scan",
    probeRef: "probe:deployment_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "deployment_overview",
      "deployment_scan",
      "deployment_health",
      "deployment_readiness",
      "deployment_dependencies",
      "deployment_risk_register",
      "deployment_status",
    ],
  },
  {
    id: "cert-check-production-deployment",
    domainId: "production_deployment",
    name: "Production deployment eligibility gates",
    probeRef: "probe:production_eligibility",
    severityDefault: "high",
    blockerOnFail: true,
  },
  {
    id: "cert-check-deployment-health",
    domainId: "production_deployment",
    name: "Production deployment health check",
    probeRef: "probe:deployment_health",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-operational-readiness",
    domainId: "operational_readiness",
    name: "Operational readiness certification scan",
    probeRef: "probe:operational_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "operational_readiness",
      "operational_scan",
      "operational_blockers",
      "operational_score",
      "operational_dependencies",
      "operational_recommendations",
      "operational_status",
    ],
  },
  {
    id: "cert-check-operational-readiness-status",
    domainId: "operational_readiness",
    name: "Operational readiness aggregate status",
    probeRef: "probe:operational_readiness",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-business-operations-scan",
    domainId: "business_operations",
    name: "Business operations certification scan",
    probeRef: "probe:business_operations_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "business_operations_overview",
      "business_operations_scan",
      "business_operations_score",
      "business_operations_dependencies",
      "business_operations_risks",
      "business_operations_recommendations",
      "business_operations_status",
    ],
  },
  {
    id: "cert-check-business-operations-status",
    domainId: "business_operations",
    name: "Business operations aggregate status",
    probeRef: "probe:business_operations",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-performance-scan",
    domainId: "performance_scalability_resilience",
    name: "Performance, scalability & resilience certification scan",
    probeRef: "probe:performance_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "performance_overview",
      "performance_scan",
      "performance_score",
      "performance_bottlenecks",
      "performance_trends",
      "performance_recommendations",
      "performance_status",
    ],
  },
  {
    id: "cert-check-performance-status",
    domainId: "performance_scalability_resilience",
    name: "Performance aggregate status",
    probeRef: "probe:performance_status",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-executive-operations-scan",
    domainId: "executive_operations",
    name: "Executive operations certification scan",
    probeRef: "probe:executive_operations_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "executive_operations_overview",
      "executive_operations_scan",
      "executive_operations_score",
      "executive_operations_blockers",
      "executive_operations_risks",
      "executive_operations_recommendations",
      "executive_operations_status",
    ],
  },
  {
    id: "cert-check-executive-operations-status",
    domainId: "executive_operations",
    name: "Executive operations aggregate status",
    probeRef: "probe:executive_operations_status",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-failure-recovery-scan",
    domainId: "failure_recovery_incident",
    name: "Failure, recovery & incident certification scan",
    probeRef: "probe:failure_recovery_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "failure_recovery_overview",
      "failure_recovery_scan",
      "incident_status",
      "incident_risk_register",
      "recovery_path_validation",
      "rollback_path_validation",
      "failure_recovery_recommendations",
      "failure_recovery_status",
    ],
  },
  {
    id: "cert-check-failure-recovery-status",
    domainId: "failure_recovery_incident",
    name: "Failure recovery aggregate status",
    probeRef: "probe:failure_recovery_status",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-production-simulation-scan",
    domainId: "production_simulation",
    name: "Production simulation certification scan",
    probeRef: "probe:production_simulation_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "production_simulation_overview",
      "run_simulation_scenario",
      "run_full_production_simulation",
      "simulation_status",
      "simulation_evidence",
      "simulation_blockers",
      "simulation_recommendations",
    ],
  },
  {
    id: "cert-check-production-simulation-status",
    domainId: "production_simulation",
    name: "Production simulation aggregate status",
    probeRef: "probe:production_simulation_status",
    severityDefault: "high",
    blockerOnFail: false,
  },
  {
    id: "cert-check-grand-king-readiness",
    domainId: "grand_king_readiness",
    name: "Grand King live operations readiness aggregate",
    probeRef: "probe:production_eligibility",
    severityDefault: "critical",
    blockerOnFail: true,
  },
  {
    id: "cert-check-final-certification-scan",
    domainId: "final_production_readiness",
    name: "Final production readiness certification scan",
    probeRef: "probe:final_certification_scan",
    severityDefault: "critical",
    blockerOnFail: true,
    toolNames: [
      "final_production_readiness",
      "run_final_certification",
      "production_eligibility",
      "production_blockers",
      "production_conditions",
      "production_risk_register",
      "grand_king_readiness",
      "certification_completion_summary",
    ],
  },
  {
    id: "cert-check-final-certification-status",
    domainId: "final_production_readiness",
    name: "Final production readiness aggregate status",
    probeRef: "probe:final_certification_status",
    severityDefault: "high",
    blockerOnFail: false,
  },
];

export const CERTIFICATION_CHECK_SEED_ROWS: CertificationRegistryRowBase[] = CHECK_SEEDS.map(
  (check) =>
    baseRow({
      id: check.id,
      name: check.name,
      description: `Certification check for ${DOMAIN_LABELS[check.domainId]}`,
      configuration: {
        certificationCheck: {
          schemaVersion: CERTIFICATION_REGISTRY_VERSION,
          domainId: check.domainId,
          probeRef: check.probeRef,
          severityDefault: check.severityDefault,
          blockerOnFail: check.blockerOnFail,
          programmeRef: check.programmeRef,
          artifactRef: check.artifactRef,
          registryRef: check.registryRef,
          toolNames: check.toolNames,
        },
      },
    }),
);

export const CERTIFICATION_GATE_SEED_ROWS: CertificationRegistryRowBase[] =
  CERTIFICATION_DOMAINS.map((domainId, index) => {
    const checkIds = CHECK_SEEDS.filter((check) => check.domainId === domainId).map(
      (check) => check.id,
    );
    return baseRow({
      id: `cert-gate-${domainId}`,
      name: `${DOMAIN_LABELS[domainId]} Gate`,
      description: `Production certification gate for ${DOMAIN_LABELS[domainId]}`,
      configuration: {
        certificationGate: {
          schemaVersion: CERTIFICATION_REGISTRY_VERSION,
          domainId,
          checkIds: checkIds.length > 0 ? checkIds : [],
          requiredForProduction: [
            "platform_integrity",
            "pillow_governance",
            "brain_execution",
            "g2_commerce",
            "g5_automation",
            "security",
            "grand_king_readiness",
          ].includes(domainId),
          gateOrder: index,
        },
      },
    });
  });
