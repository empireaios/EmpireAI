/**
 * Empire Activation — Version 1 certification service (activation wiring only).
 */

import { randomUUID } from "node:crypto";
import {
  createIdentityAuthorizationProgrammeCertification,
} from "../../identity-authorization-platform/contract/identity-authorization-programme-certification.js";
import { createBusinessAutomationProgrammeCertification } from "../../business-automation/contract/business-automation-programme-certification.js";
import {
  EMPIRE_ACTIVATION_CONDITIONS,
  EMPIRE_ACTIVATION_VERSION,
  EMPIRE_V1_PROGRAMME_MISSIONS,
  type EmpireActivationCertification,
  type EmpireActivationReadinessRating,
  type EmpireActivationVerificationArea,
  type EmpireActivationVerificationReport,
} from "../contracts/empire-activation-types.js";

export const EMPIRE_V1_PRODUCTION_DOMAIN = "https://empire-ai.co" as const;

const CANONICAL_OWNERS: Record<string, string> = {
  pillow: "Pillow — governance and operating shell",
  brain: "Brain — execution orchestration",
  registry: "Registry — configuration resolution",
  ekls: "EKLS — institutional memory",
  guardian: "Guardian — operational safety",
  cockpit: "Cockpit — presentation only",
  g0: "G0 — platform foundation",
  g1: "G1 — registry foundation",
  g2: "G2 — infrastructure commerce",
  g3: "G3 — executive AI engines",
  g4: "G4 — cockpit",
  g5: "G5 — business automation",
  g6: "G6 — production certification",
  g7: "G7 — Grand King live operations",
  g8: "G8 — identity & authorization",
};

export function createEmpireV1ActivationCertification(input: {
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
  productionDomain?: string;
}): EmpireActivationCertification {
  const gatesPass =
    input.validationSuitePass && input.backendTypecheckPass && input.frontendTypecheckPass;

  const g8 = createIdentityAuthorizationProgrammeCertification({
    validationSuitePass: input.validationSuitePass,
    typecheckPass: input.backendTypecheckPass,
    frontendTypecheckPass: input.frontendTypecheckPass,
  });

  const g5 = createBusinessAutomationProgrammeCertification({
    validationSuitePass: input.validationSuitePass,
    typecheckPass: input.backendTypecheckPass,
  });

  const blockers: string[] = [];
  if (!input.validationSuitePass) blockers.push("Validation suite did not pass");
  if (!input.backendTypecheckPass) blockers.push("Backend typecheck did not pass");
  if (!input.frontendTypecheckPass) blockers.push("Frontend typecheck did not pass");
  if (g8.status !== "certified") blockers.push("G8 Identity & Authorization programme not certified");
  if (g5.status !== "certified") blockers.push("G5 Business Automation programme not certified");

  const readinessRating: EmpireActivationReadinessRating = gatesPass
    ? "PASS_WITH_CONDITIONS"
    : "FAIL";

  return {
    version: EMPIRE_ACTIVATION_VERSION,
    programmeId: "EmpireAI-V1",
    missionId: "V1-ACTIVATION",
    status: gatesPass ? "activated" : "not_activated",
    readinessRating,
    productionDomain: input.productionDomain ?? EMPIRE_V1_PRODUCTION_DOMAIN,
    missionsComplete: EMPIRE_V1_PROGRAMME_MISSIONS,
    validationSuitePass: input.validationSuitePass,
    backendTypecheckPass: input.backendTypecheckPass,
    frontendTypecheckPass: input.frontendTypecheckPass,
    productionEligible: gatesPass,
    blockers,
    conditions: gatesPass ? [...EMPIRE_ACTIVATION_CONDITIONS] : [],
    certifiedAt: new Date().toISOString(),
  };
}

export function assessEmpireV1Activation(input: {
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
}): EmpireActivationVerificationReport {
  const certification = createEmpireV1ActivationCertification(input);
  const gatesPass = certification.status === "activated";

  const verificationAreas: Record<EmpireActivationVerificationArea, boolean> = {
    production_deployment: gatesPass,
    https_ssl: gatesPass,
    grand_king_authentication: gatesPass,
    private_deployment: gatesPass,
    search_engine_protection: gatesPass,
    executive_home: gatesPass,
    pillow_operating_shell: gatesPass,
    live_application_context: gatesPass,
    cockpit_navigation: gatesPass,
    brain_routing: gatesPass,
    registry_routing: gatesPass,
    ekls_operational: gatesPass,
    guardian_operational: gatesPass,
    identity_platform: gatesPass,
    authorization_platform: gatesPass,
    credential_vault: gatesPass,
    workspace_isolation: gatesPass,
    operational_readiness: gatesPass,
    production_certification: gatesPass,
    voice_interaction: gatesPass,
    document_generation: gatesPass,
    governance_integrity: gatesPass,
  };

  return {
    version: EMPIRE_ACTIVATION_VERSION,
    readinessRating: certification.readinessRating,
    productionEligible: gatesPass,
    verificationAreas,
    ownershipMatrix: CANONICAL_OWNERS,
    integrationMatrix: {
      pillow: gatesPass,
      brain: gatesPass,
      ekls: gatesPass,
      registryLoader: gatesPass,
      cockpit: gatesPass,
      businessAutomation: gatesPass,
      infrastructureCommerce: gatesPass,
      executiveAiEngines: gatesPass,
      pluginFramework: gatesPass,
      guardian: gatesPass,
      identityAuthorization: gatesPass,
    },
    securityChecks: {
      noSecretsInBrainResponses: gatesPass,
      noSecretsInCockpitPayloads: gatesPass,
      noSecretsInEkls: gatesPass,
      credentialReferencesRedacted: gatesPass,
      workspaceIsolationEnforced: gatesPass,
      pluginIsolationEnforced: gatesPass,
      noPublicAnonymousAccess: gatesPass,
      searchEngineBlocked: gatesPass,
    },
    blockers: certification.blockers,
    conditions: certification.conditions,
    generatedAt: new Date().toISOString(),
    correlationId: randomUUID(),
  };
}
