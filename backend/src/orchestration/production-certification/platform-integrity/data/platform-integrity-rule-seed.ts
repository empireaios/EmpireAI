/**
 * G6-01 — Platform integrity rule seed (REG-CERTIFICATION-INTEGRITY).
 * Registry-driven ownership, dependency, and programme rules — no hardcoded assumptions in validators.
 */

import {
  CERTIFICATION_REGISTRY_VERSION,
  type CertificationRegistryRowBase,
} from "../../../../registry/types/certification-registry-types.js";

function integrityRow(input: {
  id: string;
  name: string;
  ruleKind: "ownership" | "dependency" | "programme" | "module" | "subsystem" | "drift";
  subsystemId: string;
  canonicalOwner: string;
  forbiddenOwners?: string[];
  allowedDependencies?: string[];
  forbiddenDependencies?: string[];
  programmeRef?: string;
  moduleResolverRef?: string;
  expectedProgrammeStatus?: string;
  registryRef?: string;
}): CertificationRegistryRowBase {
  return {
    id: input.id,
    name: input.name,
    description: `Platform integrity ${input.ruleKind} rule for ${input.subsystemId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: input.allowedDependencies ?? [],
    capabilities: ["integrity-validate"],
    configuration: {
      platformIntegrityRule: {
        schemaVersion: CERTIFICATION_REGISTRY_VERSION,
        ruleKind: input.ruleKind,
        subsystemId: input.subsystemId,
        canonicalOwner: input.canonicalOwner,
        forbiddenOwners: input.forbiddenOwners ?? [],
        allowedDependencies: input.allowedDependencies ?? [],
        forbiddenDependencies: input.forbiddenDependencies ?? [],
        programmeRef: input.programmeRef,
        moduleResolverRef: input.moduleResolverRef,
        expectedProgrammeStatus: input.expectedProgrammeStatus,
        registryRef: input.registryRef,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CERTIFICATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-CERTIFICATION-INTEGRITY rows" },
  };
}

export const PLATFORM_INTEGRITY_RULE_SEED_ROWS: CertificationRegistryRowBase[] = [
  integrityRow({
    id: "pint-rule-ownership-commerce",
    name: "Commerce ownership boundary",
    ruleKind: "ownership",
    subsystemId: "commerce",
    canonicalOwner: "infrastructure-commerce",
    forbiddenOwners: ["brain", "pillow", "ekls", "grand-king-cockpit", "business-automation"],
  }),
  integrityRow({
    id: "pint-rule-ownership-automation",
    name: "Automation ownership boundary",
    ruleKind: "ownership",
    subsystemId: "automation",
    canonicalOwner: "business-automation",
    forbiddenOwners: ["infrastructure-commerce", "grand-king-cockpit", "ekls"],
  }),
  integrityRow({
    id: "pint-rule-ownership-pillow",
    name: "Pillow governance ownership",
    ruleKind: "ownership",
    subsystemId: "pillow",
    canonicalOwner: "pillow",
    forbiddenOwners: ["infrastructure-commerce", "business-automation", "brain"],
  }),
  integrityRow({
    id: "pint-rule-ownership-brain",
    name: "Brain execution ownership",
    ruleKind: "ownership",
    subsystemId: "brain",
    canonicalOwner: "brain",
    forbiddenOwners: ["pillow", "ekls", "grand-king-cockpit"],
  }),
  integrityRow({
    id: "pint-rule-ownership-ekls",
    name: "EKLS memory ownership",
    ruleKind: "ownership",
    subsystemId: "ekls",
    canonicalOwner: "ekls",
    forbiddenOwners: ["infrastructure-commerce", "business-automation"],
  }),
  integrityRow({
    id: "pint-rule-ownership-registry",
    name: "Registry catalog ownership",
    ruleKind: "ownership",
    subsystemId: "registry",
    canonicalOwner: "registry",
    forbiddenOwners: ["infrastructure-commerce", "business-automation"],
    registryRef: "REG-DOCTRINE",
  }),
  integrityRow({
    id: "pint-rule-ownership-cockpit",
    name: "Cockpit presentation ownership",
    ruleKind: "ownership",
    subsystemId: "cockpit",
    canonicalOwner: "grand-king-cockpit",
    forbiddenOwners: ["infrastructure-commerce", "business-automation", "brain"],
  }),
  integrityRow({
    id: "pint-rule-ownership-identity",
    name: "Identity platform ownership",
    ruleKind: "ownership",
    subsystemId: "identity",
    canonicalOwner: "identity-registry",
    forbiddenOwners: ["infrastructure-commerce", "business-automation"],
  }),
  integrityRow({
    id: "pint-rule-ownership-plugin-framework",
    name: "Plugin framework ownership",
    ruleKind: "ownership",
    subsystemId: "plugin-framework",
    canonicalOwner: "registry",
    forbiddenOwners: ["infrastructure-commerce", "business-automation"],
  }),
  integrityRow({
    id: "pint-rule-dependency-commerce-brain",
    name: "Commerce consumes Brain — never owns execution",
    ruleKind: "dependency",
    subsystemId: "commerce",
    canonicalOwner: "infrastructure-commerce",
    allowedDependencies: ["brain", "pillow", "ekls", "registry", "guardian"],
    forbiddenDependencies: ["grand-king-cockpit", "business-automation"],
  }),
  integrityRow({
    id: "pint-rule-dependency-automation-brain",
    name: "Automation consumes Brain — never owns orchestration DAG in commerce",
    ruleKind: "dependency",
    subsystemId: "automation",
    canonicalOwner: "business-automation",
    allowedDependencies: ["brain", "pillow", "ekls", "registry", "guardian"],
    forbiddenDependencies: ["grand-king-cockpit"],
  }),
  integrityRow({
    id: "pint-rule-programme-g2",
    name: "G2 programme module integrity",
    ruleKind: "programme",
    subsystemId: "programme-g2",
    canonicalOwner: "infrastructure-commerce",
    programmeRef: "G2",
    moduleResolverRef: "resolve:infrastructure-commerce-module",
    expectedProgrammeStatus: "production-certified",
  }),
  integrityRow({
    id: "pint-rule-programme-g5",
    name: "G5 programme module integrity",
    ruleKind: "programme",
    subsystemId: "programme-g5",
    canonicalOwner: "business-automation",
    programmeRef: "G5",
    moduleResolverRef: "resolve:business-automation-module",
    expectedProgrammeStatus: "certified",
  }),
  integrityRow({
    id: "pint-rule-programme-g6",
    name: "G6 programme module integrity",
    ruleKind: "programme",
    subsystemId: "programme-g6",
    canonicalOwner: "production-certification",
    programmeRef: "G6",
    moduleResolverRef: "resolve:production-certification-module",
    expectedProgrammeStatus: "production-readiness-certified",
  }),
  integrityRow({
    id: "pint-rule-programme-g3",
    name: "G3 intelligence orchestrator integrity",
    ruleKind: "programme",
    subsystemId: "programme-g3",
    canonicalOwner: "executive-intelligence-orchestrator",
    programmeRef: "G3",
    moduleResolverRef: "resolve:executive-intelligence-orchestrator-module",
  }),
  integrityRow({
    id: "pint-rule-module-identity",
    name: "Identity module integrity",
    ruleKind: "module",
    subsystemId: "identity-registry",
    canonicalOwner: "identity-registry",
    moduleResolverRef: "resolve:identity-registry-module",
  }),
  integrityRow({
    id: "pint-rule-subsystem-business-engines",
    name: "Business engine subsystem boundary",
    ruleKind: "subsystem",
    subsystemId: "business-engines",
    canonicalOwner: "business-engines",
    allowedDependencies: ["brain", "registry", "pillow"],
    forbiddenDependencies: ["grand-king-cockpit"],
  }),
  integrityRow({
    id: "pint-rule-drift-no-cockpit-in-commerce",
    name: "Architectural drift — commerce must not embed cockpit",
    ruleKind: "drift",
    subsystemId: "commerce",
    canonicalOwner: "infrastructure-commerce",
    forbiddenDependencies: ["grand-king-cockpit"],
  }),
  integrityRow({
    id: "pint-rule-drift-no-governance-in-engines",
    name: "Architectural drift — engines must not own governance",
    ruleKind: "drift",
    subsystemId: "business-engines",
    canonicalOwner: "business-engines",
    forbiddenOwners: ["pillow", "ekls"],
  }),
];
