/**
 * Empire Activation — Version 1 completion types (activation only, no new architecture).
 */

export const EMPIRE_ACTIVATION_VERSION = "empire-v1-activation-v1" as const;

export const EMPIRE_V1_PROGRAMME_MISSIONS = [
  "G0",
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "V1-ACTIVATION",
] as const;

export type EmpireV1ProgrammeMission = (typeof EMPIRE_V1_PROGRAMME_MISSIONS)[number];

export const EMPIRE_ACTIVATION_READINESS_RATINGS = [
  "PASS",
  "PASS_WITH_CONDITIONS",
  "FAIL",
] as const;

export type EmpireActivationReadinessRating =
  (typeof EMPIRE_ACTIVATION_READINESS_RATINGS)[number];

export type EmpireActivationVerificationArea =
  | "production_deployment"
  | "https_ssl"
  | "grand_king_authentication"
  | "private_deployment"
  | "search_engine_protection"
  | "executive_home"
  | "pillow_operating_shell"
  | "live_application_context"
  | "cockpit_navigation"
  | "brain_routing"
  | "registry_routing"
  | "ekls_operational"
  | "guardian_operational"
  | "identity_platform"
  | "authorization_platform"
  | "credential_vault"
  | "workspace_isolation"
  | "operational_readiness"
  | "production_certification"
  | "voice_interaction"
  | "document_generation"
  | "governance_integrity";

export type EmpireActivationCertification = {
  version: typeof EMPIRE_ACTIVATION_VERSION;
  programmeId: "EmpireAI-V1";
  missionId: "V1-ACTIVATION";
  status: "activated" | "not_activated";
  readinessRating: EmpireActivationReadinessRating;
  productionDomain: string;
  missionsComplete: readonly EmpireV1ProgrammeMission[];
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
  productionEligible: boolean;
  blockers: string[];
  conditions: string[];
  certifiedAt: string;
};

export type EmpireActivationVerificationReport = {
  version: typeof EMPIRE_ACTIVATION_VERSION;
  readinessRating: EmpireActivationReadinessRating;
  productionEligible: boolean;
  verificationAreas: Record<EmpireActivationVerificationArea, boolean>;
  ownershipMatrix: Record<string, string>;
  integrationMatrix: Record<string, boolean>;
  securityChecks: Record<string, boolean>;
  blockers: string[];
  conditions: string[];
  generatedAt: string;
  correlationId: string;
};

export const EMPIRE_ACTIVATION_CONDITIONS = [
  "Production persistence for in-memory subsystem stores remains a deployment configuration concern",
  "Voice interaction uses browser Web Speech API — provider selection remains Brain-governed",
  "Visual canvas outputs open from Pillow when responses exceed chat panel capacity",
  "Version 2+ planning occurs inside EmpireAI through Pillow — Cursor remains engineering IDE",
] as const;
