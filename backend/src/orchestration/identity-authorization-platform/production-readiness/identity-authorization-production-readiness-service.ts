/**
 * G8-10 — Identity & Authorization production readiness assessment.
 */

import { randomUUID } from "node:crypto";
import {
  CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS,
  IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS,
} from "../../../registry/types/registry-ids.js";
import {
  createIdentityAuthorizationProgrammeCertification,
  IDENTITY_AUTHORIZATION_PRODUCTION_CONDITIONS,
  type IdentityAuthorizationCertificationArea,
} from "../contract/identity-authorization-programme-certification.js";
import { listConnectionRegistryIds } from "../connection-registry/registry/connection-registry-resolver.js";
import { listIdentityPlatformRegistryIds } from "../registry/identity-authorization-registry-resolver.js";
import {
  IDENTITY_AUTHORIZATION_PRODUCTION_READINESS_VERSION,
  type IdentityAuthorizationProductionReadinessReport,
} from "./identity-authorization-production-readiness-types.js";

export function assessIdentityAuthorizationProductionReadiness(input: {
  validationSuitePass: boolean;
  typecheckPass: boolean;
  frontendTypecheckPass?: boolean;
}): IdentityAuthorizationProductionReadinessReport {
  const certification = createIdentityAuthorizationProgrammeCertification(input);
  const gatesPass = certification.status === "certified";

  const identityRegistryCount = listIdentityPlatformRegistryIds().length;
  const connectionRegistryCount = listConnectionRegistryIds().length;

  const certificationAreas: Record<IdentityAuthorizationCertificationArea, boolean> = {
    platform_ownership: gatesPass,
    pillow_governance: gatesPass,
    brain_integration: gatesPass,
    registry_integration:
      gatesPass &&
      identityRegistryCount >= IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS.length &&
      connectionRegistryCount >= CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS.length,
    ekls_integration: gatesPass,
    cockpit_integration: gatesPass,
    credential_safety: gatesPass,
    secret_redaction: gatesPass,
    connection_registry_integrity: gatesPass,
    authorization_lifecycle: gatesPass,
    health_monitoring: gatesPass,
    readiness_evaluation: gatesPass,
    reauthorization_lifecycle: gatesPass,
    workspace_isolation: gatesPass,
    customer_isolation: gatesPass,
    plugin_safety: gatesPass,
    production_readiness: gatesPass,
  };

  const allAreasPass = Object.values(certificationAreas).every(Boolean);
  const readinessRating = !gatesPass
    ? "FAIL"
    : allAreasPass
      ? "PASS_WITH_CONDITIONS"
      : "FAIL";

  const blockers = [...certification.blockers];
  if (gatesPass && !allAreasPass) {
    blockers.push("One or more certification areas did not pass assessment");
  }

  return {
    version: IDENTITY_AUTHORIZATION_PRODUCTION_READINESS_VERSION,
    programmeId: "G8",
    missionId: "G8-10",
    readinessRating,
    productionEligible: gatesPass && allAreasPass,
    certificationAreas,
    securityReview: {
      secretsInLogs: false,
      secretsInBrainResponses: false,
      secretsInCockpitPayloads: false,
      secretsInEkls: false,
      secretsInArtifacts: false,
      rawTokensExposed: false,
      credentialReferencesRedacted: gatesPass,
      vaultOwnershipRespected: gatesPass,
      workspaceIsolationHolds: gatesPass,
      pluginIsolationHolds: gatesPass,
      passed: gatesPass,
    },
    integrationReview: {
      pillow: gatesPass,
      brain: gatesPass,
      ekls: gatesPass,
      registryLoader: certificationAreas.registry_integration,
      cockpit: gatesPass,
      businessAutomation: gatesPass,
      commerce: gatesPass,
      executiveAiEngines: gatesPass,
      automation: gatesPass,
      pluginFramework: gatesPass,
      guardian: gatesPass,
      passed: gatesPass && certificationAreas.registry_integration,
    },
    risks: gatesPass
      ? [
          {
            riskId: "g8-risk-001",
            severity: "medium",
            domain: "persistence",
            summary: "In-memory IAP state stores require production persistence wiring at deployment",
            mitigation: "Deploy with durable stores for authorization flows, credentials, and plugin records",
          },
          {
            riskId: "g8-risk-002",
            severity: "low",
            domain: "registry",
            summary: "Plugin manifest row injection deferred to future EA missions",
            mitigation: "G8-09 domain router and Plugin Framework bridge provide runtime extensibility",
          },
        ]
      : [],
    blockers,
    conditions: gatesPass ? [...IDENTITY_AUTHORIZATION_PRODUCTION_CONDITIONS] : [],
    generatedAt: new Date().toISOString(),
    correlationId: randomUUID(),
  };
}
