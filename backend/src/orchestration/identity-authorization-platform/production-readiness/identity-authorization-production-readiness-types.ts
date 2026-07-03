/**
 * G8-10 — Identity & Authorization production readiness report types.
 */

import type {
  IdentityAuthorizationCertificationArea,
  IdentityAuthorizationReadinessRating,
} from "../contract/identity-authorization-programme-certification.js";

export const IDENTITY_AUTHORIZATION_PRODUCTION_READINESS_VERSION = "g8-10-v1" as const;

export type IdentityAuthorizationRiskEntry = {
  riskId: string;
  severity: "low" | "medium" | "high";
  domain: string;
  summary: string;
  mitigation: string;
};

export type IdentityAuthorizationSecurityReview = {
  secretsInLogs: boolean;
  secretsInBrainResponses: boolean;
  secretsInCockpitPayloads: boolean;
  secretsInEkls: boolean;
  secretsInArtifacts: boolean;
  rawTokensExposed: boolean;
  credentialReferencesRedacted: boolean;
  vaultOwnershipRespected: boolean;
  workspaceIsolationHolds: boolean;
  pluginIsolationHolds: boolean;
  passed: boolean;
};

export type IdentityAuthorizationIntegrationReview = {
  pillow: boolean;
  brain: boolean;
  ekls: boolean;
  registryLoader: boolean;
  cockpit: boolean;
  businessAutomation: boolean;
  commerce: boolean;
  executiveAiEngines: boolean;
  automation: boolean;
  pluginFramework: boolean;
  guardian: boolean;
  passed: boolean;
};

export type IdentityAuthorizationProductionReadinessReport = {
  version: typeof IDENTITY_AUTHORIZATION_PRODUCTION_READINESS_VERSION;
  programmeId: "G8";
  missionId: "G8-10";
  readinessRating: IdentityAuthorizationReadinessRating;
  productionEligible: boolean;
  certificationAreas: Record<IdentityAuthorizationCertificationArea, boolean>;
  securityReview: IdentityAuthorizationSecurityReview;
  integrationReview: IdentityAuthorizationIntegrationReview;
  risks: IdentityAuthorizationRiskEntry[];
  blockers: string[];
  conditions: string[];
  generatedAt: string;
  correlationId: string;
};
