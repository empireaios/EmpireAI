/**
 * G6-02 — Security & governance rule seed (REG-CERTIFICATION-SECURITY).
 * Registry-driven security policies — no hardcoded assumptions in validators.
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";

function securityRow(input: {
  id: string;
  name: string;
  ruleKind:
    | "secret_handling"
    | "credential_protection"
    | "vault_integration"
    | "workspace_isolation"
    | "cross_workspace"
    | "plugin_trust"
    | "registry_integrity"
    | "brain_boundary"
    | "pillow_governance"
    | "ekls_boundary"
    | "cockpit_boundary"
    | "automation_boundary"
    | "commerce_boundary"
    | "identity_boundary"
    | "governance";
  securityDomain: string;
  boundaryId: string;
  requiredGovernance?: string[];
  forbiddenBypasses?: string[];
  registryRef?: string;
  moduleResolverRef?: string;
  workspaceScoped?: boolean;
  pluginTrustRequired?: boolean;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Security governance ${input.ruleKind} rule for ${input.securityDomain}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.requiredGovernance ?? [],
    capabilities: ["security-validate"],
    configuration: {
      securityGovernanceRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        securityDomain: input.securityDomain,
        boundaryId: input.boundaryId,
        requiredGovernance: input.requiredGovernance ?? [],
        forbiddenBypasses: input.forbiddenBypasses ?? [],
        registryRef: input.registryRef,
        moduleResolverRef: input.moduleResolverRef,
        workspaceScoped: input.workspaceScoped ?? true,
        pluginTrustRequired: input.pluginTrustRequired ?? false,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-SECURITY rows" },
  };
}

export const SECURITY_GOVERNANCE_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  securityRow({
    id: "secgov-rule-secret-handling",
    name: "Secret handling redaction policy",
    ruleKind: "secret_handling",
    securityDomain: "secret_handling",
    boundaryId: "certification-evidence",
    requiredGovernance: ["pillow"],
    forbiddenBypasses: ["unsafe_logging", "unsafe_artifacts"],
  }),
  securityRow({
    id: "secgov-rule-credential-protection",
    name: "Credential protection boundary",
    ruleKind: "credential_protection",
    securityDomain: "credential_protection",
    boundaryId: "platform-credentials",
    requiredGovernance: ["pillow", "ekls"],
    forbiddenBypasses: ["credential_leakage", "token_exposure", "hardcoded_credentials"],
  }),
  securityRow({
    id: "secgov-rule-vault-integration",
    name: "Vault integration governance",
    ruleKind: "vault_integration",
    securityDomain: "vault_integration",
    boundaryId: "vault-gateway",
    requiredGovernance: ["pillow"],
    forbiddenBypasses: ["vault_bypass"],
  }),
  securityRow({
    id: "secgov-rule-workspace-isolation",
    name: "Workspace isolation boundary",
    ruleKind: "workspace_isolation",
    securityDomain: "workspace_isolation",
    boundaryId: "workspace-scope",
    requiredGovernance: ["pillow"],
    forbiddenBypasses: ["cross_workspace_leakage"],
    workspaceScoped: true,
  }),
  securityRow({
    id: "secgov-rule-cross-workspace",
    name: "Cross-workspace isolation",
    ruleKind: "cross_workspace",
    securityDomain: "cross_workspace_isolation",
    boundaryId: "tenant-boundary",
    requiredGovernance: ["pillow", "registry"],
    forbiddenBypasses: ["cross_workspace_leakage", "cross_provider_leakage"],
    workspaceScoped: true,
  }),
  securityRow({
    id: "secgov-rule-plugin-trust",
    name: "Plugin trust validation",
    ruleKind: "plugin_trust",
    securityDomain: "plugin_trust",
    boundaryId: "plugin-framework",
    requiredGovernance: ["pillow", "registry"],
    forbiddenBypasses: ["plugin_privilege_escalation", "unauthorized_execution"],
    pluginTrustRequired: true,
  }),
  securityRow({
    id: "secgov-rule-registry-integrity",
    name: "Registry compliance integrity",
    ruleKind: "registry_integrity",
    securityDomain: "registry_integrity",
    boundaryId: "registry-catalog",
    requiredGovernance: ["pillow"],
    forbiddenBypasses: ["registry_bypass"],
    registryRef: "REG-DOCTRINE",
  }),
  securityRow({
    id: "secgov-rule-brain-boundary",
    name: "Brain execution boundary",
    ruleKind: "brain_boundary",
    securityDomain: "brain_execution_boundary",
    boundaryId: "brain",
    requiredGovernance: ["pillow"],
    forbiddenBypasses: ["brain_bypass", "unauthorized_execution"],
    moduleResolverRef: "resolve:production-certification-module",
  }),
  securityRow({
    id: "secgov-rule-pillow-governance",
    name: "Pillow governance enforcement",
    ruleKind: "pillow_governance",
    securityDomain: "pillow_governance",
    boundaryId: "pillow",
    requiredGovernance: ["pillow"],
    forbiddenBypasses: ["pillow_bypass"],
  }),
  securityRow({
    id: "secgov-rule-ekls-boundary",
    name: "EKLS ownership boundary",
    ruleKind: "ekls_boundary",
    securityDomain: "ekls_ownership",
    boundaryId: "ekls",
    requiredGovernance: ["pillow", "ekls"],
    forbiddenBypasses: ["ekls_bypass"],
  }),
  securityRow({
    id: "secgov-rule-cockpit-boundary",
    name: "Cockpit presentation boundary",
    ruleKind: "cockpit_boundary",
    securityDomain: "cockpit_presentation_boundary",
    boundaryId: "grand-king-cockpit",
    requiredGovernance: ["pillow"],
    forbiddenBypasses: ["credential_leakage", "unsafe_artifacts"],
  }),
  securityRow({
    id: "secgov-rule-automation-boundary",
    name: "Business automation security boundary",
    ruleKind: "automation_boundary",
    securityDomain: "business_automation_boundary",
    boundaryId: "business-automation",
    requiredGovernance: ["pillow", "brain"],
    forbiddenBypasses: ["brain_bypass", "unauthorized_execution"],
    moduleResolverRef: "resolve:business-automation-module",
  }),
  securityRow({
    id: "secgov-rule-commerce-boundary",
    name: "Commerce security boundary",
    ruleKind: "commerce_boundary",
    securityDomain: "commerce_boundary",
    boundaryId: "infrastructure-commerce",
    requiredGovernance: ["pillow", "brain", "ekls"],
    forbiddenBypasses: ["credential_leakage", "vault_bypass"],
    moduleResolverRef: "resolve:infrastructure-commerce-module",
  }),
  securityRow({
    id: "secgov-rule-identity-boundary",
    name: "Identity authorization boundary",
    ruleKind: "identity_boundary",
    securityDomain: "identity_boundary",
    boundaryId: "identity-registry",
    requiredGovernance: ["pillow", "registry"],
    forbiddenBypasses: ["unauthorized_execution", "token_exposure"],
    moduleResolverRef: "resolve:identity-registry-module",
  }),
  securityRow({
    id: "secgov-rule-governance-aggregate",
    name: "Constitutional governance aggregate",
    ruleKind: "governance",
    securityDomain: "constitutional_governance",
    boundaryId: "empire-platform",
    requiredGovernance: ["pillow", "ekls", "brain", "registry"],
    forbiddenBypasses: ["pillow_bypass", "brain_bypass", "ekls_bypass", "registry_bypass"],
  }),
];
