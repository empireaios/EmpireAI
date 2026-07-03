/**
 * G7-01 — Readiness policy seed (REG-READINESS-POLICY).
 */

import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export const READINESS_POLICY_SEED_ROWS: ProductionWorkspaceRegistryRowBase[] = [
  {
    id: "readiness-policy-grand-king-production",
    name: "Grand King production readiness policy",
    description: "Registry-driven readiness policy for Grand King production workspace",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CERTIFICATION-FINAL-READINESS"],
    capabilities: ["readiness-evaluate"],
    configuration: {
      readinessPolicy: {
        schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION,
        policyId: "readiness-policy-grand-king-production",
        policyName: "Grand King Production Readiness",
        readinessSignals: [
          "signal:g6-production-ready",
          "signal:live-operations-framework",
          "signal:workspace-configured",
        ],
        blockerConditions: ["production_not_eligible", "workspace_blocked", "missing_certification"],
        certificationProgrammeRef: "G6",
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Extensible via REG-READINESS-POLICY rows" },
  },
];
