/**
 * EmpireAI Version 1.0 certification service (governance only — no new runtime capabilities).
 */

import { randomUUID } from "node:crypto";

import {
  assessEmpireV1Activation,
  createEmpireV1ActivationCertification,
  EMPIRE_V1_PRODUCTION_DOMAIN,
} from "../../empire-activation/index.js";
import { buildVersion1Lockdown } from "../../../runtime/version-1-lockdown/index.js";
import {
  EMPIREAI_VERSION_1_0,
  EMPIREAI_VERSION_1_0_DISPLAY,
  EMPIRE_V1_CERTIFIED_PROGRAMMES,
  EMPIRE_VERSION_GOVERNANCE_MISSION_ID,
  type EmpireVersion1Certification,
  type EmpireVersionReadinessRating,
} from "../contracts/version-governance-types.js";
import { VERSION_LOCK_FUTURE_CHANGES_POLICY } from "../doctrine/version-lock-doctrine.js";

export const EMPIRE_V1_RELEASE_DATE = "2026-07-03" as const;

export const EMPIRE_V1_LOCK_CONDITIONS = [
  "Live DNS for https://empire-ai.co must point to Vercel deployment — GoDaddy parking page is not EmpireAI",
  "Production persistence for in-memory subsystem stores remains a deployment configuration concern",
  "Voice interaction uses browser Web Speech API — provider selection remains Brain-governed",
  "Version 2+ planning occurs inside EmpireAI through Pillow — Cursor remains engineering IDE",
  VERSION_LOCK_FUTURE_CHANGES_POLICY,
] as const;

const CANONICAL_WORKSPACE_ID = "ws_empire_1";
const CANONICAL_COMPANY_ID = "co-grand-king";

export function createEmpireVersion1Certification(input: {
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
  repositoryIntegrityPass?: boolean;
  architectureIntegrityPass?: boolean;
}): EmpireVersion1Certification {
  const activation = createEmpireV1ActivationCertification({
    validationSuitePass: input.validationSuitePass,
    backendTypecheckPass: input.backendTypecheckPass,
    frontendTypecheckPass: input.frontendTypecheckPass,
    productionDomain: EMPIRE_V1_PRODUCTION_DOMAIN,
  });

  const lockdown = buildVersion1Lockdown(CANONICAL_WORKSPACE_ID, CANONICAL_COMPANY_ID);
  const baselineHash = lockdown.baseline.versionLock.baselineHash;

  const gatesPass =
    input.validationSuitePass &&
    input.backendTypecheckPass &&
    input.frontendTypecheckPass &&
    activation.status === "activated" &&
    lockdown.architectureComplete;

  const repositoryIntegrityPass = input.repositoryIntegrityPass ?? gatesPass;
  const architectureIntegrityPass = input.architectureIntegrityPass ?? lockdown.architectureComplete;

  const blockers: string[] = [...activation.blockers];
  if (!repositoryIntegrityPass) blockers.push("Repository integrity did not pass");
  if (!architectureIntegrityPass) blockers.push("Architecture integrity did not pass");
  if (!lockdown.baseline.versionLock.locked) blockers.push("Version 1 baseline is not locked");

  const readinessRating: EmpireVersionReadinessRating = gatesPass
    ? "PASS_WITH_CONDITIONS"
    : "FAIL";

  return {
    version: EMPIREAI_VERSION_1_0,
    displayName: EMPIREAI_VERSION_1_0_DISPLAY,
    missionId: EMPIRE_VERSION_GOVERNANCE_MISSION_ID,
    status: gatesPass ? "LOCKED" : "NOT_CERTIFIED",
    readinessRating,
    productionStatus: gatesPass ? "ACTIVE" : "PENDING",
    releaseDate: EMPIRE_V1_RELEASE_DATE,
    programmesComplete: EMPIRE_V1_CERTIFIED_PROGRAMMES,
    validationSuitePass: input.validationSuitePass,
    backendTypecheckPass: input.backendTypecheckPass,
    frontendTypecheckPass: input.frontendTypecheckPass,
    repositoryIntegrityPass,
    architectureIntegrityPass,
    productionEligible: gatesPass,
    blockers: gatesPass ? [] : blockers,
    conditions: gatesPass ? [...EMPIRE_V1_LOCK_CONDITIONS] : [],
    certifiedAt: new Date().toISOString(),
    baselineHash,
  };
}

export function assessEmpireVersion1Certification(input: {
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
}) {
  const certification = createEmpireVersion1Certification(input);
  const activationReport = assessEmpireV1Activation(input);

  return {
    certification,
    activationReport,
    correlationId: randomUUID(),
    generatedAt: new Date().toISOString(),
  };
}
