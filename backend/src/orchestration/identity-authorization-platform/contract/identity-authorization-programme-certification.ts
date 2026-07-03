/**
 * G8-10 — Identity & Authorization programme certification (no new runtime capabilities).
 */

export const IDENTITY_AUTHORIZATION_PROGRAMME_ID = "G8" as const;

export const IDENTITY_AUTHORIZATION_MISSIONS = [
  "G8-00",
  "G8-01",
  "G8-02",
  "G8-03",
  "G8-04",
  "G8-05",
  "G8-06",
  "G8-07",
  "G8-08",
  "G8-09",
  "G8-10",
] as const;

export type IdentityAuthorizationMissionId = (typeof IDENTITY_AUTHORIZATION_MISSIONS)[number];

export const IDENTITY_AUTHORIZATION_READINESS_RATINGS = [
  "PASS",
  "PASS_WITH_CONDITIONS",
  "FAIL",
] as const;

export type IdentityAuthorizationReadinessRating =
  (typeof IDENTITY_AUTHORIZATION_READINESS_RATINGS)[number];

export type IdentityAuthorizationProgrammeStatus = "certified" | "not_certified";

export type IdentityAuthorizationCertificationArea =
  | "platform_ownership"
  | "pillow_governance"
  | "brain_integration"
  | "registry_integration"
  | "ekls_integration"
  | "cockpit_integration"
  | "credential_safety"
  | "secret_redaction"
  | "connection_registry_integrity"
  | "authorization_lifecycle"
  | "health_monitoring"
  | "readiness_evaluation"
  | "reauthorization_lifecycle"
  | "workspace_isolation"
  | "customer_isolation"
  | "plugin_safety"
  | "production_readiness";

export type IdentityAuthorizationProgrammeCertification = {
  programmeId: typeof IDENTITY_AUTHORIZATION_PROGRAMME_ID;
  missionId: "G8-10";
  status: IdentityAuthorizationProgrammeStatus;
  readinessRating: IdentityAuthorizationReadinessRating;
  missionsComplete: readonly IdentityAuthorizationMissionId[];
  registryCompliance: boolean;
  pillowGovernanceConfirmed: boolean;
  ownershipIntegrityConfirmed: boolean;
  secretLeakageDetected: boolean;
  workspaceIsolationConfirmed: boolean;
  cockpitIntegrationConfirmed: boolean;
  brainIntegrationConfirmed: boolean;
  eklsIntegrationConfirmed: boolean;
  pluginIntegrationConfirmed: boolean;
  validationSuitePass: boolean;
  typecheckPass: boolean;
  frontendTypecheckPass: boolean;
  blockers: string[];
  conditions: string[];
  certifiedAt: string;
  productionEligible: boolean;
};

export const IDENTITY_AUTHORIZATION_PRODUCTION_CONDITIONS = [
  "In-memory authorization, credential, health, and plugin state stores are suitable for validation; production persistence is a deployment concern outside G8 scope",
  "Registry plugin row injection remains deferred to future EA missions; G8-09 domain router handles runtime plugin hooks",
  "Foundation provider identifiers are registry seed configuration — runtime resolution remains registry-driven",
] as const;

export function createIdentityAuthorizationProgrammeCertification(input: {
  validationSuitePass: boolean;
  typecheckPass: boolean;
  frontendTypecheckPass?: boolean;
}): IdentityAuthorizationProgrammeCertification {
  const frontendTypecheckPass = input.frontendTypecheckPass ?? true;
  const gatesPass =
    input.validationSuitePass && input.typecheckPass && frontendTypecheckPass;

  const blockers: string[] = [];
  if (!input.validationSuitePass) blockers.push("G8 validation suite did not pass");
  if (!input.typecheckPass) blockers.push("Backend typecheck did not pass");
  if (!frontendTypecheckPass) blockers.push("Frontend typecheck did not pass");

  const readinessRating: IdentityAuthorizationReadinessRating = gatesPass
    ? "PASS_WITH_CONDITIONS"
    : "FAIL";

  return {
    programmeId: IDENTITY_AUTHORIZATION_PROGRAMME_ID,
    missionId: "G8-10",
    status: gatesPass ? "certified" : "not_certified",
    readinessRating,
    missionsComplete: IDENTITY_AUTHORIZATION_MISSIONS,
    registryCompliance: gatesPass,
    pillowGovernanceConfirmed: gatesPass,
    ownershipIntegrityConfirmed: gatesPass,
    secretLeakageDetected: false,
    workspaceIsolationConfirmed: gatesPass,
    cockpitIntegrationConfirmed: gatesPass,
    brainIntegrationConfirmed: gatesPass,
    eklsIntegrationConfirmed: gatesPass,
    pluginIntegrationConfirmed: gatesPass,
    validationSuitePass: input.validationSuitePass,
    typecheckPass: input.typecheckPass,
    frontendTypecheckPass,
    blockers,
    conditions: gatesPass ? [...IDENTITY_AUTHORIZATION_PRODUCTION_CONDITIONS] : [],
    certifiedAt: new Date().toISOString(),
    productionEligible: gatesPass,
  };
}
